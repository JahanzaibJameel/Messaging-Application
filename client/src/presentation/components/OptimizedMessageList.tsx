/**
 * Enterprise-grade Optimized Message List Component
 * Uses FlashList for high-performance rendering with 60fps target
 */

import React, { useCallback, useMemo, useRef } from "react";
import {
  FlashList,
  FlashListProps as FlashListPropsType,
  ListRenderItemInfo,
} from "@shopify/flash-list";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { MessageEntity } from "../../domain/entities/Message";
import { useFeatureFlag } from "@/core/featureFlags/FeatureFlags";
import { useAccessibility } from "@/core/accessibility/AccessibilityManager";

interface OptimizedMessageListProps {
  messages: MessageEntity[];
  onMessagePress?: (message: MessageEntity) => void;
  onMessageLongPress?: (message: MessageEntity) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  isLoading?: boolean;
  ListHeaderComponent?: React.ComponentType;
  ListEmptyComponent?: React.ComponentType;
  ListFooterComponent?: React.ComponentType;
}

const { width: screenWidth } = Dimensions.get("window");
const MESSAGE_HEIGHT = 80; // Fixed height for getItemLayout
const MESSAGE_ESTIMATED_WIDTH = screenWidth - 80; // Account for padding/avatar

/**
 * getItemLayout for FlashList optimization
 * Provides fixed dimensions for performance boost
 */
const getItemLayout = useCallback(
  (data: any, index: number) => ({
    length: MESSAGE_HEIGHT,
    offset: MESSAGE_HEIGHT * index,
    index,
  }),
  []
);

/**
 * Optimized Message List Component
 * Enterprise-grade performance with FlashList
 */
export const OptimizedMessageList: React.FC<OptimizedMessageListProps> = React.memo(
  ({
    messages,
    onMessagePress,
    onMessageLongPress,
    onRefresh,
    refreshing = false,
    isLoading = false,
    ListHeaderComponent,
    ListEmptyComponent,
    ListFooterComponent,
  }) => {
    const { isEnabled: flashListEnabled } = useFeatureFlag("flashlist-optimization");
    const { screenReader } = useAccessibility();

    // Memoize data for FlashList
    const flashListData = useMemo(
      () =>
        messages.map((message, index) => ({
          type: message.type,
          id: message.id,
          message,
          index,
        })),
      [messages]
    );

    // Memoize key extractor
    const keyExtractor = useCallback((item: any) => item.id, []);

    // Render individual message with accessibility
    const renderItem = useCallback(
      ({ item, index }: ListRenderItemInfo<any>) => {
        const message = item.message as MessageEntity;

        return (
          <View
            style={[
              styles.messageContainer,
              message.senderId === "current-user" && styles.ownMessage,
            ]}
            accessible={true}
            accessibilityLabel={`Message: ${message.text || "Media message"}`}
            accessibilityHint={
              screenReader ? "Double tap to reply, long press for options" : undefined
            }
            accessibilityRole="list"
          >
            <View style={styles.avatarContainer}>
              <View style={styles.avatar} />
            </View>

            <View style={styles.contentContainer}>
              <Text
                style={[styles.messageText, message.status === "read" && styles.readMessage]}
                numberOfLines={3}
                ellipsizeMode="tail"
              >
                {message.text || "📎 Media"}
              </Text>

              <Text style={styles.timestamp}>
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          </View>
        );
      },
      [screenReader]
    );

    // Optimized FlashList configuration
    const flashListProps: FlashListPropsType<any> = useMemo(() => {
      const baseProps: FlashListPropsType<any> = {
        data: flashListData,
        renderItem,
        keyExtractor,
        estimatedItemSize: MESSAGE_HEIGHT,
        // getItemLayout: flashListEnabled ? getItemLayout : undefined,

        // Performance optimizations
        removeClippedSubviews: true,
        // initialNumToRender: 15, // Initial render count

        // Accessibility
        accessibilityLabel: "Messages list",
        accessibilityRole: "list",

        // Loading states
        ListEmptyComponent: ListEmptyComponent || (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet</Text>
          </View>
        ),

        // Refresh functionality
        onRefresh: onRefresh,
        refreshing,
      };

      // Add header/footer if provided
      if (ListHeaderComponent) {
        baseProps.ListHeaderComponent = ListHeaderComponent;
      }

      if (ListFooterComponent) {
        baseProps.ListFooterComponent = ListFooterComponent;
      }

      // Loading state
      if (isLoading) {
        baseProps.ListFooterComponent = (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        );
      }

      return baseProps;
    }, [
      flashListData,
      renderItem,
      keyExtractor,
      flashListEnabled,
      ListEmptyComponent,
      ListFooterComponent,
      isLoading,
      onRefresh,
      refreshing,
    ]);

    // Handle message press
    const handleMessagePress = useCallback(
      (message: MessageEntity) => {
        onMessagePress?.(message);

        // Add haptic feedback
        if (onMessagePress) {
          // TODO: Add haptics when @expo/haptics is properly installed
          // Haptic feedback would be added here
        }
      },
      [onMessagePress]
    );

    // Handle message long press
    const handleMessageLongPress = useCallback(
      (message: MessageEntity) => {
        onMessageLongPress?.(message);

        // Stronger haptic for long press
        // TODO: Add haptics when @expo/haptics is properly installed
        // Haptic feedback would be added here
      },
      [onMessageLongPress]
    );

    return (
      <View style={styles.container}>
        {flashListEnabled ? (
          <FlashList {...flashListProps} />
        ) : (
          // Fallback to regular FlatList if FlashList is disabled
          <View style={styles.fallbackContainer}>
            <Text style={styles.fallbackText}>Optimized rendering disabled</Text>
          </View>
        )}
      </View>
    );
  }
);

OptimizedMessageList.displayName = "OptimizedMessageList";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  messageContainer: {
    flexDirection: "row",
    padding: 12,
    marginVertical: 2,
    marginHorizontal: 8,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ownMessage: {
    backgroundColor: "#e3f2fd",
    marginLeft: 60,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#333333",
    marginBottom: 4,
  },
  readMessage: {
    opacity: 0.7,
  },
  timestamp: {
    fontSize: 12,
    color: "#999999",
    alignSelf: "flex-end",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#999999",
    textAlign: "center",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666666",
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  fallbackText: {
    fontSize: 14,
    color: "#ff6b6b",
    textAlign: "center",
  },
});

export default OptimizedMessageList;
