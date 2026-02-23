import React, { useEffect } from "react";
import { View, StyleSheet, Image } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useChatStore } from "@/store/chatStore";
import { AuthStackParamList } from "@/navigation/AuthStackNavigator";

interface SplashScreenProps {
  navigation: NativeStackNavigationProp<AuthStackParamList, "Splash">;
}

export default function SplashScreen({ navigation }: SplashScreenProps) {
  const { theme } = useTheme();
  const { loadPersistedState, isAuthenticated, isLoading } = useChatStore();

  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    logoScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    logoOpacity.value = withTiming(1, { duration: 600 });
    textOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));

    loadPersistedState();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          navigation.replace("Main");
        } else {
          navigation.replace("Login");
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
    return;
  }, [isLoading, isAuthenticated]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
      <Animated.View style={textStyle}>
        <ThemedText style={[styles.appName, { color: theme.primary }]}>ChatApp</ThemedText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
  },
  appName: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 1,
  },
});
