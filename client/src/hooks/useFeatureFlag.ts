/**
 * Feature Flag Hooks
 * Custom hooks for accessing feature flags
 */

import { useFeatureFlagsStore } from "../stores/featureFlagsStore";

/**
 * Hook to check if a specific feature flag is enabled
 */
export const useFeatureFlag = (key: string) => {
  return useFeatureFlagsStore((state) => state.isFlagEnabled(key));
};

/**
 * Hook to get all feature flags
 */
export const useFeatureFlags = () => {
  return useFeatureFlagsStore((state) => state.getAllFlags());
};

/**
 * Hook to get feature flag actions
 */
export const useFeatureFlagActions = () => {
  return useFeatureFlagsStore((state) => ({
    setFlag: state.setFlag,
    setOverride: state.setOverride,
    resetOverrides: state.resetOverrides,
    resetToDefaults: state.resetToDefaults,
  }));
};

/**
 * Hook to get feature flag loading state
 */
export const useFeatureFlagsLoading = () => {
  return useFeatureFlagsStore((state) => state.isLoading);
};

export default useFeatureFlag;
