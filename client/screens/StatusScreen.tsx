import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, RefreshControl, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Avatar } from "@/components/Avatar";
import { StatusItem } from "@/components/StatusItem";
import { EmptyState } from "@/components/EmptyState";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { useChatStore } from "@/store/chatStore";

export default function StatusScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { statuses, getUserById, currentUser } = useChatStore();
  
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <Pressable style={styles.myStatusContainer}>
        <View style={styles.myStatusAvatar}>
          <Avatar size="medium" />
          <View
            style={[
              styles.addButton,
              { backgroundColor: theme.primary, borderColor: theme.backgroundRoot },
            ]}
          >
            <Feather name="plus" size={14} color="#FFFFFF" />
          </View>
        </View>
        <View style={styles.myStatusText}>
          <ThemedText style={styles.myStatusTitle}>My Status</ThemedText>
          <ThemedText style={[styles.myStatusSubtitle, { color: theme.textSecondary }]}>
            Tap to add status update
          </ThemedText>
        </View>
      </Pressable>

      <View style={[styles.separator, { backgroundColor: theme.divider }]} />

      <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        Recent updates
      </ThemedText>
    </View>
  );

  const renderItem = useCallback(
    ({ item, index }: { item: typeof statuses[0]; index: number }) => {
      const user = getUserById(item.userId);
      if (!user) return null;

      return (
        <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
          <StatusItem status={item} user={user} />
        </Animated.View>
      );
    },
    [getUserById]
  );

  const renderEmpty = () => (
    <EmptyState
      image={require("../../assets/images/empty-status.png")}
      title="No status updates"
      message="Status updates from your contacts will appear here"
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={statuses}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: headerHeight + Spacing.md,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
          statuses.length === 0 && styles.emptyContent,
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            progressViewOffset={headerHeight}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  emptyContent: {
    justifyContent: "center",
  },
  headerSection: {
    marginBottom: Spacing.md,
  },
  myStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  myStatusAvatar: {
    position: "relative",
  },
  addButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  myStatusText: {
    flex: 1,
  },
  myStatusTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  myStatusSubtitle: {
    fontSize: 13,
  },
  separator: {
    height: 8,
    marginVertical: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
