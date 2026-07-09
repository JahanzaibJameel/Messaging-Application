/**
 * Developer Menu Screen
 * Only available in development mode for managing feature flags
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { DEFAULT_FEATURE_FLAGS } from "../../stores/featureFlagsStore";
import {
  useFeatureFlags,
  useFeatureFlagActions,
  useFeatureFlagsLoading,
} from "../../hooks/useFeatureFlag";

const DeveloperMenu: React.FC = () => {
  const navigation = useNavigation();
  const flags = useFeatureFlags();
  const { setFlag, setOverride, resetOverrides, resetToDefaults } = useFeatureFlagActions();
  const isLoading = useFeatureFlagsLoading();
  const [refreshing, setRefreshing] = useState(false);

  // Group flags by category
  const groupedFlags = Object.entries(DEFAULT_FEATURE_FLAGS).reduce(
    (acc, [key, flag]) => {
      if (!acc[flag.category]) {
        acc[flag.category] = [];
      }
      acc[flag.category].push({
        key,
        name: flag.name,
        description: flag.description,
        defaultValue: flag.defaultValue,
        rolloutPercentage: flag.rolloutPercentage,
        category: flag.category,
      });
      return acc;
    },
    {} as Record<
      string,
      {
        key: string;
        name: string;
        description: string;
        defaultValue: boolean;
        rolloutPercentage?: number;
        category: string;
      }[]
    >
  );

  useEffect(() => {
    // Initialize flags on mount
    const initializeStore = async () => {
      const { initializeFlags } =
        require("../../stores/featureFlagsStore").useFeatureFlagsStore.getState();
      await initializeFlags();
    };

    initializeStore();
  }, []);

  const handleToggleFlag = (key: string, value: boolean) => {
    // In development, we set overrides instead of direct values
    setOverride(key, value);
  };

  const handleResetOverrides = () => {
    Alert.alert("Reset Overrides", "Are you sure you want to reset all developer overrides?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: resetOverrides,
      },
    ]);
  };

  const handleResetToDefaults = () => {
    Alert.alert(
      "Reset to Defaults",
      "Are you sure you want to reset all flags to their default values? This will clear all overrides and persisted values.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: resetToDefaults,
        },
      ]
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const { initializeFlags } =
        require("../../stores/featureFlagsStore").useFeatureFlagsStore.getState();
      await initializeFlags();
    } catch (error) {
      console.error("Failed to refresh flags:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "ui":
        return "#007AFF";
      case "functionality":
        return "#34C759";
      case "experimental":
        return "#FF9500";
      case "performance":
        return "#FF3B30";
      default:
        return "#8E8E93";
    }
  };

  const renderFlagItem = ({ key, name, description, defaultValue, rolloutPercentage }: any) => {
    const isEnabled = flags[key];
    const hasOverride = true; // In dev mode, all values are overrides

    return (
      <View key={key} style={styles.flagItem}>
        <View style={styles.flagContent}>
          <View style={styles.flagHeader}>
            <Text style={styles.flagName}>{name}</Text>
            <Switch
              value={isEnabled}
              onValueChange={(value) => handleToggleFlag(key, value)}
              trackColor={{ false: "#767577", true: "#34C759" }}
              thumbColor={isEnabled ? "#34C759" : "#f4f3f4"}
            />
          </View>

          <Text style={styles.flagDescription}>{description}</Text>

          <View style={styles.flagMeta}>
            <Text style={styles.flagMetaText}>Default: {defaultValue ? "ON" : "OFF"}</Text>
            {rolloutPercentage !== undefined && (
              <Text style={styles.flagMetaText}>Rollout: {rolloutPercentage}%</Text>
            )}
            {hasOverride && (
              <Text style={[styles.flagMetaText, styles.overrideText]}>Override Applied</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Developer Menu</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Initializing feature flags...</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚀 Feature Flags</Text>

          {Object.entries(groupedFlags).map(([category, categoryFlags]) => (
            <View key={category} style={styles.categorySection}>
              <View
                style={[styles.categoryHeader, { backgroundColor: getCategoryColor(category) }]}
              >
                <Text style={styles.categoryTitle}>{category.toUpperCase()}</Text>
                <Text style={styles.categoryCount}>{categoryFlags.length} flags</Text>
              </View>

              {categoryFlags.map(renderFlagItem)}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Management</Text>

          <TouchableOpacity style={styles.actionButton} onPress={handleResetOverrides}>
            <Text style={styles.actionButtonText}>Reset Developer Overrides</Text>
            <Text style={styles.actionDescription}>Clear all temporary overrides</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleResetToDefaults}
          >
            <Text style={[styles.actionButtonText, styles.dangerButtonText]}>
              Reset to Defaults
            </Text>
            <Text style={styles.actionDescription}>
              Reset all flags to default values (destructive)
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Statistics</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Object.values(flags).filter(Boolean).length}</Text>
              <Text style={styles.statLabel}>Enabled Flags</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Object.keys(DEFAULT_FEATURE_FLAGS).length}</Text>
              <Text style={styles.statLabel}>Total Flags</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {Math.round(
                  (Object.values(flags).filter(Boolean).length /
                    Object.keys(DEFAULT_FEATURE_FLAGS).length) *
                    100
                )}
                %
              </Text>
              <Text style={styles.statLabel}>Enabled Rate</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Development Mode Only • Changes persist across app restarts
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e4e8",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1d1d1f",
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  section: {
    margin: 16,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1d1d1f",
    marginBottom: 16,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  categoryCount: {
    fontSize: 12,
    color: "#ffffff",
    opacity: 0.8,
  },
  flagItem: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  flagContent: {
    flex: 1,
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
    color: "#1d1d1f",
    flex: 1,
    marginRight: 16,
  },
  flagDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    lineHeight: 20,
  },
  flagMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  flagMetaText: {
    fontSize: 12,
    color: "#8e8e93",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  overrideText: {
    backgroundColor: "#007AFF",
    color: "#ffffff",
  },
  actionButton: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  dangerButton: {
    backgroundColor: "#fff5f5",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1d1d1f",
    marginBottom: 4,
  },
  dangerButtonText: {
    color: "#FF3B30",
  },
  actionDescription: {
    fontSize: 14,
    color: "#666",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1d1d1f",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  footer: {
    padding: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#8e8e93",
    textAlign: "center",
  },
});

export default DeveloperMenu;
