import { AppState, type AppStateStatus } from "react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/presentation/stores";
import {
  authenticateAppLock,
  disableAppLock,
  enableAppLock,
  getAppLockEnabled,
  getAppLockType,
  isAppLockAvailable,
} from "@/security/biometricAuth";

export interface AppLockState {
  enabled: boolean;
  locked: boolean;
  checking: boolean;
  available: boolean;
  biometryType: string | null;
  error: string | null;
  refresh: (lockWhenEnabled?: boolean) => Promise<void>;
  unlock: () => Promise<boolean>;
  setEnabled: (enabled: boolean) => Promise<boolean>;
}

export function useAppLock(monitorAppState = true, lockOnInitialize = true): AppLockState {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [enabled, setEnabledState] = useState(false);
  const [locked, setLocked] = useState(false);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isAuthenticatedRef = useRef(isAuthenticated);
  const isEnabledRef = useRef(false);
  const isCheckingRef = useRef(false);
  const previousAppStateRef = useRef<AppStateStatus | null>(AppState.currentState);

  const refresh = useCallback(async (lockWhenEnabled = true) => {
    const [nextEnabled, nextAvailable, nextBiometryType] = await Promise.all([
      getAppLockEnabled(),
      isAppLockAvailable(),
      getAppLockType(),
    ]);

    setEnabledState(nextEnabled);
    setAvailable(nextAvailable);
    setBiometryType(nextBiometryType);
    setChecking(false);
    isCheckingRef.current = false;
    isEnabledRef.current = nextEnabled;

    if (!nextEnabled) {
      setLocked(false);
      setError(null);
      return;
    }

    if (lockWhenEnabled) {
      setLocked(true);
    } else {
      setLocked(false);
    }
  }, []);

  const unlock = useCallback(async (): Promise<boolean> => {
    if (isCheckingRef.current || !isEnabledRef.current) {
      return false;
    }

    isCheckingRef.current = true;
    setChecking(true);
    setError(null);

    const authenticated = await authenticateAppLock();
    isCheckingRef.current = false;
    setChecking(false);
    setLocked(!authenticated);

    if (!authenticated) {
      setError("Authentication was not completed. Try again to continue.");
    }

    return authenticated;
  }, []);

  const setEnabled = useCallback(
    async (nextEnabled: boolean): Promise<boolean> => {
      const result = nextEnabled ? await enableAppLock() : await disableAppLock();
      if (result) {
        await refresh(false);
      }
      return result;
    },
    [refresh]
  );

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
    if (!isAuthenticated) {
      setLocked(false);
      setChecking(false);
      isCheckingRef.current = false;
      setError(null);
      return;
    }

    void refresh(lockOnInitialize);
  }, [isAuthenticated, lockOnInitialize, refresh]);

  useEffect(() => {
    if (!monitorAppState) {
      return undefined;
    }

    const handleAppStateChange = (nextState: AppStateStatus) => {
      const previousState = previousAppStateRef.current;
      previousAppStateRef.current = nextState;

      if (
        nextState !== "active" ||
        previousState === "active" ||
        !isEnabledRef.current ||
        !isAuthenticatedRef.current ||
        isCheckingRef.current
      ) {
        return;
      }

      void unlock();
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, [monitorAppState, unlock]);

  return {
    enabled,
    locked,
    checking,
    available,
    biometryType,
    error,
    refresh,
    unlock,
    setEnabled,
  };
}
