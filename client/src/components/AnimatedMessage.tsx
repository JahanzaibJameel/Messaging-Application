import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnUI,
  FadeInDown,
} from 'react-native-reanimated';
import { useAccessibleAnimation } from '../accessibility/a11yHelpers';
import type { Message } from '../presentation/stores/mvpStore';

interface AnimatedMessageProps {
  message: Message;
  isOwn?: boolean;
  index?: number;
}

const AnimatedMessage: React.FC<AnimatedMessageProps> = ({ 
  message, 
  isOwn = false, 
  index = 0 
}) => {
  const reduceMotion = useAccessibleAnimation();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  // Animation configuration
  React.useEffect(() => {
    if (reduceMotion) {
      // Skip animation for reduced motion users
      opacity.value = 1;
      translateY.value = 0;
    } else {
      // Run animation on UI thread
      runOnUI(() => {
        'worklet';
        opacity.value = withTiming(1, { duration: 300 });
        translateY.value = withTiming(0, { duration: 300 });
      })();
    }
  }, [reduceMotion, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  // Fade in animation with staggered delay based on index
  const enteringAnimation = reduceMotion ? undefined : FadeInDown.delay(index * 50);

  return (
    <Animated.View
      style={[
        styles.messageContainer,
        isOwn && styles.ownMessage,
        animatedStyle,
      ]}
      entering={enteringAnimation}
      accessibilityRole="text"
      accessibilityLabel={`Message from ${message.senderId}: ${message.text}`}
      accessible={true}
    >
      <Text 
        style={[
          styles.messageText,
          isOwn && styles.ownMessageText
        ]}
        accessible={false}
      >
        {message.text}
      </Text>
      <Text 
        style={[
          styles.timestamp,
          isOwn && styles.ownTimestamp
        ]}
        accessible={false}
      >
        {new Date(message.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    padding: 12,
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 16,
    maxWidth: '80%',
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-start',
  },
  ownMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  messageText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 20,
    marginBottom: 4,
  },
  ownMessageText: {
    color: '#ffffff',
  },
  timestamp: {
    fontSize: 12,
    color: '#666666',
    alignSelf: 'flex-end',
  },
  ownTimestamp: {
    color: '#e0e0e0',
  },
});

export default AnimatedMessage;
