# Sync Engine Architecture

## Overview

The ChatApp Sync Engine is designed to handle offline-first messaging with eventual consistency. This document outlines the architecture, data flow, and synchronization strategies used in the application.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   UI Layer   │  │  State Store │  │   Sync Manager       │   │
│  │   (React)    │◄─┤   (Zustand)  │◄─┤   (SyncEngine)       │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│         │                 │                    │                 │
│         ▼                 ▼                    ▼                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Persistence Layer                       │   │
│  │                    (AsyncStorage)                         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        NETWORK LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌────────────────┐  ┌─────────────────┐  │
│  │  WebSocket       │  │  REST API      │  │  Retry Queue    │  │
│  │  (Real-time)     │  │  (Batch Sync)  │  │  (Failed Msgs)  │  │
│  └──────────────────┘  └────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SERVER LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   API Gateway │  │  Message     │  │   Notification       │   │
│  │               │  │  Service     │  │   Service            │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Database Layer                         │   │
│  │               (PostgreSQL + Redis Cache)                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. State Store (Zustand)

The central state management using Zustand with persistence:

```typescript
interface SyncState {
  lastSyncTimestamp: string | null;
  pendingMessages: Message[];
  syncStatus: "idle" | "syncing" | "error";
}
```

**Responsibilities:**
- Maintain local message state
- Track pending/failed messages
- Handle optimistic updates
- Persist state to AsyncStorage

### 2. Sync Manager

Coordinates synchronization between local state and remote server:

```typescript
class SyncManager {
  // Queue for pending operations
  private pendingQueue: Operation[];
  
  // Sync state
  private lastSyncCursor: string | null;
  
  // Core methods
  async sync(): Promise<void>;
  async pushPendingMessages(): Promise<void>;
  async pullNewMessages(): Promise<void>;
  resolveConflicts(local: Message, remote: Message): Message;
}
```

### 3. Message States

Messages transition through the following states:

```
┌──────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐
│ SENDING  │───►│   SENT   │───►│ DELIVERED │───►│   READ   │
└──────────┘    └──────────┘    └───────────┘    └──────────┘
      │                                                │
      │              ┌──────────┐                      │
      └─────────────►│  FAILED  │◄─────────────────────┘
                     └──────────┘
                          │
                          ▼
                     ┌──────────┐
                     │  RETRY   │
                     └──────────┘
```

**State Definitions:**
- `SENDING`: Message created locally, pending server acknowledgment
- `SENT`: Server received the message
- `DELIVERED`: Message delivered to recipient device
- `READ`: Recipient opened/viewed the message
- `FAILED`: Send failed, available for retry

## Data Flow

### Sending a Message

```
1. User taps send
   │
   ▼
2. Create message with status "sending"
   │
   ▼
3. Update UI optimistically
   │
   ▼
4. Persist to AsyncStorage
   │
   ▼
5. Push to server via WebSocket/API
   │
   ├─────────────────────────────┐
   ▼                             ▼
6a. Success                   6b. Failure
   │                             │
   ▼                             ▼
7a. Update status to "sent"   7b. Update status to "failed"
   │                             │
   ▼                             ▼
8a. Wait for delivery ACK     8b. Add to retry queue
```

### Receiving Messages

```
1. WebSocket receives message event
   │
   ▼
2. Validate message structure
   │
   ▼
3. Check for duplicates (by ID)
   │
   ▼
4. Insert into local state
   │
   ▼
5. Persist to AsyncStorage
   │
   ▼
6. Send delivery ACK to server
   │
   ▼
7. Trigger UI update
```

### Sync on App Launch

```
1. App launches
   │
   ▼
2. Load persisted state from AsyncStorage
   │
   ▼
3. Display cached data immediately
   │
   ▼
4. Check network connectivity
   │
   ├─────────────────────────────┐
   ▼                             ▼
5a. Online                    5b. Offline
   │                             │
   ▼                             └──► Queue sync for later
6. Fetch messages since lastSyncTimestamp
   │
   ▼
7. Merge with local state (resolve conflicts)
   │
   ▼
8. Push pending messages
   │
   ▼
9. Update lastSyncTimestamp
```

## Conflict Resolution

### Strategy: Last-Write-Wins with Vector Clocks

```typescript
interface MessageMeta {
  messageId: string;
  vectorClock: { [deviceId: string]: number };
  timestamp: string;
}

function resolveConflict(local: Message, remote: Message): Message {
  // Compare vector clocks
  const localClock = local.meta.vectorClock;
  const remoteClock = remote.meta.vectorClock;
  
  // If clocks are concurrent, use timestamp
  if (areConcurrent(localClock, remoteClock)) {
    return local.meta.timestamp > remote.meta.timestamp ? local : remote;
  }
  
  // Otherwise, use the more recent vector clock
  return isGreater(localClock, remoteClock) ? local : remote;
}
```

### Conflict Types

| Conflict Type | Resolution |
|---------------|------------|
| Same message edited on two devices | Last-write-wins |
| Message deleted on one device, edited on another | Delete wins |
| Read receipt conflicts | Most advanced status wins |
| Reaction conflicts | Merge both reactions |

## Offline Queue

### Queue Structure

```typescript
interface OfflineQueue {
  messages: PendingMessage[];
  operations: PendingOperation[];
}

interface PendingMessage {
  message: Message;
  retryCount: number;
  lastRetryAt: string | null;
  createdAt: string;
}

interface PendingOperation {
  type: "delete" | "react" | "read";
  targetId: string;
  payload: any;
  retryCount: number;
}
```

### Retry Strategy

```
Attempt 1: Immediate
Attempt 2: 5 seconds
Attempt 3: 30 seconds
Attempt 4: 2 minutes
Attempt 5: 10 minutes
Max Attempts: 5

After max attempts: Mark as permanently failed
```

## Real-time Updates (WebSocket)

### Event Types

```typescript
type WebSocketEvent =
  | { type: "message:new"; payload: Message }
  | { type: "message:status"; payload: { id: string; status: MessageStatus } }
  | { type: "message:reaction"; payload: { id: string; reaction: Reaction } }
  | { type: "typing:start"; payload: { chatId: string; userId: string } }
  | { type: "typing:stop"; payload: { chatId: string; userId: string } }
  | { type: "presence:update"; payload: { userId: string; isOnline: boolean } }
  | { type: "chat:updated"; payload: Chat };
```

### Connection Management

```typescript
class WebSocketManager {
  private socket: WebSocket | null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  
  connect(): void {
    this.socket = new WebSocket(WS_URL);
    
    this.socket.onclose = () => {
      this.scheduleReconnect();
    };
  }
  
  private scheduleReconnect(): void {
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    setTimeout(() => this.connect(), delay);
    this.reconnectAttempts++;
  }
}
```

## Storage Schema

### AsyncStorage Keys

```
@chatapp_state           - Main app state (user, settings)
@chatapp_messages_{id}   - Messages for chat {id}
@chatapp_pending         - Pending message queue
@chatapp_sync            - Sync metadata
```

### Data Compression

For large chat histories, messages are compressed before storage:

```typescript
async function persistMessages(chatId: string, messages: Message[]): Promise<void> {
  const compressed = LZString.compressToUTF16(JSON.stringify(messages));
  await AsyncStorage.setItem(`@chatapp_messages_${chatId}`, compressed);
}
```

## Performance Optimizations

### 1. Message Batching

Group multiple messages into single API calls:

```typescript
const BATCH_SIZE = 50;
const BATCH_INTERVAL = 100; // ms

async function batchSend(messages: Message[]): Promise<void> {
  const batches = chunk(messages, BATCH_SIZE);
  for (const batch of batches) {
    await api.sendMessages(batch);
    await sleep(BATCH_INTERVAL);
  }
}
```

### 2. Pagination

Load messages in pages for large chats:

```typescript
interface PaginationCursor {
  chatId: string;
  oldestMessageId: string | null;
  hasMore: boolean;
}

async function loadMoreMessages(cursor: PaginationCursor): Promise<Message[]> {
  return api.getMessages(cursor.chatId, {
    before: cursor.oldestMessageId,
    limit: 50,
  });
}
```

### 3. Delta Sync

Only sync changes since last sync:

```typescript
async function deltaSync(): Promise<SyncResult> {
  const lastSync = await getLastSyncTimestamp();
  
  const changes = await api.getChanges({
    since: lastSync,
    types: ["messages", "reactions", "statuses"],
  });
  
  await applyChanges(changes);
  await setLastSyncTimestamp(new Date().toISOString());
  
  return { changesApplied: changes.length };
}
```

## Security Considerations

### 1. Message Encryption

End-to-end encryption for message content:

```typescript
interface EncryptedMessage {
  id: string;
  encryptedContent: string;  // AES-256-GCM
  iv: string;
  authTag: string;
}
```

### 2. Key Exchange

Signal Protocol for key exchange:

```
1. Generate identity key pair on device
2. Generate signed pre-key
3. Generate one-time pre-keys
4. Upload public keys to server
5. Fetch recipient's keys for encryption
```

### 3. Secure Storage

Sensitive data stored in SecureStore:

```typescript
import * as SecureStore from 'expo-secure-store';

async function storeEncryptionKey(key: string): Promise<void> {
  await SecureStore.setItemAsync('encryption_key', key);
}
```

## Error Handling

### Error Categories

```typescript
enum SyncErrorType {
  NETWORK_ERROR = "NETWORK_ERROR",
  AUTH_ERROR = "AUTH_ERROR",
  CONFLICT_ERROR = "CONFLICT_ERROR",
  STORAGE_ERROR = "STORAGE_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}
```

### Recovery Strategies

| Error Type | Recovery Strategy |
|------------|-------------------|
| Network Error | Exponential backoff retry |
| Auth Error | Re-authenticate, then retry |
| Conflict Error | Apply conflict resolution |
| Storage Error | Clear corrupted data, re-sync |
| Unknown Error | Log, alert user, retry |

## Monitoring & Debugging

### Metrics to Track

- Sync latency (time to sync)
- Queue depth (pending messages)
- Retry rate (failed sends)
- Conflict rate (conflicts/sync)
- Storage usage (bytes)

### Debug Mode

```typescript
const SYNC_DEBUG = __DEV__;

function logSync(event: string, data?: any): void {
  if (SYNC_DEBUG) {
    console.log(`[SYNC] ${event}`, data);
  }
}
```

## Future Improvements

1. **Multi-device Sync**: Support for multiple devices per user
2. **Selective Sync**: User can choose which chats to sync offline
3. **Background Sync**: Use background fetch for iOS/Android
4. **Compression**: Better message compression for media
5. **Sharding**: Shard large chats across multiple storage keys

---

## Summary

The Sync Engine provides:

- ✅ Offline-first architecture
- ✅ Optimistic UI updates
- ✅ Automatic retry logic
- ✅ Conflict resolution
- ✅ Real-time updates
- ✅ Efficient storage
- ✅ Secure message handling

This architecture ensures a reliable, performant, and user-friendly messaging experience even in challenging network conditions.
