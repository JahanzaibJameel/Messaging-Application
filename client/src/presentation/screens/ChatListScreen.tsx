
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { useMVPStore, useChats } from '../stores/mvpStore';
import { RootStackParamList, NavigationProp } from '../../navigation/types';
import { getAccessibleLabel, getListAccessibilityProps } from '../../accessibility/a11yHelpers';
import { FeatureGate } from '../../components/FeatureGate';
import { DEFAULT_FEATURE_FLAGS } from '../../stores/featureFlagsStore';

const ChatListScreen: React.FC<{ navigation: NavigationProp }> = ({ navigation }) => {
  const { t } = useTranslation();
  const chats = useChats();

  const handleChatPress = (chatId: string) => {
    navigation.navigate('Chat', { chatId });
  };

  const renderChat = ({ item, index }: any) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => handleChatPress(item.id)}
      accessibilityRole="button"
      accessibilityLabel={item.unreadCount > 0 
        ? t('accessibility.chatItemWithUnread', { name: item.name, count: item.unreadCount })
        : t('accessibility.chatItem', { name: item.name })
      }
      accessibilityHint={t('accessibility.chatItem', { name: item.name })}
      accessible={true}
      importantForAccessibility={item.unreadCount > 0 ? 'yes' : 'auto'}
    >
      <View style={styles.chatHeader}>
        <Text 
          style={styles.chatName}
          accessibilityRole="text"
          accessibilityLabel={`Chat name: ${item.name}`}
          accessible={false} // Parent TouchableOpacity handles accessibility
        >
          {item.name}
        </Text>
        <Text 
          style={styles.lastMessage}
          accessibilityRole="text"
          accessibilityLabel={`Last message: ${item.lastMessage}`}
          accessible={false} // Parent TouchableOpacity handles accessibility
        >
          {item.lastMessage}
        </Text>
      </View>
      <FeatureGate 
        flag="enableReadReceipts" 
        fallback={
          item.unreadCount > 0 && (
            <View 
              style={styles.unreadBadge}
              importantForAccessibility="yes"
              accessibilityRole="text"
              accessibilityLabel={t('accessibility.unreadBadge', { count: item.unreadCount })}
              accessibilityState={{ busy: false }}
            >
              <Text 
                style={styles.unreadCount}
                accessible={false} // Parent View handles accessibility
              >
                {item.unreadCount}
              </Text>
            </View>
          )
        }
      >
        {item.unreadCount > 0 && (
          <View 
            style={styles.enhancedUnreadBadge}
            importantForAccessibility="yes"
            accessibilityRole="text"
            accessibilityLabel={t('accessibility.unreadBadge', { count: item.unreadCount })}
            accessibilityState={{ busy: false }}
          >
            <Text 
              style={styles.enhancedUnreadCount}
              accessible={false} // Parent View handles accessibility
            >
              {item.unreadCount}
            </Text>
          </View>
        )}
      </FeatureGate>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('chatList.empty')}</Text>
        </View>
      ) : (
        <FlashList
          data={chats}
          renderItem={renderChat}
          keyExtractor={(item) => item.id}
          style={styles.list}
          {...getListAccessibilityProps(t('accessibility.chatList'))}
          accessibilityLabel={t('accessibility.chatList')}
          accessibilityRole="list"
          accessible={true}
          // Performance optimizations
          removeClippedSubviews={true}
          estimatedItemSize={80}
          // Memory optimizations
          getItemType={(item, index) => 'chat-item'}
          // Additional performance settings
          extraData={{}}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    flex: 1,
  },
  chatItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#ffffff',
    height: 80, // Fixed height for FlashList performance
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    // Ensure sufficient contrast ratio (4.5:1 for normal text)
  },
  lastMessage: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
    // Ensure sufficient contrast ratio (4.5:1 for normal text)
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    minWidth: 24,
    minHeight: 24, // Ensure minimum touch target size
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadCount: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    // Ensure sufficient contrast ratio (4.5:1 for normal text)
  },
  enhancedUnreadBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 24,
    minHeight: 24, // Ensure minimum touch target size
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  enhancedUnreadCount: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    // Ensure sufficient contrast ratio (4.5:1 for normal text)
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
});

export default ChatListScreen;
