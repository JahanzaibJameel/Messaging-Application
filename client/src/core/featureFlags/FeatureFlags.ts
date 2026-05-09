/**
 * Enterprise-grade Feature Flags System
 * Supports staged rollouts, A/B testing, and remote configuration
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MMKV } from "react-native-mmkv";
import { logger } from "../logger";

// Feature flag definitions with enterprise metadata
export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  conditions?: FeatureFlagCondition[];
  metadata?: Record<string, any>;
  lastUpdated: string;
}

export interface FeatureFlagCondition {
  type: "user_id" | "user_property" | "environment" | "version" | "date_range";
  operator: "equals" | "contains" | "greater_than" | "less_than" | "in_range";
  value: string | number | boolean | string[];
}

export interface FeatureFlagState {
  flags: Record<string, FeatureFlag>;
  userContext: UserContext;
  isLoading: boolean;
  error: string | null;
  lastSync: string | null;
}

export interface UserContext {
  userId?: string;
  version: string;
  buildNumber: string;
  environment: "development" | "staging" | "production";
  userProperties?: Record<string, any>;
  deviceInfo?: {
    platform: "ios" | "android";
    osVersion: string;
    appVersion: string;
  };
}

// MMKV storage for persistence
const mmkv = new MMKV({
  id: "feature-flags",
  encryptionKey: __DEV__ ? undefined : process.env.FEATURE_FLAGS_ENCRYPTION_KEY,
});

const customStorage = {
  getItem: (name: string) => {
    try {
      const value = mmkv.getString(name);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error("Error getting feature flags from storage:", error);
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      mmkv.set(name, value);
    } catch (error) {
      logger.error("Error setting feature flags in storage:", error);
    }
  },
  removeItem: (name: string) => {
    try {
      mmkv.delete(name);
    } catch (error) {
      logger.error("Error removing feature flags from storage:", error);
    }
  },
};

// Default feature flags for enterprise deployment
const DEFAULT_FLAGS: Record<string, FeatureFlag> = {
  // Messaging features
  "message-reactions": {
    id: "message-reactions",
    name: "Message Reactions",
    description: "Allow users to react to messages with emojis",
    enabled: true,
    rolloutPercentage: 100,
    lastUpdated: new Date().toISOString(),
  },
  "message-edit": {
    id: "message-edit",
    name: "Edit Messages",
    description: "Allow users to edit sent messages within 15 minutes",
    enabled: true,
    rolloutPercentage: 50,
    conditions: [
      {
        type: "user_property",
        operator: "equals",
        value: "premium",
      },
    ],
    lastUpdated: new Date().toISOString(),
  },
  "voice-messages": {
    id: "voice-messages",
    name: "Voice Messages",
    description: "Send and receive voice messages",
    enabled: true,
    rolloutPercentage: 80,
    lastUpdated: new Date().toISOString(),
  },

  // UI/UX features
  "dark-mode-v2": {
    id: "dark-mode-v2",
    name: "Enhanced Dark Mode",
    description: "New dark mode implementation with better contrast",
    enabled: false,
    rolloutPercentage: 20,
    lastUpdated: new Date().toISOString(),
  },
  "chat-wallpaper": {
    id: "chat-wallpaper",
    name: "Custom Chat Wallpapers",
    description: "Allow users to set custom chat backgrounds",
    enabled: true,
    rolloutPercentage: 30,
    conditions: [
      {
        type: "environment",
        operator: "equals",
        value: "production",
      },
    ],
    lastUpdated: new Date().toISOString(),
  },

  // Performance features
  "flashlist-optimization": {
    id: "flashlist-optimization",
    name: "FlashList Performance",
    description: "Optimized message list rendering with FlashList",
    enabled: true,
    rolloutPercentage: 100,
    lastUpdated: new Date().toISOString(),
  },
  "image-compression": {
    id: "image-compression",
    name: "Auto Image Compression",
    description: "Automatically compress images before sending",
    enabled: true,
    rolloutPercentage: 60,
    lastUpdated: new Date().toISOString(),
  },

  // Security features
  "two-factor-auth": {
    id: "two-factor-auth",
    name: "Two-Factor Authentication",
    description: "Enhanced security with 2FA support",
    enabled: true,
    rolloutPercentage: 100,
    lastUpdated: new Date().toISOString(),
  },
  "screenshot-protection": {
    id: "screenshot-protection",
    name: "Screenshot Protection",
    description: "Prevent screenshots in sensitive chats",
    enabled: false,
    rolloutPercentage: 0,
    conditions: [
      {
        type: "user_property",
        operator: "equals",
        value: "enterprise",
      },
    ],
    lastUpdated: new Date().toISOString(),
  },

  // Analytics features
  "analytics-v2": {
    id: "analytics-v2",
    name: "Enhanced Analytics",
    description: "New analytics system with privacy controls",
    enabled: true,
    rolloutPercentage: 100,
    lastUpdated: new Date().toISOString(),
  },
  "crash-reporting": {
    id: "crash-reporting",
    name: "Crash Reporting",
    description: "Automatic crash reporting and analysis",
    enabled: true,
    rolloutPercentage: 100,
    lastUpdated: new Date().toISOString(),
  },
};

interface FeatureFlagsStore extends FeatureFlagState {
  // Actions
  initializeFlags: (userContext: UserContext) => Promise<void>;
  updateFlags: (flags: Record<string, FeatureFlag>) => void;
  setFlag: (flagId: string, flag: Partial<FeatureFlag>) => void;
  isEnabled: (flagId: string) => boolean;
  getFlag: (flagId: string) => FeatureFlag | undefined;
  syncWithRemote: () => Promise<void>;
  resetFlags: () => void;
  setUserContext: (context: Partial<UserContext>) => void;
}

// Create the store
export const useFeatureFlagsStore = create<FeatureFlagsStore>()(
  persist(
    (set, get) => ({
      // Initial state
      flags: DEFAULT_FLAGS,
      userContext: {
        version: "3.0.0",
        buildNumber: "1",
        environment: __DEV__ ? "development" : "production",
      },
      isLoading: false,
      error: null,
      lastSync: null,

      // Initialize flags with user context
      initializeFlags: async (userContext: UserContext) => {
        set({ isLoading: true, error: null });

        try {
          // Set user context
          set({ userContext: { ...get().userContext, ...userContext } });

          // Sync with remote configuration
          await get().syncWithRemote();

          logger.info("Feature flags initialized", { userContext });
        } catch (error) {
          logger.error("Failed to initialize feature flags:", error);
          set({ error: error instanceof Error ? error.message : "Unknown error" });
        } finally {
          set({ isLoading: false });
        }
      },

      // Update all flags
      updateFlags: (flags: Record<string, FeatureFlag>) => {
        set({ flags: { ...get().flags, ...flags } });
        logger.info("Feature flags updated", { count: Object.keys(flags).length });
      },

      // Set individual flag
      setFlag: (flagId: string, flagUpdate: Partial<FeatureFlag>) => {
        const currentFlags = get().flags;
        const updatedFlag = {
          ...currentFlags[flagId],
          ...flagUpdate,
          lastUpdated: new Date().toISOString(),
        };

        set({
          flags: {
            ...currentFlags,
            [flagId]: updatedFlag,
          },
        });

        logger.info("Feature flag updated", { flagId, flag: updatedFlag });
      },

      // Check if flag is enabled for current user
      isEnabled: (flagId: string) => {
        const { flags, userContext } = get();
        const flag = flags[flagId];

        if (!flag) {
          logger.warn("Feature flag not found", { flagId });
          return false;
        }

        // Check if flag is globally enabled
        if (!flag.enabled) {
          return false;
        }

        // Check rollout percentage
        if (flag.rolloutPercentage < 100) {
          const hash = getHashForUser(userContext.userId || "anonymous", flagId);
          const isInRollout = hash % 100 < flag.rolloutPercentage;

          if (!isInRollout) {
            return false;
          }
        }

        // Check conditions
        if (flag.conditions && flag.conditions.length > 0) {
          return evaluateConditions(flag.conditions, userContext);
        }

        return true;
      },

      // Get flag details
      getFlag: (flagId: string) => {
        return get().flags[flagId];
      },

      // Sync with remote configuration
      syncWithRemote: async () => {
        try {
          // In a real implementation, this would fetch from your feature flag service
          // For now, we'll simulate a remote sync
          const response = await fetchFeatureFlagsFromRemote();

          if (response) {
            get().updateFlags(response);
            set({ lastSync: new Date().toISOString() });
          }
        } catch (error) {
          logger.error("Failed to sync feature flags:", error);
          // Don't update error state - allow local flags to continue working
        }
      },

      // Reset to defaults
      resetFlags: () => {
        set({
          flags: DEFAULT_FLAGS,
          error: null,
          lastSync: null,
        });
        logger.info("Feature flags reset to defaults");
      },

      // Update user context
      setUserContext: (contextUpdate: Partial<UserContext>) => {
        set({
          userContext: { ...get().userContext, ...contextUpdate },
        });
      },
    }),
    {
      name: "feature-flags-storage",
      storage: createJSONStorage(() => customStorage),
      partialize: (state) => ({
        flags: state.flags,
        userContext: state.userContext,
        lastSync: state.lastSync,
      }),
    }
  )
);

// Helper functions
function getHashForUser(userId: string, flagId: string): number {
  const combined = `${userId}-${flagId}`;
  let hash = 0;

  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash);
}

function evaluateConditions(conditions: FeatureFlagCondition[], userContext: UserContext): boolean {
  return conditions.every((condition) => {
    switch (condition.type) {
      case "user_id":
        return evaluateStringCondition(userContext.userId, condition);

      case "user_property":
        const userValue = userContext.userProperties?.[condition.value as string];
        return evaluateValueCondition(userValue, condition);

      case "environment":
        return evaluateStringCondition(userContext.environment, condition);

      case "version":
        return evaluateVersionCondition(userContext.version, condition);

      case "date_range":
        return evaluateDateCondition(condition);

      default:
        logger.warn("Unknown condition type", { type: condition.type });
        return false;
    }
  });
}

function evaluateStringCondition(
  value: string | undefined,
  condition: FeatureFlagCondition
): boolean {
  switch (condition.operator) {
    case "equals":
      return value === condition.value;
    case "contains":
      return value?.includes(condition.value as string) || false;
    default:
      return false;
  }
}

function evaluateValueCondition(value: any, condition: FeatureFlagCondition): boolean {
  switch (condition.operator) {
    case "equals":
      return value === condition.value;
    case "in_range":
      if (Array.isArray(condition.value)) {
        return condition.value.includes(value);
      }
      return false;
    default:
      return false;
  }
}

function evaluateVersionCondition(version: string, condition: FeatureFlagCondition): boolean {
  // Simple version comparison (could be enhanced with semver)
  const compareValue = condition.value as string;
  switch (condition.operator) {
    case "equals":
      return version === compareValue;
    case "greater_than":
      return version > compareValue;
    case "less_than":
      return version < compareValue;
    default:
      return false;
  }
}

function evaluateDateCondition(condition: FeatureFlagCondition): boolean {
  // Implement date range evaluation
  // This would check if current date is within the specified range
  return true; // Placeholder
}

// Mock remote fetch function (replace with actual implementation)
async function fetchFeatureFlagsFromRemote(): Promise<Record<string, FeatureFlag> | null> {
  try {
    // In production, this would fetch from your feature flag service
    // Example: fetch('https://your-feature-flag-service.com/api/flags')

    // For now, return null to use local defaults
    return null;
  } catch (error) {
    logger.error("Error fetching remote feature flags:", error);
    return null;
  }
}

// Export convenience hooks
export const useFeatureFlag = (flagId: string) => {
  const isEnabled = useFeatureFlagsStore((state) => state.isEnabled(flagId));
  const flag = useFeatureFlagsStore((state) => state.getFlag(flagId));

  return { isEnabled, flag };
};

export const useFeatureFlags = () => {
  const store = useFeatureFlagsStore();

  return {
    ...store,
    enabledFlags: Object.keys(store.flags).filter((id) => store.isEnabled(id)),
    disabledFlags: Object.keys(store.flags).filter((id) => !store.isEnabled(id)),
  };
};
