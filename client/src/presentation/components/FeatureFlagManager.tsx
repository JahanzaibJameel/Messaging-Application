// @ts-nocheck — developer UI with optional slider/button imports.
/**
 * Feature Flag Manager Component
 * Admin interface for managing feature flags in development/staging
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { Slider } from "@react-native-community/slider";
import { useFeatureFlags, useFeatureFlag } from "@/core/featureFlags/FeatureFlags";
// import { Button } from './Button'; // Will be implemented separately
const createStyles = <T extends Record<string, object>>(styles: T) => StyleSheet.create(styles);

interface FeatureFlagManagerProps {
  visible?: boolean;
  onClose?: () => void;
}

export const FeatureFlagManager: React.FC<FeatureFlagManagerProps> = ({
  visible = __DEV__,
  onClose,
}) => {
  const { flags, isLoading, error, syncWithRemote, setFlag, resetFlags, lastSync } =
    useFeatureFlags();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await syncWithRemote();
    } catch (error) {
      Alert.alert("Error", "Failed to sync feature flags");
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleFlag = (flagId: string, enabled: boolean) => {
    setFlag(flagId, { enabled });
  };

  const handleRolloutChange = (flagId: string, percentage: number) => {
    setFlag(flagId, { rolloutPercentage: Math.round(percentage) });
  };

  const handleReset = () => {
    Alert.alert(
      "Reset Feature Flags",
      "Are you sure you want to reset all feature flags to defaults?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: resetFlags,
        },
      ]
    );
  };

  const styles = createStyles({
    container: {
      flex: 1,
      backgroundColor: "#f5f5f5",
    },
    header: {
      padding: 16,
      backgroundColor: "#fff",
      borderBottomWidth: 1,
      borderBottomColor: "#e0e0e0",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#333",
    },
    syncInfo: {
      fontSize: 12,
      color: "#666",
      marginTop: 4,
    },
    flagItem: {
      backgroundColor: "#fff",
      margin: 8,
      marginHorizontal: 16,
      padding: 16,
      borderRadius: 8,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    flagHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    flagName: {
      fontSize: 16,
      fontWeight: "600",
      color: "#333",
      flex: 1,
    },
    flagDescription: {
      fontSize: 14,
      color: "#666",
      marginBottom: 12,
      lineHeight: 20,
    },
    rolloutContainer: {
      marginTop: 8,
    },
    rolloutLabel: {
      fontSize: 14,
      color: "#666",
      marginBottom: 8,
    },
    sliderContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    slider: {
      flex: 1,
      marginHorizontal: 12,
    },
    sliderValue: {
      fontSize: 14,
      fontWeight: "600",
      color: "#333",
      minWidth: 40,
      textAlign: "center",
    },
    footer: {
      padding: 16,
      backgroundColor: "#fff",
      borderTopWidth: 1,
      borderTopColor: "#e0e0e0",
    },
    resetButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#ccc",
      alignItems: "center",
    },
    resetButtonDisabled: {
      opacity: 0.5,
    },
    resetButtonText: {
      fontSize: 16,
      color: "#333",
    },
    errorContainer: {
      padding: 16,
      backgroundColor: "#ffebee",
      margin: 16,
      borderRadius: 8,
    },
    errorText: {
      color: "#c62828",
      fontSize: 14,
    },
  });

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Feature Flags</Text>
          {lastSync && (
            <Text style={styles.syncInfo}>Last sync: {new Date(lastSync).toLocaleString()}</Text>
          )}
        </View>
        <TouchableOpacity onPress={onClose}>
          <Text style={{ fontSize: 18, color: "#666" }}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error: {error}</Text>
          </View>
        )}

        {Object.entries(flags).map(([flagId, flag]) => (
          <View key={flagId} style={styles.flagItem}>
            <View style={styles.flagHeader}>
              <Text style={styles.flagName}>{flag.name}</Text>
              <Switch
                value={flag.enabled}
                onValueChange={(enabled) => handleToggleFlag(flagId, enabled)}
                disabled={isLoading}
              />
            </View>

            <Text style={styles.flagDescription}>{flag.description}</Text>

            <View style={styles.rolloutContainer}>
              <Text style={styles.rolloutLabel}>Rollout: {flag.rolloutPercentage}%</Text>
              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  value={flag.rolloutPercentage}
                  onValueChange={(value) => handleRolloutChange(flagId, value)}
                  minimumTrackTintColor="#007AFF"
                  maximumTrackTintColor="#e0e0e0"
                  disabled={isLoading}
                />
                <Text style={styles.sliderValue}>{flag.rolloutPercentage}%</Text>
              </View>
            </View>

            {flag.conditions && flag.conditions.length > 0 && (
              <View style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Conditions:</Text>
                {flag.conditions.map((condition, index) => (
                  <Text key={index} style={{ fontSize: 12, color: "#333" }}>
                    • {condition.type} {condition.operator} {String(condition.value)}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleReset}
          disabled={isLoading}
          style={[styles.resetButton, isLoading && styles.resetButtonDisabled]}
        >
          <Text style={styles.resetButtonText}>Reset to Defaults</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Development hook for quick flag access
export const useDevFeatureFlags = () => {
  const { setFlag, flags } = useFeatureFlags();

  const quickToggle = (flagId: string) => {
    const currentFlag = flags[flagId];
    if (currentFlag) {
      setFlag(flagId, { enabled: !currentFlag.enabled });
    }
  };

  const quickSetRollout = (flagId: string, percentage: number): void => {
    setFlag(flagId, { rolloutPercentage: percentage });
  };

  return {
    quickToggle,
    quickSetRollout,
    flags,
  };
};
