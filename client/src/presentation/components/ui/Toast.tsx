/**
 * Toast notification component
 * Displays temporary notifications with animations
 */

import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Pressable, Animated } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useUIStore } from "@presentation/stores";
import type { Toast as ToastType } from "@presentation/stores/types";

interface ToastProps {
  toast: ToastType;
  onDismiss: () => void;
}

const toastConfig = {
  success: {
    icon: "check-circle" as const,
    color: "#25D366",
    backgroundColor: "#E8F5E9",
  },
  error: {
    icon: "alert-circle" as const,
    color: "#FF3B30",
    backgroundColor: "#FFEBEE",
  },
  warning: {
    icon: "alert-triangle" as const,
    color: "#FFA500",
    backgroundColor: "#FFF3E0",
  },
  info: {
    icon: "info" as const,
    color: "#007AFF",
    backgroundColor: "#E3F2FD",
  },
};

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const config = toastConfig[toast.type];

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 15,
        stiffness: 200,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss
    const timer = setTimeout(() => {
      handleDismiss();
    }, toast.duration ?? 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          marginTop: insets.top + 8,
          backgroundColor: config.backgroundColor,
        },
      ]}
    >
      <View style={styles.content}>
        <Feather name={config.icon} size={20} color={config.color} />
        <View style={styles.textContainer}>
          <Animated.Text style={[styles.message, { color: config.color }]}>
            {toast.message}
          </Animated.Text>
        </View>
        {toast.action && (
          <Pressable onPress={toast.action.onPress} style={styles.actionButton}>
            <Animated.Text style={[styles.actionText, { color: config.color }]}>
              {toast.action.label}
            </Animated.Text>
          </Pressable>
        )}
        <Pressable onPress={handleDismiss} style={styles.closeButton}>
          <Feather name="x" size={18} color={config.color} />
        </Pressable>
      </View>
    </Animated.View>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, hideToast } = useUIStore();

  if (toasts.length === 0) return null;

  return (
    <View style={styles.containerWrapper} pointerEvents="box-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={() => hideToast(toast.id)} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  containerWrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    pointerEvents: "box-none",
  },
  container: {
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    fontWeight: "500",
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
});
