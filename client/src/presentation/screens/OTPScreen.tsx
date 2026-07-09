/**
 * OTP Screen
 * Six-digit verification code entry using useAuthStore.verifyOtp().
 */

import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, TextInput, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  FadeIn,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useAuthStore } from "@presentation/stores";
import type { OTPNavProp, OTPRouteProp } from "../../../src/navigation/types";

interface Props {
  navigation: OTPNavProp;
  route: OTPRouteProp;
}

const OTP_LENGTH = 6;

export default function OTPScreen({ navigation, route }: Props) {
  const { phone } = route.params;
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { verifyOtp } = useAuthStore();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const shakeAnimation = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeAnimation.value }],
  }));

  const handleChange = (value: string, index: number) => {
    // Handle paste of full code
    if (value.length > 1) {
      const pastedOtp = value.slice(0, OTP_LENGTH).split("");
      const newOtp = [...otp];
      pastedOtp.forEach((digit, i) => {
        if (index + i < OTP_LENGTH) newOtp[index + i] = digit;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + pastedOtp.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
      if (newOtp.every((d) => d !== "")) verifyCode(newOtp.join(""));
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
    if (newOtp.every((d) => d !== "")) verifyCode(newOtp.join(""));
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyCode = async (code: string) => {
    setIsVerifying(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const success = await verifyOtp(code);

    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.replace("Main");
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shakeAnimation.value = withSequence(
        withSpring(-10, { damping: 2, stiffness: 200 }),
        withSpring(10, { damping: 2, stiffness: 200 }),
        withSpring(-10, { damping: 2, stiffness: 200 }),
        withSpring(0, { damping: 2, stiffness: 200 })
      );
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    }

    setIsVerifying(false);
  };

  const handleResend = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOtp(Array(OTP_LENGTH).fill(""));
    inputRefs.current[0]?.focus();
  };

  useEffect(() => {
    const timer = setTimeout(() => inputRefs.current[0]?.focus(), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: headerHeight + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
      ]}
    >
      <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
        <ThemedText style={styles.title}>Verify your number</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          Enter the 6-digit code sent to {phone}
        </ThemedText>
      </Animated.View>

      <Animated.View
        entering={FadeIn.delay(200).duration(500)}
        style={[styles.otpContainer, shakeStyle]}
      >
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => { inputRefs.current[index] = ref; }}
            style={[
              styles.otpInput,
              {
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: digit ? theme.primary : theme.divider,
              },
            ]}
            value={digit}
            onChangeText={(value) => handleChange(value, index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            editable={!isVerifying}
            selectTextOnFocus
            testID={`input-otp-${index}`}
          />
        ))}
      </Animated.View>

      <Animated.View entering={FadeIn.delay(400).duration(500)}>
        <Pressable onPress={handleResend} style={styles.resendButton}>
          <ThemedText style={[styles.resendText, { color: theme.primary }]}>Resend Code</ThemedText>
        </Pressable>
      </Animated.View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: Spacing.xl, alignItems: "center" },
  header: { alignItems: "center", marginBottom: Spacing["3xl"] },
  title: { fontSize: 24, fontWeight: "700", marginBottom: Spacing.md, textAlign: "center" },
  subtitle: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  otpContainer: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing["2xl"] },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
  },
  resendButton: { padding: Spacing.md },
  resendText: { fontSize: 16, fontWeight: "600" },
});
