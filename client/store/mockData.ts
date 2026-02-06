import { User, Chat, Message, Status, Call, GroupChat } from "./types";

export const mockUsers: User[] = [
  {
    id: "user1",
    name: "Alice Johnson",
    phone: "+1 234 567 8901",
    isOnline: true,
  },
  {
    id: "user2",
    name: "Bob Smith",
    phone: "+1 234 567 8902",
    isOnline: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "user3",
    name: "Carol Williams",
    phone: "+1 234 567 8903",
    isOnline: true,
  },
  {
    id: "user4",
    name: "David Brown",
    phone: "+1 234 567 8904",
    isOnline: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "user5",
    name: "Emma Davis",
    phone: "+1 234 567 8905",
    isOnline: true,
  },
  {
    id: "user6",
    name: "Frank Miller",
    phone: "+1 234 567 8906",
    isOnline: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

export const mockMessages: Message[] = [
  {
    id: "msg1",
    chatId: "chat1",
    senderId: "user1",
    text: "Hey! How are you doing?",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    status: "read",
  },
  {
    id: "msg2",
    chatId: "chat1",
    senderId: "currentUser",
    text: "I'm doing great, thanks! Just finished that project we talked about.",
    timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    status: "read",
  },
  {
    id: "msg3",
    chatId: "chat1",
    senderId: "user1",
    text: "That's awesome! Can't wait to see it.",
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    status: "read",
  },
  {
    id: "msg4",
    chatId: "chat2",
    senderId: "user2",
    text: "Are we still meeting tomorrow?",
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    status: "delivered",
  },
  {
    id: "msg5",
    chatId: "chat3",
    senderId: "currentUser",
    text: "Just sent you the files!",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    status: "delivered",
  },
  {
    id: "msg6",
    chatId: "chat4",
    senderId: "user4",
    text: "Thanks for your help yesterday!",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    status: "read",
  },
  {
    id: "msg7",
    chatId: "chat1",
    senderId: "currentUser",
    attachment: {
      type: "image",
      uri: "https://picsum.photos/400/300",
      width: 400,
      height: 300,
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    status: "read",
  },
  {
    id: "msg8",
    chatId: "group1",
    senderId: "user1",
    text: "Welcome to the team group!",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    status: "read",
  },
  {
    id: "msg9",
    chatId: "group1",
    senderId: "user3",
    text: "Thanks for adding me!",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
    status: "read",
  },
  {
    id: "msg10",
    chatId: "group1",
    senderId: "currentUser",
    text: "Great to have everyone here!",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
    status: "read",
  },
];

export const mockChats: Chat[] = [
  {
    id: "chat1",
    type: "private",
    participantId: "user1",
    lastMessage: mockMessages.find((m) => m.id === "msg7"),
    unreadCount: 0,
    isPinned: true,
  },
  {
    id: "chat2",
    type: "private",
    participantId: "user2",
    lastMessage: mockMessages.find((m) => m.chatId === "chat2"),
    unreadCount: 1,
  },
  {
    id: "chat3",
    type: "private",
    participantId: "user3",
    lastMessage: mockMessages.find((m) => m.chatId === "chat3"),
    unreadCount: 0,
  },
  {
    id: "chat4",
    type: "private",
    participantId: "user4",
    lastMessage: mockMessages.find((m) => m.chatId === "chat4"),
    unreadCount: 0,
    isMuted: true,
  },
];

export const mockGroupChats: GroupChat[] = [
  {
    id: "group1",
    type: "group",
    name: "Project Team",
    description: "Team discussion for the new project",
    participants: ["currentUser", "user1", "user3", "user5"],
    adminIds: ["currentUser", "user1"],
    createdBy: "currentUser",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    lastMessage: mockMessages.find((m) => m.id === "msg10"),
    unreadCount: 0,
  },
  {
    id: "group2",
    type: "group",
    name: "Family",
    description: "Family chat group",
    participants: ["currentUser", "user2", "user4", "user6"],
    adminIds: ["currentUser"],
    createdBy: "currentUser",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    unreadCount: 3,
    isMuted: true,
  },
];

export const mockStatuses: Status[] = [
  {
    id: "status1",
    userId: "user1",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    viewed: false,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 23).toISOString(),
  },
  {
    id: "status2",
    userId: "user3",
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    viewed: true,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 22).toISOString(),
  },
  {
    id: "status3",
    userId: "user5",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    viewed: false,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 20).toISOString(),
  },
];

export const mockCalls: Call[] = [
  {
    id: "call1",
    participantId: "user1",
    type: "video",
    direction: "outgoing",
    status: "answered",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    duration: 325,
  },
  {
    id: "call2",
    participantId: "user2",
    type: "audio",
    direction: "incoming",
    status: "missed",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "call3",
    participantId: "user3",
    type: "audio",
    direction: "outgoing",
    status: "answered",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    duration: 120,
  },
  {
    id: "call4",
    participantId: "user4",
    type: "video",
    direction: "incoming",
    status: "declined",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

export const autoReplies = [
  "That sounds great!",
  "I'll get back to you on that.",
  "Thanks for letting me know!",
  "Sure, no problem!",
  "Interesting, tell me more.",
  "Got it, thanks!",
  "I was just thinking about that!",
  "Perfect, see you then!",
  "Sounds like a plan!",
  "Can't wait!",
];

export const sampleImages = [
  "https://picsum.photos/400/300?random=1",
  "https://picsum.photos/300/400?random=2",
  "https://picsum.photos/400/400?random=3",
];
