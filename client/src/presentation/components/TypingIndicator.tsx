/**
 * Typing Indicator Component
 * Displays real-time typing indicators for chat conversations
 */

import React, { useEffect, useState } from "react";
import { View, StyleSheet, Text, Animated } from "react-native";
import { useTheme } from "../../../hooks/useTheme";
import { useUIStore } from "../stores";
import { getTypingIndicatorsManager } from "../../core/typingIndicators/TypingIndicatorsManager";

interface TypingIndicatorProps {
  chatId: string;
  currentUserId: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ chatId, currentUserId }) => {
  const theme = useTheme();
  const { typingIndicators } = useUIStore();
  const [typingText, setTypingText] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  const fadeAnimation = React.useRef(new Animated.Value(0)).current;
  const slideAnimation = React.useRef(new Animated.Value(-20)).current;

  // Get typing indicators manager
  const typingManager = getTypingIndicatorsManager(currentUserId);

  useEffect(() => {
    // Get current typing text
    const currentTypingText = typingManager.getTypingText(chatId);
    const isAnyoneTyping = typingManager.isAnyoneTyping(chatId);

    if (isAnyoneTyping && currentTypingText !== typingText) {
      setTypingText(currentTypingText);

      if (!isVisible) {
        // Animate in
        setIsVisible(true);
        Animated.parallel([
          Animated.timing(fadeAnimation, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnimation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } else if (!isAnyoneTyping && isVisible) {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnimation, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnimation, {
          toValue: -20,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsVisible(false);
        setTypingText("");
      });
    }
  }, [chatId, typingManager, isVisible, typingText, fadeAnimation, slideAnimation]);

  if (!isVisible || !typingText) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnimation,
          transform: [{ translateY: slideAnimation }],
          backgroundColor: theme.theme.card,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.dotsContainer}>
          {[0, 1, 2].map((index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: theme.theme.primary,
                },
              ]}
            />
          ))}
        </View>
        <Text style={[styles.typingText, { color: theme.theme.textSecondary }]}>{typingText}</Text>
      </View>
    </Animated.View>
  );
};

// Separate component for the animated dots
const TypingDots: React.FC<{ color: string }> = ({ color }) => {
  const dotAnimations = React.useRef([
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3),
  ]).current;

  React.useEffect(() => {
    const animateDots = () => {
      Animated.sequence([
        // Animate first dot
        Animated.timing(dotAnimations[0], {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        // Animate second dot
        Animated.timing(dotAnimations[1], {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        // Animate third dot
        Animated.timing(dotAnimations[2], {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        // Reset all dots
        Animated.parallel([
          Animated.timing(dotAnimations[0], {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dotAnimations[1], {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dotAnimations[2], {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        // Loop the animation
        setTimeout(animateDots, 200);
      });
    };

    animateDots();

    return () => {
      // Cleanup animations
      dotAnimations.forEach((animation) => animation.stopAnimation());
    };
  }, [dotAnimations]);

  return (
    <View style={styles.dotsContainer}>
      {[0, 1, 2].map((index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: color,
              opacity: dotAnimations[index],
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  typingText: {
    fontSize: 14,
    fontStyle: "italic",
  },
});

// Export the enhanced version with animated dots
export const EnhancedTypingIndicator: React.FC<TypingIndicatorProps> = ({
  chatId,
  currentUserId,
}) => {
  const theme = useTheme();
  const [typingText, setTypingText] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  const fadeAnimation = React.useRef(new Animated.Value(0)).current;
  const slideAnimation = React.useRef(new Animated.Value(-20)).current;

  const typingManager = getTypingIndicatorsManager(currentUserId);

  useEffect(() => {
    const currentTypingText = typingManager.getTypingText(chatId);
    const isAnyoneTyping = typingManager.isAnyoneTyping(chatId);

    if (isAnyoneTyping && currentTypingText !== typingText) {
      setTypingText(currentTypingText);

      if (!isVisible) {
        setIsVisible(true);
        Animated.parallel([
          Animated.timing(fadeAnimation, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnimation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } else if (!isAnyoneTyping && isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnimation, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnimation, {
          toValue: -20,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsVisible(false);
        setTypingText("");
      });
    }
  }, [chatId, typingManager, isVisible, typingText, fadeAnimation, slideAnimation]);

  if (!isVisible || !typingText) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnimation,
          transform: [{ translateY: slideAnimation }],
          backgroundColor: theme.theme.card,
        },
      ]}
    >
      <View style={styles.content}>
        <TypingDots color={theme.theme.primary} />
        <Text style={[styles.typingText, { color: theme.theme.textSecondary }]}>{typingText}</Text>
      </View>
    </Animated.View>
  );
};
