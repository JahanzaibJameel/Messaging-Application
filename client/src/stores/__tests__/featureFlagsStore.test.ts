// @ts-nocheck
/**
 * Feature Flags Store Tests
 * Tests for Zustand store with MMKV persistence and A/B testing
 */

import { renderHook, act } from "@testing-library/react-hooks";
import { useFeatureFlagsStore, DEFAULT_FEATURE_FLAGS } from "../featureFlagsStore";
import { MMKV } from "react-native-mmkv";

// Mock MMKV
jest.mock("react-native-mmkv", () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    getString: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Mock DeviceInfo
jest.mock("react-native-device-info", () => ({
  getUniqueId: jest.fn().mockResolvedValue("test-device-id"),
}));

describe("FeatureFlagsStore", () => {
  let mockMMKV: jest.Mocked<MMKV>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Get mock MMKV instance
    const MMKVConstructor = MMKV as jest.MockedClass<typeof MMKV>;
    mockMMKV =
      MMKVConstructor.mock.instances[0] ||
      ({
        set: jest.fn(),
        getString: jest.fn(),
        delete: jest.fn(),
      } as any);

    // Mock default behavior
    mockMMKV.getString.mockReturnValue(null);
  });

  describe("Initial State", () => {
    it("should initialize with default flag values", () => {
      const { result } = renderHook(() => useFeatureFlagsStore());

      const store = result.current;
      const allFlags = store.getAllFlags();

      Object.keys(DEFAULT_FEATURE_FLAGS).forEach((key) => {
        expect(allFlags[key]).toBe(DEFAULT_FEATURE_FLAGS[key].defaultValue);
      });
    });

    it("should have empty overrides initially", () => {
      const { result } = renderHook(() => useFeatureFlagsStore());

      const store = result.current;

      expect(store.overrides).toEqual({});
    });

    it("should not be loading initially", () => {
      const { result } = renderHook(() => useFeatureFlagsStore());

      const store = result.current;

      expect(store.isLoading).toBe(false);
    });
  });

  describe("Flag Management", () => {
    it("should set flag value", () => {
      const { result } = renderHook(() => useFeatureFlagsStore());

      act(() => {
        result.current.setFlag("enableVoiceMessages", true);
      });

      expect(result.current.isFlagEnabled("enableVoiceMessages")).toBe(true);
      expect(mockMMKV.set).toHaveBeenCalledWith("enableVoiceMessages", "true");
    });

    it("should get flag value correctly", () => {
      const { result } = renderHook(() => useFeatureFlagsStore());

      expect(result.current.getFlagValue("enableVoiceMessages")).toBe(false);
      expect(result.current.getFlagValue("enableDarkMode")).toBe(true);
    });

    it("should check if flag is enabled", () => {
      const { result } = renderHook(() => useFeatureFlagsStore());

      expect(result.current.isFlagEnabled("enableDarkMode")).toBe(true);
      expect(result.current.isFlagEnabled("enableVoiceMessages")).toBe(false);
    });

    it("should get all flags", () => {
      const { result } = renderHook(() => useFeatureFlagsStore());

      const allFlags = result.current.getAllFlags();

      expect(Object.keys(allFlags)).toEqual(Object.keys(DEFAULT_FEATURE_FLAGS));
      expect(allFlags.enableDarkMode).toBe(true);
      expect(allFlags.enableVoiceMessages).toBe(false);
    });
  });

  describe("Developer Overrides", () => {
    it("should set developer override", () => {
      const { result } = renderHook(() => useFeatureFlagsStore());

      act(() => {
        result.current.setOverride("enableVoiceMessages", true);
      });

      expect(result.current.isFlagEnabled("enableVoiceMessages")).toBe(true);
      expect(mockMMKV.set).toHaveBeenCalledWith(
        "developer_overrides",
        JSON.stringify({ enableVoiceMessages: true })
      );
    });

    it("should prioritize overrides over regular flags", () => {
      const { result } = renderHook(() => useFeatureFlagsStore());

      // Set regular flag
      act(() => {
        result.current.setFlag("enableVoiceMessages", true);
      });

      // Set override
      act(() => {
        result.current.setOverride("enableVoiceMessages", false);
      });

      expect(result.current.isFlagEnabled("enableVoiceMessages")).toBe(false);
    });

    it("should reset all overrides", () => {
      const { result } = renderHook(() => useFeatureFlagsStore());

      // Set some overrides
      act(() => {
        result.current.setOverride("enableVoiceMessages", true);
        result.current.setOverride("enableDarkMode", false);
      });

      // Reset overrides
      act(() => {
        result.current.resetOverrides();
      });

      expect(result.current.overrides).toEqual({});
      expect(result.current.isFlagEnabled("enableVoiceMessages")).toBe(false); // Back to default
      expect(result.current.isFlagEnabled("enableDarkMode")).toBe(true); // Back to default
      expect(mockMMKV.delete).toHaveBeenCalledWith("developer_overrides");
    });

    it("should handle undefined override", () => {
      const { result } = renderHook(() => useFeatureFlagsStore());

      act(() => {
        result.current.setOverride("enableVoiceMessages", undefined);
      });

      expect(result.current.isFlagEnabled("enableVoiceMessages")).toBe(false); // Back to default
    });
  });

  describe("Persistence", () => {
    it("should load persisted flags on initialization", () => {
      // Mock persisted values
      mockMMKV.getString
        .mockReturnValueOnce("true") // enableVoiceMessages
        .mockReturnValueOnce("false") // enableDarkMode
        .mockReturnValue(null); // Other flags

      const { result } = renderHook(() => useFeatureFlagsStore());

      expect(result.current.isFlagEnabled("enableVoiceMessages")).toBe(true);
      expect(result.current.isFlagEnabled("enableDarkMode")).toBe(false);
    });

    it("should persist flag changes", () => {
      const { result } = renderHook(() => useFeatureFlagsStore());

      act(() => {
        result.current.setFlag("enableVoiceMessages", true);
      });

      expect(mockMMKV.set).toHaveBeenCalledWith("enableVoiceMessages", "true");
    });

    it("should persist overrides", () => {
      const { result } = renderHook(() => useFeatureFlagsStore());

      act(() => {
        result.current.setOverride("enableVoiceMessages", true);
      });

      expect(mockMMKV.set).toHaveBeenCalledWith(
        "developer_overrides",
        JSON.stringify({ enableVoiceMessages: true })
      );
    });

    it("should load persisted overrides", () => {
      // Mock persisted overrides
      mockMMKV.getString.mockReturnValue(JSON.stringify({ enableVoiceMessages: true }));

      const { result } = renderHook(() => useFeatureFlagsStore());

      expect(result.current.overrides).toEqual({ enableVoiceMessages: true });
      expect(result.current.isFlagEnabled("enableVoiceMessages")).toBe(true);
    });
  });

  describe("Reset Functionality", () => {
    it("should reset all flags to defaults", () => {
      const { result } = renderHook(() => useFeatureFlagsStore());

      // Change some flags
      act(() => {
        result.current.setFlag("enableVoiceMessages", true);
        result.current.setFlag("enableDarkMode", false);
        result.current.setOverride("enableVoiceMessages", false);
      });

      // Reset to defaults
      act(() => {
        result.current.resetToDefaults();
      });

      expect(result.current.getAllFlags()).toEqual(
        Object.fromEntries(
          Object.entries(DEFAULT_FEATURE_FLAGS).map(([key, flag]) => [key, flag.defaultValue])
        )
      );
      expect(result.current.overrides).toEqual({});
    });

    it("should clear storage on reset", () => {
      const { result } = renderHook(() => useFeatureFlagsStore());

      act(() => {
        result.current.resetToDefaults();
      });

      // Should have called delete for all flags and overrides
      expect(mockMMKV.delete).toHaveBeenCalledTimes(Object.keys(DEFAULT_FEATURE_FLAGS).length + 1);
    });
  });

  describe("Error Handling", () => {
    it("should handle MMKV errors gracefully", () => {
      // Mock MMKV to throw error
      mockMMKV.set.mockImplementation(() => {
        throw new Error("Storage error");
      });

      const { result } = renderHook(() => useFeatureFlagsStore());

      // Should not throw
      expect(() => {
        act(() => {
          result.current.setFlag("enableVoiceMessages", true);
        });
      }).not.toThrow();
    });

    it("should handle JSON parsing errors for overrides", () => {
      // Mock invalid JSON for overrides
      mockMMKV.getString.mockReturnValue("invalid-json");

      const { result } = renderHook(() => useFeatureFlagsStore());

      expect(result.current.overrides).toEqual({});
    });
  });

  describe("A/B Testing Integration", () => {
    it("should initialize flags with A/B testing", async () => {
      const { result } = renderHook(() => useFeatureFlagsStore());

      // Mock initialization
      const initializePromise = act(async () => {
        await result.current.initializeFlags();
      });

      await initializePromise;

      // Should have completed initialization
      expect(result.current.isLoading).toBe(false);
    });

    it("should handle initialization errors gracefully", async () => {
      const { result } = renderHook(() => useFeatureFlagsStore());

      // Mock initialization to throw error
      const mockInitialize = jest.fn().mockRejectedValue(new Error("Init error"));
      result.current.initializeFlags = mockInitialize;

      await act(async () => {
        await result.current.initializeFlags();
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("Default Feature Flags", () => {
    it("should have correct default flag definitions", () => {
      expect(DEFAULT_FEATURE_FLAGS.enableVoiceMessages).toEqual({
        key: "enableVoiceMessages",
        name: "Voice Messages",
        description: "Enables voice message recording and playback",
        defaultValue: false,
        rolloutPercentage: 30,
        category: "functionality",
      });

      expect(DEFAULT_FEATURE_FLAGS.enableDarkMode).toEqual({
        key: "enableDarkMode",
        name: "Dark Mode",
        description: "Enables dark theme support",
        defaultValue: true,
        rolloutPercentage: 100,
        category: "ui",
      });
    });

    it("should have all required flag properties", () => {
      Object.values(DEFAULT_FEATURE_FLAGS).forEach((flag) => {
        expect(flag).toHaveProperty("key");
        expect(flag).toHaveProperty("name");
        expect(flag).toHaveProperty("description");
        expect(flag).toHaveProperty("defaultValue");
        expect(flag).toHaveProperty("category");
        expect(typeof flag.defaultValue).toBe("boolean");
        expect(typeof flag.category).toBe("string");
      });
    });

    it("should have valid rollout percentages", () => {
      Object.values(DEFAULT_FEATURE_FLAGS).forEach((flag) => {
        if (flag.rolloutPercentage !== undefined) {
          expect(flag.rolloutPercentage).toBeGreaterThanOrEqual(0);
          expect(flag.rolloutPercentage).toBeLessThanOrEqual(100);
        }
      });
    });
  });

  describe("Performance", () => {
    it("should handle rapid flag changes", () => {
      const { result } = renderHook(() => useFeatureFlagsStore());

      // Rapid changes
      for (let i = 0; i < 100; i++) {
        act(() => {
          result.current.setFlag("enableVoiceMessages", i % 2 === 0);
        });
      }

      expect(result.current.isFlagEnabled("enableVoiceMessages")).toBe(i % 2 === 1);
    });

    it("should handle multiple concurrent operations", () => {
      const { result } = renderHook(() => useFeatureFlagsStore());

      act(() => {
        result.current.setFlag("enableVoiceMessages", true);
        result.current.setFlag("enableDarkMode", false);
        result.current.setOverride("enableVoiceMessages", false);
        result.current.setOverride("enableDarkMode", true);
      });

      expect(result.current.isFlagEnabled("enableVoiceMessages")).toBe(false);
      expect(result.current.isFlagEnabled("enableDarkMode")).toBe(true);
    });
  });
});
