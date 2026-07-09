/**
 * Navigation Tracking Hook
 * Tracks screen changes and adds Sentry breadcrumbs
 */

import { useEffect, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import { addNavigationBreadcrumb } from "../monitoring/sentry";

/**
 * Hook to track navigation events and add breadcrumbs to Sentry
 */
export const useNavigationTracking = () => {
  const navigation = useNavigation();
  const previousRouteName = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener("state", () => {
      const state = navigation.getState();
      if (!state) {
        return;
      }

      const currentRoute = state.routes[state.index];
      const currentRouteName = currentRoute?.name || "Unknown";

      if (previousRouteName.current !== currentRouteName) {
        addNavigationBreadcrumb(currentRouteName, {
          params: currentRoute?.params as Record<string, unknown> | undefined,
          previousRoute: previousRouteName.current,
        });

        previousRouteName.current = currentRouteName;
      }
    });

    return unsubscribe;
  }, [navigation]);

  return navigation;
};

/**
 * Manual navigation breadcrumb for programmatic navigation
 */
export const trackNavigation = (screenName: string, params?: Record<string, unknown>) => {
  addNavigationBreadcrumb(screenName, params);
};

export default useNavigationTracking;
