import { jest } from "@jest/globals";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      // Simple mock that returns the key if no translation, or a constant
      const translations: Record<string, string> = {
        "chatList.title": "Chats",
        "chatList.empty": "No conversations yet",
        "chatList.search": "Search chats",
        "chatList.unreadCount": "{{count}} unread",
        "chatList.unreadCount_plural": "{{count}} unread",
        "chat.inputPlaceholder": "Type a message...",
        "chat.send": "Send",
        "chat.back": "Back",
        "chat.messages": "Messages",
        "chat.messageFrom": "Message from",
        "time.justNow": "Just now",
        "time.minutesAgo": "{{count}} minute ago",
        "time.minutesAgo_plural": "{{count}} minutes ago",
        "time.hoursAgo": "{{count}} hour ago",
        "time.hoursAgo_plural": "{{count}} hours ago",
        "time.daysAgo": "{{count}} day ago",
        "time.daysAgo_plural": "{{count}} days ago",
        "time.weeksAgo": "{{count}} week ago",
        "time.weeksAgo_plural": "{{count}} weeks ago",
        "time.monthsAgo": "{{count}} month ago",
        "time.monthsAgo_plural": "{{count}} months ago",
        "general.loading": "Loading...",
        "general.error": "Something went wrong",
        "general.retry": "Retry",
        "general.cancel": "Cancel",
        "general.ok": "OK",
        "general.yes": "Yes",
        "general.no": "No",
        "accessibility.chatItem": "{{name}}, Chat",
        "accessibility.chatItemWithUnread": "{{name}}, Chat, {{count}} unread messages",
        "accessibility.unreadBadge": "{{count}} unread messages",
        "accessibility.sendButton": "Send message",
        "accessibility.sendButtonHint": "Sends the typed message",
        "accessibility.messageInput": "Message input",
        "accessibility.messageInputHint": "Type a message to send",
        "accessibility.backButton": "Go back to chat list",
        "accessibility.backButtonHint": "Returns to the chat list screen",
        "accessibility.messageBubble": "Message from {{sender}}: {{text}}",
        "accessibility.chatName": "Chat with {{name}}",
        "accessibility.loadingChat": "Loading chat",
        "accessibility.chatList": "Chat list",
        "accessibility.messages": "Messages",
      };

      // Handle interpolation for count-based translations
      if (options && typeof options.count === "number") {
        const pluralKey = key + (options.count === 1 ? "" : "_plural");
        if (translations[pluralKey]) {
          return translations[pluralKey].replace("{{count}}", options.count.toString());
        }
      }

      // Handle general interpolation
      if (options && typeof options === "object") {
        let result = translations[key] || key;
        Object.keys(options).forEach((optionKey) => {
          result = result.replace(new RegExp(`{{${optionKey}}}`, "g"), options[optionKey]);
        });
        return result;
      }

      return translations[key] || key;
    },
    i18n: {
      language: "en",
      dir: () => "ltr",
      changeLanguage: jest.fn(),
      t: jest.fn((key: string) => key),
    },
  }),
  I18nextProvider: ({ children }: any) => children,
}));

// Mock expo-localization for tests
jest.mock("expo-localization", () => ({
  getLocales: () => [
    {
      languageCode: "en",
      languageTag: "en-US",
      currencyCode: "USD",
      regionCode: "US",
      isRTL: false,
    },
  ],
}));

// Mock date-fns locales for tests
jest.mock("date-fns/locale", () => ({
  enUS: {
    code: "en-US",
    formatDistance: jest.fn(),
    formatRelative: jest.fn(),
  },
  arSA: {
    code: "ar-SA",
    formatDistance: jest.fn(),
    formatRelative: jest.fn(),
  },
}));

// Mock the date helper functions
jest.mock("../i18n/dateHelper", () => ({
  timeAgo: jest.fn((date: Date) => "2 hours ago"),
  formatDate: jest.fn((date: Date) => "January 1, 2023"),
  formatTime: jest.fn((date: Date) => "3:30 PM"),
  formatDateTime: jest.fn((date: Date) => "January 1, 2023 at 3:30 PM"),
  getRelativeTime: jest.fn((date: Date) => "2 hours ago"),
  formatMessageTime: jest.fn((date: Date) => "3:30 PM"),
  getCurrentLocale: jest.fn(() => ({ code: "en-US" })),
}));

// Mock RTL helper functions
jest.mock("../i18n/rtl", () => ({
  applyRTL: jest.fn(() => false),
  useRTL: jest.fn(() => false),
  getTextAlign: jest.fn((align) => (align === "auto" ? "left" : align)),
  getDirectionalStyle: jest.fn(() => ({})),
  getDirectionalPadding: jest.fn(() => ({})),
  getWritingDirection: jest.fn(() => "ltr"),
}));

// Mock i18n index file
jest.mock("../i18n/index", () => ({
  default: {
    language: "en",
    dir: () => "ltr",
    changeLanguage: jest.fn(),
    t: jest.fn((key: string) => key),
    use: jest.fn(() => ({ init: jest.fn() })),
  },
}));
