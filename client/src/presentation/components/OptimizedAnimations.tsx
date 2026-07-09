/**
 * Enterprise-grade UI Thread Animations
 * Uses React Native Reanimated worklets for 60fps performance
 */

import React, { useCallback, useEffect, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  runOnUI,
  cancelAnimation,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useFeatureFlag } from "@/core/featureFlags/FeatureFlags";
import { useAccessibility } from "@/core/accessibility/AccessibilityManager";

interface OptimizedAnimationsProps {
  children: React.ReactNode;
  onAnimationComplete?: () => void;
}

/**
 * Optimized Fade In Animation
 * Runs on UI thread with worklet
 */
export const OptimizedFadeIn: React.FC<OptimizedAnimationsProps> = React.memo(
  ({ children, onAnimationComplete }) => {
    const { isEnabled: animationsEnabled } = useFeatureFlag("ui-thread-animations");
    const { reduceMotion } = useAccessibility();

    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.8);

    // Animation configuration
    const fadeIn = useCallback(() => {
      "worklet";
      if (!animationsEnabled || reduceMotion) {
        // No animation or reduced motion
        opacity.value = 1;
        scale.value = 1;
        onAnimationComplete?.();
        return;
      }

      // Optimized fade in animation
      opacity.value = withTiming(1, {
        duration: reduceMotion ? 100 : 300,
        easing: reduceMotion ? Easing.linear : Easing.out(Easing.cubic),
      });

      scale.value = withSpring(1, {
        damping: 20,
        stiffness: 300,
        mass: 1,
        overshootClamping: false,
      });
    }, [animationsEnabled, reduceMotion, onAnimationComplete, opacity, scale]);

    useEffect(() => {
      fadeIn();
    }, [fadeIn]);

    const animatedStyle = useAnimatedStyle(() => {
      "worklet";
      return {
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
      };
    });

    return <Animated.View style={[styles.container, animatedStyle]}>{children}</Animated.View>;
  }
);

OptimizedFadeIn.displayName = "OptimizedFadeIn";

/**
 * Optimized Slide In Animation
 * Runs on UI thread with worklet
 */
export const OptimizedSlideIn: React.FC<OptimizedAnimationsProps> = React.memo(
  ({ children, onAnimationComplete }) => {
    const { isEnabled: animationsEnabled } = useFeatureFlag("ui-thread-animations");
    const { reduceMotion } = useAccessibility();

    const translateX = useSharedValue(50);
    const opacity = useSharedValue(0);

    const slideIn = useCallback(() => {
      "worklet";
      if (!animationsEnabled || reduceMotion) {
        // No animation or reduced motion
        translateX.value = 0;
        opacity.value = 1;
        onAnimationComplete?.();
        return;
      }

      // Optimized slide in animation
      translateX.value = withTiming(0, {
        duration: reduceMotion ? 100 : 400,
        easing: reduceMotion ? Easing.linear : Easing.out(Easing.cubic),
      });

      opacity.value = withTiming(1, {
        duration: reduceMotion ? 100 : 300,
        easing: reduceMotion ? Easing.linear : Easing.out(Easing.cubic),
      });
    }, [animationsEnabled, reduceMotion, onAnimationComplete, translateX, opacity]);

    useEffect(() => {
      slideIn();
    }, [slideIn]);

    const animatedStyle = useAnimatedStyle(() => {
      "worklet";
      return {
        opacity: opacity.value,
        transform: [{ translateX: translateX.value }],
      };
    });

    return <Animated.View style={[styles.container, animatedStyle]}>{children}</Animated.View>;
  }
);

OptimizedSlideIn.displayName = "OptimizedSlideIn";

/**
 * Optimized Message Bubble Animation
 * Interactive gesture with spring physics
 */
export const OptimizedMessageBubble: React.FC<{
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
}> = React.memo(({ children, onPress, onLongPress }) => {
  const { isEnabled: animationsEnabled } = useFeatureFlag("ui-thread-animations");
  const { reduceMotion } = useAccessibility();

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePress = useCallback(() => {
    "worklet";
    if (!animationsEnabled || reduceMotion) {
      onPress?.();
      return;
    }

    // Animate press feedback
    scale.value = withSpring(0.95, {
      damping: 15,
      stiffness: 400,
      mass: 1,
    });

    // Reset after animation
    setTimeout(() => {
      runOnUI(() => {
        "worklet";
        scale.value = withSpring(1, {
          damping: 20,
          stiffness: 300,
          mass: 1,
        });
      });
    }, 150);

    onPress?.();
  }, [animationsEnabled, reduceMotion, onPress]);

  const handleLongPress = useCallback(() => {
    "worklet";
    if (!animationsEnabled || reduceMotion) {
      onLongPress?.();
      return;
    }

    // Stronger animation for long press
    scale.value = withSequence(
      withSpring(0.9, { duration: 100 }),
      withSpring(1, { duration: 200 })
    );

    // Reset after animation
    setTimeout(() => {
      runOnUI(() => {
        "worklet";
        scale.value = withSpring(1, {
          damping: 20,
          stiffness: 300,
          mass: 1,
        });
      });
    }, 350);

    onLongPress?.();
  }, [animationsEnabled, reduceMotion, onLongPress]);

  const animatedStyle = useAnimatedStyle(() => {
    "worklet";
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  const gesture = Gesture.Tap()
    .onStart(() => {
      "worklet";
      opacity.value = 0.8;
    })
    .onEnd(() => {
      "worklet";
      opacity.value = 1;
    })
    .onFinalize(handlePress)
    .onTouchesDown(() => {
      "worklet";
      scale.value = 0.98;
    })
    .runOnJS(true);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[styles.messageBubble, animatedStyle]}
        accessible={true}
        accessibilityLabel="Message bubble"
        accessibilityRole="button"
        accessibilityHint="Tap to reply, long press for options"
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
});

OptimizedMessageBubble.displayName = "OptimizedMessageBubble";

/**
 * Optimized Loading Spinner
 * Smooth rotation animation on UI thread
 */
export const OptimizedLoadingSpinner: React.FC = React.memo(() => {
  const { isEnabled: animationsEnabled } = useFeatureFlag("ui-thread-animations");
  const { reduceMotion } = useAccessibility();

  const rotation = useSharedValue(0);

  React.useEffect(() => {
    "worklet";
    if (!animationsEnabled || reduceMotion) return;

    // Continuous rotation animation
    rotation.value = withRepeat(
      withTiming(360, {
        duration: reduceMotion ? 2000 : 1000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [animationsEnabled, reduceMotion, rotation]);

  const animatedStyle = useAnimatedStyle(() => {
    "worklet";
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <Animated.View style={styles.spinnerContainer}>
      <Animated.View style={[styles.spinner, animatedStyle]}>
        <View style={styles.spinnerDot} />
        <View style={[styles.spinnerDot, styles.spinnerDot2]} />
        <View style={[styles.spinnerDot, styles.spinnerDot3]} />
      </Animated.View>
    </Animated.View>
  );
});

OptimizedLoadingSpinner.displayName = "OptimizedLoadingSpinner";

/**
 * Performance Monitor Hook
 * Monitors animation performance and FPS
 */
export const useAnimationPerformanceMonitor = () => {
  const { isEnabled: performanceMonitoring } = useFeatureFlag("performance-monitoring");

  const frameCount = useRef(0);
  const lastFrameTime = useRef(Date.now());

  const measureFPS = useCallback(() => {
    "worklet";
    const now = Date.now();
    const delta = now - lastFrameTime.current;
    const fps = 1000 / delta;

    frameCount.current++;

    // Log performance every 60 frames (approximately 1 second)
    if (frameCount.current % 60 === 0) {
      console.log(`Animation FPS: ${fps.toFixed(1)}`);

      // Warn if below 55fps
      if (fps < 55 && performanceMonitoring) {
        console.warn(`Low FPS detected: ${fps.toFixed(1)} - Consider optimizing animations`);
      }
    }

    lastFrameTime.current = now;
  }, [performanceMonitoring]);

  return { measureFPS };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageBubble: {
    backgroundColor: "#007AFF",
    borderRadius: 20,
    padding: 12,
    margin: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  spinnerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  spinner: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  spinnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#007AFF",
    position: "absolute",
  },
  spinnerDot2: {
    transform: [{ rotate: "120deg" }],
  },
  spinnerDot3: {
    transform: [{ rotate: "240deg" }],
  },
});

export default {
  OptimizedFadeIn,
  OptimizedSlideIn,
  OptimizedMessageBubble,
  OptimizedLoadingSpinner,
  useAnimationPerformanceMonitor,
};
