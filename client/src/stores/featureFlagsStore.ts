/**
 * Feature Flags Store
 * Manages feature flags with Zustand and MMKV persistence
 */

import { create } from "zustand";
import { MMKV } from "react-native-mmkv";
import { Platform } from "react-native";
import DeviceInfo from "react-native-device-info";
import { warn, error } from "../utils/logger";

// Feature flag definitions
export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  defaultValue: boolean;
  rolloutPercentage?: number; // 0-100 for A/B testing
  category: "ui" | "functionality" | "experimental" | "performance";
}

// Default feature flags configuration
export const DEFAULT_FEATURE_FLAGS: Record<string, FeatureFlag> = {
  enableNewChatAnimation: {
    key: "enableNewChatAnimation",
    name: "New Chat Animation",
    description: "Enables the new chat bubble animation system",
    defaultValue: false,
    rolloutPercentage: 50,
    category: "ui",
  },
  enableVoiceMessages: {
    key: "enableVoiceMessages",
    name: "Voice Messages",
    description: "Enables voice message recording and playback",
    defaultValue: false,
    rolloutPercentage: 30,
    category: "functionality",
  },
  enableDarkMode: {
    key: "enableDarkMode",
    name: "Dark Mode",
    description: "Enables dark theme support",
    defaultValue: true,
    rolloutPercentage: 100,
    category: "ui",
  },
  enableReadReceipts: {
    key: "enableReadReceipts",
    name: "Read Receipts",
    description: "Shows when messages have been read",
    defaultValue: true,
    rolloutPercentage: 100,
    category: "functionality",
  },
  enableTypingIndicators: {
    key: "enableTypingIndicators",
    name: "Typing Indicators",
    description: "Shows when someone is typing",
    defaultValue: true,
    rolloutPercentage: 100,
    category: "ui",
  },
  enableMessageReactions: {
    key: "enableMessageReactions",
    name: "Message Reactions",
    description: "Enables emoji reactions to messages",
    defaultValue: false,
    rolloutPercentage: 75,
    category: "functionality",
  },
  enableAdvancedSearch: {
    key: "enableAdvancedSearch",
    name: "Advanced Search",
    description: "Advanced search with filters and sorting",
    defaultValue: false,
    rolloutPercentage: 25,
    category: "functionality",
  },
  enableMessageDeliveryStatus: {
    key: "enableMessageDeliveryStatus",
    name: "Message Delivery Status",
    description: "Shows delivery status indicators",
    defaultValue: true,
    rolloutPercentage: 100,
    category: "ui",
  },
  enableOfflineMode: {
    key: "enableOfflineMode",
    name: "Offline Mode",
    description: "Enhanced offline functionality",
    defaultValue: true,
    rolloutPercentage: 100,
    category: "functionality",
  },
  enablePerformanceOptimization: {
    key: "enablePerformanceOptimization",
    name: "Performance Optimization",
    description: "Enables performance optimizations",
    defaultValue: true,
    rolloutPercentage: 100,
    category: "performance",
  },
};

// MMKV storage instance for feature flags
const featureFlagsStorage = new MMKV({
  id: "feature_flags",
  encryptionKey: undefined, // Plain text storage as requested
});

// Store interface
interface FeatureFlagsStore {
  // State
  flags: Record<string, boolean>;
  overrides: Record<string, boolean | undefined>; // Developer overrides
  isLoading: boolean;

  // Actions
  initializeFlags: () => void;
  setFlag: (key: string, value: boolean) => void;
  setOverride: (key: string, value: boolean | undefined) => void;
  resetOverrides: () => void;
  resetToDefaults: () => void;
  getFlagValue: (key: string) => boolean;
  getAllFlags: () => Record<string, boolean>;
  isFlagEnabled: (key: string) => boolean;
}

// Helper function to generate user-specific hash for A/B testing
const generateUserHash = async (): Promise<string> => {
  try {
    // Get device unique identifier
    const deviceId = await DeviceInfo.getUniqueId();

    // Create a simple hash from device ID
    let hash = 0;
    for (let i = 0; i < deviceId.length; i++) {
      const char = deviceId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString();
  } catch (error) {
    // Fallback to random number if device ID fails
    return Math.floor(Math.random() * 1000000).toString();
  }
};

// Check if user is in rollout percentage
const isInRollout = async (percentage: number): Promise<boolean> => {
  if (percentage >= 100) return true;
  if (percentage <= 0) return false;

  const userHash = await generateUserHash();
  const userNumber = parseInt(userHash.slice(-6), 10) || 0;
  const threshold = (percentage / 100) * 999999;

  return userNumber <= threshold;
};

// Create the store
export const useFeatureFlagsStore = create<FeatureFlagsStore>((set, get) => {
  // Load persisted flags from storage
  const loadPersistedFlags = (): Record<string, boolean> => {
    const persisted: Record<string, boolean> = {};

    try {
      Object.keys(DEFAULT_FEATURE_FLAGS).forEach((key) => {
        const stored = featureFlagsStorage.getString(key);
        if (stored !== null) {
          persisted[key] = stored === "true";
        } else {
          persisted[key] = DEFAULT_FEATURE_FLAGS[key].defaultValue;
        }
      });
    } catch (error) {
      warn("Failed to load feature flags from storage", error, "feature_flags");
      // Return default values on error
      Object.keys(DEFAULT_FEATURE_FLAGS).forEach((key) => {
        persisted[key] = DEFAULT_FEATURE_FLAGS[key].defaultValue;
      });
    }

    return persisted;
  };

  // Load developer overrides
  const loadOverrides = (): Record<string, boolean | undefined> => {
    const overrides: Record<string, boolean | undefined> = {};

    try {
      const stored = featureFlagsStorage.getString("developer_overrides");
      if (stored) {
        const parsed = JSON.parse(stored);
        Object.assign(overrides, parsed);
      }
    } catch (error) {
      warn("Failed to load developer overrides", error, "feature_flags");
    }

    return overrides;
  };

  return {
    // Initial state
    flags: loadPersistedFlags(),
    overrides: loadOverrides(),
    isLoading: false,

    // Initialize flags (async for A/B testing)
    initializeFlags: async () => {
      set({ isLoading: true });

      try {
        const initializedFlags: Record<string, boolean> = { ...get().flags };

        // Apply A/B testing logic to flags with rollout percentages
        for (const [key, flag] of Object.entries(DEFAULT_FEATURE_FLAGS)) {
          // Skip if already overridden by developer
          if (get().overrides[key] !== undefined) {
            continue;
          }

          // Apply rollout percentage logic
          if (flag.rolloutPercentage !== undefined) {
            const isInRolloutGroup = await isInRollout(flag.rolloutPercentage);
            initializedFlags[key] = isInRolloutGroup;

            // Persist the rollout decision
            featureFlagsStorage.set(key, isInRolloutGroup.toString());
          }
        }

        set({ flags: initializedFlags, isLoading: false });
      } catch (error) {
        console.error("Failed to initialize feature flags", error);
        set({ isLoading: false });
      }
    },

    // Set flag value
    setFlag: (key: string, value: boolean) => {
      const { flags } = get();
      const newFlags = { ...flags, [key]: value };

      // Persist to storage
      try {
        featureFlagsStorage.set(key, value.toString());
      } catch (error) {
        warn("Failed to persist feature flag", error, "feature_flags");
      }

      set({ flags: newFlags });
    },

    // Set developer override
    setOverride: (key: string, value: boolean | undefined) => {
      const { overrides } = get();
      const newOverrides = { ...overrides, [key]: value };

      // Persist overrides
      try {
        featureFlagsStorage.set("developer_overrides", JSON.stringify(newOverrides));
      } catch (error) {
        warn("Failed to persist developer overrides", error, "feature_flags");
      }

      set({ overrides: newOverrides });
    },

    // Reset all overrides
    resetOverrides: () => {
      try {
        featureFlagsStorage.delete("developer_overrides");
      } catch (error) {
        warn("Failed to clear developer overrides", error, "feature_flags");
      }

      set({ overrides: {} });
    },

    // Reset all flags to defaults
    resetToDefaults: () => {
      const defaults: Record<string, boolean> = {};
      Object.keys(DEFAULT_FEATURE_FLAGS).forEach((key) => {
        defaults[key] = DEFAULT_FEATURE_FLAGS[key].defaultValue;
      });

      // Clear storage
      try {
        Object.keys(DEFAULT_FEATURE_FLAGS).forEach((key) => {
          featureFlagsStorage.delete(key);
        });
        featureFlagsStorage.delete("developer_overrides");
      } catch (error) {
        warn("Failed to clear feature flags storage", error, "feature_flags");
      }

      set({ flags: defaults, overrides: {} });
    },

    // Get flag value (considering overrides)
    getFlagValue: (key: string) => {
      const { flags, overrides } = get();

      // Developer override takes precedence
      if (overrides[key] !== undefined) {
        return overrides[key] as boolean;
      }

      return flags[key] || DEFAULT_FEATURE_FLAGS[key]?.defaultValue || false;
    },

    // Get all flags (considering overrides)
    getAllFlags: () => {
      const { flags, overrides } = get();
      const result: Record<string, boolean> = {};

      Object.keys(DEFAULT_FEATURE_FLAGS).forEach((key) => {
        result[key] =
          overrides[key] !== undefined
            ? (overrides[key] as boolean)
            : flags[key] || DEFAULT_FEATURE_FLAGS[key]?.defaultValue || false;
      });

      return result;
    },

    // Check if flag is enabled
    isFlagEnabled: (key: string) => {
      return get().getFlagValue(key);
    },
  };
});

// Convenience selectors
export const useFeatureFlag = (key: string) =>
  useFeatureFlagsStore((state) => state.isFlagEnabled(key));

export const useAllFeatureFlags = () => useFeatureFlagsStore((state) => state.getAllFlags());

export const useFeatureFlagActions = () =>
  useFeatureFlagsStore((state) => ({
    setFlag: state.setFlag,
    setOverride: state.setOverride,
    resetOverrides: state.resetOverrides,
    resetToDefaults: state.resetToDefaults,
  }));

// Export utilities
export default useFeatureFlagsStore;
