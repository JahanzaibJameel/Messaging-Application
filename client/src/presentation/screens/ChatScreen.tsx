/**
 * MVP Chat Screen
 * Simple working chat screen without enterprise complexity
 * WCAG 2.1 AA compliant with accessibility features
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { useMVPStore, useCurrentChat, useMessages } from '../stores/mvpStore';
import { RootStackParamList } from '../../navigation/types';
import { useAccessibleAnimation, getAccessibleLabel, getListAccessibilityProps } from '../../accessibility/a11yHelpers';
import { FeatureGate } from '../../components/FeatureGate';
import { DEFAULT_FEATURE_FLAGS } from '../../stores/featureFlagsStore';

const ChatScreen: React.FC<{ route: any, navigation: any }> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const currentChatData = useCurrentChat();
  const { addMessage } = useMVPStore();
  const [messageText, setMessageText] = useState('');
  const reduceMotion = useAccessibleAnimation();

  const chatId = route.params?.chatId;
  const messages = useMessages(chatId) || [];

  const handleSendMessage = () => {
    if (!messageText.trim() || !chatId) return;

    const newMessage = {
      id: Date.now().toString(),
      text: messageText,
      senderId: 'me',
      timestamp: new Date(),
      isOwn: true,
    };

    addMessage(chatId, newMessage);
    setMessageText('');
  };

  const renderMessage = ({ item, index }: any) => (
    <View 
      style={[
        styles.messageContainer,
        item.isOwn && styles.ownMessage
      ]}
      accessibilityRole="text"
      accessibilityLabel={t('accessibility.messageBubble', { sender: item.senderId, text: item.text })}
      accessible={true}
    >
      <Text 
        style={styles.messageText}
        accessible={false} // Parent View handles accessibility
      >
        {item.text}
      </Text>
      <Text 
        style={styles.timestamp}
        accessibilityRole="text"
        accessibilityLabel={`Sent at ${new Date(item.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}`}
        accessible={false} // Parent View handles accessibility for content
      >
        {new Date(item.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  );

  if (!currentChatData) {
    return (
      <View style={styles.container}>
        <Text 
          style={styles.loadingText}
          accessibilityRole="text"
          accessibilityLabel={t('accessibility.loadingChat')}
          accessible={true}
        >
          {t('general.loading')}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('accessibility.backButton')}
          accessibilityHint={t('accessibility.backButtonHint')}
          accessible={true}
          style={{ minHeight: 44, minWidth: 44, justifyContent: 'center' }}
        >
          <Text 
            style={styles.backButton}
            accessible={false} // Parent TouchableOpacity handles accessibility
          >
            {t('chat.back')}
          </Text>
        </TouchableOpacity>
        <Text 
          style={styles.chatName}
          accessibilityRole="header"
          accessibilityLabel={t('accessibility.chatName', { name: currentChatData?.chat?.name || 'Unknown' })}
          accessible={true}
        >
          {currentChatData?.chat?.name || t('chat.messages')}
        </Text>
      </View>
      
      <FlashList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        inverted
        accessibilityLabel={t('accessibility.messages')}
        accessibilityRole="list"
        accessible={true}
        // Performance optimizations
        removeClippedSubviews={true}
        estimatedItemSize={60}
        // Memory optimizations
        getItemType={(item, index) => 'message-item'}
        // Additional performance settings
        extraData={{}}
      />
      
      <View style={styles.inputContainer}>
        <FeatureGate 
          flag="enableVoiceMessages" 
          fallback={
            <View style={styles.placeholderVoiceButton}>
              <Text style={styles.placeholderText}>🎤</Text>
            </View>
          }
        >
          <TouchableOpacity
            style={styles.voiceButton}
            accessibilityRole="button"
            accessibilityLabel="Voice message"
            accessibilityHint="Record a voice message"
            accessible={true}
          >
            <Text style={styles.voiceButtonText}>🎤</Text>
          </TouchableOpacity>
        </FeatureGate>
        
        <TextInput
          style={styles.textInput}
          value={messageText}
          onChangeText={setMessageText}
          placeholder={t('chat.inputPlaceholder')}
          multiline
          maxLength={500}
          accessibilityLabel={t('accessibility.messageInput')}
          accessibilityHint={t('accessibility.messageInputHint')}
          accessible={true}
          allowFontScaling={true}
          importantForAccessibility="auto"
        />
        <TouchableOpacity
          style={[styles.sendButton, { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' }]}
          onPress={handleSendMessage}
          disabled={!messageText.trim()}
          accessibilityRole="button"
          accessibilityLabel={t('accessibility.sendButton')}
          accessibilityHint={t('accessibility.sendButtonHint')}
          accessibilityState={{
            disabled: !messageText.trim(),
          }}
          accessible={true}
        >
          <Text 
            style={styles.sendButtonText}
            accessible={false} // Parent TouchableOpacity handles accessibility
          >
            {t('chat.send')}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    marginRight: 16,
  },
  chatName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageContainer: {
    marginVertical: 4,
    marginHorizontal: 16,
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  ownMessage: {
    backgroundColor: '#e3f2fd',
    alignSelf: 'flex-end',
  },
  messageText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#ffffff',
    alignItems: 'flex-end',
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  voiceButtonText: {
    fontSize: 18,
  },
  placeholderVoiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    opacity: 0.5,
  },
  placeholderText: {
    fontSize: 18,
    color: '#999',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  sendButton: {
    marginLeft: 12,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    // Minimum touch target size is handled inline for accessibility
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    // Ensure sufficient contrast ratio (4.5:1 for normal text)
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 100,
    // Ensure sufficient contrast ratio (4.5:1 for normal text)
  },
});

export default ChatScreen;
