/**
 * Feature Flags Tests
 * Tests for enterprise feature flag management system
 */

import {
  useFeatureFlagsStore,
  useFeatureFlag,
  useFeatureFlags,
  FeatureFlag,
  FeatureFlagCondition,
} from "../FeatureFlags";

jest.mock("react-native-mmkv", () => {
  const instances: any[] = [];
  const MMKV = Object.assign(
    jest.fn().mockImplementation(() => {
      const instance = {
        set: jest.fn(),
        getString: jest.fn().mockReturnValue(null),
        delete: jest.fn(),
      };
      instances.push(instance);
      return instance;
    }),
    { __instances: instances }
  );
  return { MMKV };
});

const mockStoreState = {
  flags: {
    "message-reactions": {
      id: "message-reactions",
      name: "Message Reactions",
      enabled: true,
      rolloutPercentage: 100,
      conditions: [],
      lastUpdated: "2024-01-01T00:00:00Z",
    },
    "dark-mode-v2": {
      id: "dark-mode-v2",
      name: "Dark Mode V2",
      enabled: false,
      rolloutPercentage: 0,
      conditions: [],
      lastUpdated: "2024-01-01T00:00:00Z",
    },
  },
  userContext: {},
  isEnabled: (id: string) => mockStoreState.flags[id]?.enabled ?? false,
  getFlag: (id: string) => mockStoreState.flags[id] ?? null,
  resetFlags: jest.fn(),
  setUserContext: jest.fn(),
};

jest.mock("zustand", () => ({
  create: jest.fn(() => (config: any) => {
    const hook = (selector?: any) => {
      if (typeof selector === "function") return selector(mockStoreState);
      return mockStoreState;
    };
    return Object.assign(hook, {
      getState: jest.fn(() => mockStoreState),
      setState: jest.fn(),
      subscribe: jest.fn(() => jest.fn()),
      destroy: jest.fn(),
    });
  }),
}));

jest.mock("zustand/middleware", () => ({
  persist: (config: any) => config,
  createJSONStorage: () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  }),
}));

jest.mock("../../logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe("FeatureFlags", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useFeatureFlagsStore.getState().resetFlags();
  });

  describe("useFeatureFlag hook", () => {
    it("should return isEnabled and flag for an existing flag", () => {
      const { result } = renderHook(() => useFeatureFlag("message-reactions"));
      expect(result.current.isEnabled).toBe(true);
      expect(result.current.flag).toBeDefined();
      expect(result.current.flag.name).toBe("Message Reactions");
    });

    it("should return isEnabled false for disabled flag", () => {
      const { result } = renderHook(() => useFeatureFlag("dark-mode-v2"));
      expect(result.current.isEnabled).toBe(false);
    });
  });

  describe("useFeatureFlags hook", () => {
    it("should return store state with enabled and disabled flags", () => {
      const { result } = renderHook(() => useFeatureFlags());
      expect(result.current.flags).toBeDefined();
      expect(typeof result.current.enabledFlags).toBe("object");
      expect(typeof result.current.disabledFlags).toBe("object");
    });
  });

  describe("useFeatureFlagsStore", () => {
    it("should return store state", () => {
      const state = useFeatureFlagsStore.getState();
      expect(state.flags).toBeDefined();
      expect(state.isEnabled).toBeDefined();
    });

    it("should return isEnabled from state", () => {
      expect(useFeatureFlagsStore.getState().isEnabled("message-reactions")).toBe(true);
      expect(useFeatureFlagsStore.getState().isEnabled("dark-mode-v2")).toBe(false);
    });
  });
});

function renderHook(hook: () => any) {
  const result: any = { current: hook() };
  return { result };
}
