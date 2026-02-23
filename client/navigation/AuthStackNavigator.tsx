import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SplashScreen from "@/screens/SplashScreen";
import LoginScreen from "@/screens/LoginScreen";
import OTPScreen from "@/screens/OTPScreen";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import ChatScreen from "@/screens/ChatScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useTheme } from "@/hooks/useTheme";

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  OTP: { phone: string };
  Main: undefined;
  Chat: { chatId: string; participantId: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStackNavigator() {
  const screenOptions = useScreenOptions();
  const { theme } = useTheme();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="OTP"
        component={OTPScreen}
        options={{
          headerTitle: "",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen name="Main" component={MainTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerTransparent: false,
          headerStyle: {
            backgroundColor: theme.backgroundRoot,
          },
        }}
      />
    </Stack.Navigator>
  );
}
