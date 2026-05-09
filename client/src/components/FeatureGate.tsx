/**
 * FeatureGate Component
 * Conditionally renders children based on feature flag status
 */

import React, { ReactNode, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import { DEFAULT_FEATURE_FLAGS } from '../stores/featureFlagsStore';

interface FeatureGateProps {
  /** Feature flag key to check */
  flag: keyof typeof DEFAULT_FEATURE_FLAGS;
  /** Children to render when flag is enabled */
  children: ReactNode;
  /** Component to render when flag is disabled (optional) */
  fallback?: ReactNode;
  /** Show debug information in development (optional) */
  showDebug?: boolean;
  /** Custom loading state (optional) */
  loading?: ReactNode;
}

/**
 * FeatureGate component for conditional rendering based on feature flags
 */
export const FeatureGate: React.FC<FeatureGateProps> = ({
  flag,
  children,
  fallback,
  showDebug = __DEV__,
  loading,
}) => {
  const isEnabled = useFeatureFlag(flag);
  const flagInfo = DEFAULT_FEATURE_FLAGS[flag];

  const debugInfo = useMemo(() => {
    if (!showDebug || !__DEV__) return null;
    
    return (
      <View style={styles.debugInfo}>
        <Text style={styles.debugText}>
          🚩 Feature: {flagInfo?.name}
        </Text>
        <Text style={styles.debugText}>
          Status: {isEnabled ? '✅ ENABLED' : '❌ DISABLED'}
        </Text>
        <Text style={styles.debugText}>
          Category: {flagInfo?.category}
        </Text>
        {flagInfo?.rolloutPercentage !== undefined && (
          <Text style={styles.debugText}>
            Rollout: {flagInfo.rolloutPercentage}%
          </Text>
        )}
      </View>
    );
  }, [showDebug, isEnabled, flagInfo]);

  if (loading) {
    return <>{loading}</>;
  }

  if (isEnabled) {
    return (
      <>
        {children}
        {debugInfo}
      </>
    );
  }

  if (fallback) {
    return (
      <>
        {fallback}
        {debugInfo}
      </>
    );
  }

  // Default fallback - show nothing in production, debug info in development
  if (__DEV__) {
    return debugInfo;
  }

  return null;
};

/**
 * Higher-order component version of FeatureGate
 */
export const withFeatureGate = <P extends object>(
  flag: keyof typeof DEFAULT_FEATURE_FLAGS,
  fallback?: ReactNode
) => {
  return (WrappedComponent: React.ComponentType<P>) => {
    const WithFeatureGateComponent = (props: P) => (
      <FeatureGate flag={flag} fallback={fallback}>
        <WrappedComponent {...props} />
      </FeatureGate>
    );
    
    WithFeatureGateComponent.displayName = `withFeatureGate(${WrappedComponent.displayName || WrappedComponent.name})`;
    
    return WithFeatureGateComponent;
  };
};

/**
 * Hook version for conditional logic
 */
export const useFeatureGate = (flag: keyof typeof DEFAULT_FEATURE_FLAGS) => {
  const isEnabled = useFeatureFlag(flag);
  const flagInfo = DEFAULT_FEATURE_FLAGS[flag];

  return {
    isEnabled,
    flagInfo,
    shouldRender: isEnabled,
    shouldHide: !isEnabled,
  };
};

const styles = StyleSheet.create({
  debugInfo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 8,
    zIndex: 9999,
  },
  debugText: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});

export default FeatureGate;
