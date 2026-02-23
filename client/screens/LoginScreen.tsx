import React, { useState } from "react";
import { View, StyleSheet, TextInput, Image, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useChatStore } from "@/store/chatStore";
import { AuthStackParamList } from "@/navigation/AuthStackNavigator";

interface LoginScreenProps {
  navigation: NativeStackNavigationProp<AuthStackParamList, "Login">;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { login } = useChatStore();
  const [countryCode, setCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");

  const inputScale = useSharedValue(1);

  const inputAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: inputScale.value }],
  }));

  const handleFocus = () => {
    inputScale.value = withSpring(1.02, { damping: 15, stiffness: 200 });
  };

  const handleBlur = () => {
    inputScale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const handleContinue = async () => {
    if (phoneNumber.length < 10) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await login(`${countryCode} ${phoneNumber}`);
    navigation.navigate("OTP", { phone: `${countryCode} ${phoneNumber}` });
  };

  const isValid = phoneNumber.length >= 10;

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: insets.top + Spacing["4xl"],
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <ThemedText style={styles.title}>Enter your phone number</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          We'll send you a verification code to confirm your number
        </ThemedText>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(200).duration(500)} style={styles.form}>
        <Animated.View
          style={[styles.inputContainer, { backgroundColor: theme.surface }, inputAnimatedStyle]}
        >
          <Pressable style={[styles.countryCodeContainer, { borderRightColor: theme.divider }]}>
            <ThemedText style={styles.countryCode}>{countryCode}</ThemedText>
          </Pressable>
          <TextInput
            style={[styles.phoneInput, { color: theme.text }]}
            placeholder="Phone number"
            placeholderTextColor={theme.textSecondary}
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            onFocus={handleFocus}
            onBlur={handleBlur}
            maxLength={15}
            testID="input-phone"
          />
        </Animated.View>

        <Button
          onPress={handleContinue}
          disabled={!isValid}
          style={[styles.button, { backgroundColor: theme.primary }]}
        >
          Continue
        </Button>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(400).duration(500)} style={styles.footer}>
        <ThemedText style={[styles.legalText, { color: theme.textSecondary }]}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </ThemedText>
      </Animated.View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: Spacing.xl,
  },
  form: {
    flex: 1,
    gap: Spacing.xl,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    height: Spacing.inputHeight,
  },
  countryCodeContainer: {
    paddingHorizontal: Spacing.lg,
    height: "100%",
    justifyContent: "center",
    borderRightWidth: 1,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: "500",
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    height: "100%",
  },
  button: {
    marginTop: Spacing.md,
  },
  footer: {
    paddingTop: Spacing.xl,
  },
  legalText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
});
