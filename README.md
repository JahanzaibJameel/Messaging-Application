# ChatApp – Offline-First Messaging Application 📱

A **scalable, WhatsApp-inspired messaging application** built with **React Native** and **Expo**.  
This project demonstrates **clean architecture, offline-first design**, and realistic chat behavior using a fully mocked backend.  

> Built to showcase how modern chat applications are structured, optimized, and maintained in real-world products.

---

## 🚀 Core Features

### Authentication (Mocked)
- Splash screen with lightweight brand animation  
- Phone number login flow  
- OTP verification (mocked for local development)  
- Persistent user session with auto-login  

### Chat List
- Optimized chat list rendering  
- Private and group conversations  
- Last message preview with timestamps  
- Unread message counters  
- Online / offline presence (simulated)  
- Pinned and muted chats  
- Search with debounce  
- Pull-to-refresh interaction  

### Messaging
- Sender / receiver bubble layout  
- Message lifecycle states: `sending → sent → delivered → read`  
- Read receipts (single / double / read)  
- Typing indicator with animation  
- Reply-to-message threading  
- Long-press actions (reply, copy, delete)  
- Smooth scrolling and auto-scroll handling  

### Group Chats
- Group creation and participant management  
- Admin privileges (add / remove admins)  
- Mute notifications  
- Leave group flow  
- Group information screen  

### Media Messages (UI-Focused)
- Image message preview with loading states  
- Video message UI with duration indicator  
- Local-only media simulation  

### Message Input
- Adaptive multi-line input  
- Keyboard-aware layout  
- Animated send / mic transition  
- Emoji and attachment actions (UI only)  

### Status & Calls (UI Modules)
- Story-style status list with seen / unseen logic  
- Circular progress indicator  
- Audio / video call history UI  
- Incoming / outgoing / missed call indicators  

### Settings
- Profile information  
- Light / dark theme support  
- Chat wallpaper (UI only)  
- Clear chat history  
- Logout flow  

---

## 🛠️ Tech Stack
- **React Native (Expo)**  
- **TypeScript**  
- **Zustand** – predictable global state  
- **AsyncStorage** – offline persistence  
- **React Native Reanimated** – animations  
- **React Native Gesture Handler** – gestures  
- **Day.js** – time formatting  

---

## 🏗 Architecture Overview
- Offline-first data model  
- Local message queue with retry handling  
- Simulated real-time updates  
- Centralized state management  
- Feature-based folder structure  
- Reusable UI primitives and hooks  

> Detailed design notes available in [`docs/SYNC_ENGINE_ARCHITECTURE.md`](docs/SYNC_ENGINE_ARCHITECTURE.md)

---
