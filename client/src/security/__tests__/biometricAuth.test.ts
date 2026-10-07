import type { BIOMETRY_TYPE } from "react-native-keychain";

type BiometricModule = typeof import("../biometricAuth");

interface KeychainMock {
  getGenericPassword: jest.Mock;
  setGenericPassword: jest.Mock;
  resetGenericPassword: jest.Mock;
  hasGenericPassword: jest.Mock;
  canImplyAuthentication: jest.Mock;
  isPasscodeAuthAvailable: jest.Mock;
  getSupportedBiometryType: jest.Mock;
  ACCESSIBLE: Record<string, string>;
  ACCESS_CONTROL: Record<string, string>;
  STORAGE_TYPE: Record<string, string>;
  AUTHENTICATION_TYPE: Record<string, string>;
}

interface SecureStorageMock {
  secureGetJSON: jest.Mock;
  secureSetJSON: jest.Mock;
}

interface SentryMock {
  captureException: jest.Mock;
  addUserActionBreadcrumb: jest.Mock;
}

jest.mock("react-native-keychain", () => ({
  __esModule: true,
  getGenericPassword: jest.fn(),
  setGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
  hasGenericPassword: jest.fn(),
  canImplyAuthentication: jest.fn(),
  isPasscodeAuthAvailable: jest.fn(),
  getSupportedBiometryType: jest.fn(),
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: "AccessibleWhenUnlockedThisDeviceOnly" },
  ACCESS_CONTROL: { BIOMETRY_ANY_OR_DEVICE_PASSCODE: "BiometryAnyOrDevicePasscode" },
  STORAGE_TYPE: { AES_GCM: "KeystoreAESGCM" },
  AUTHENTICATION_TYPE: { DEVICE_PASSCODE_OR_BIOMETRICS: "DevicePasscodeOrBiometrics" },
}));

jest.mock("../secureStorage", () => ({
  secureGetJSON: jest.fn(),
  secureSetJSON: jest.fn(),
}));

jest.mock("@/monitoring/sentry", () => ({
  captureException: jest.fn(),
  addUserActionBreadcrumb: jest.fn(),
}));

const keychainMock = (): KeychainMock => jest.requireMock("react-native-keychain");
const storageMock = (): SecureStorageMock => jest.requireMock("../secureStorage");
const sentryMock = (): SentryMock => jest.requireMock("@/monitoring/sentry");

/**
 * `biometricAuth.ts` computes `const isWeb = Platform.OS === "web"` once at module
 * load, so every web/native case needs its own module registry.
 */
const loadModule = (platformOS: "ios" | "web"): BiometricModule => {
  jest.resetModules();
  (require("react-native").Platform as { OS: string }).OS = platformOS;
  return require("../biometricAuth") as BiometricModule;
};

const APP_LOCK_SERVICE = "com.chatapp.app-lock";
const APP_LOCK_ACCOUNT = "app-lock";
const ENABLED_KEY = "app_lock_enabled";

const validCredential = { username: APP_LOCK_ACCOUNT, password: "enabled" };

describe("biometricAuth", () => {
  describe("isAppLockAvailable", () => {
    it("delegates to canImplyAuthentication on native", async () => {
      const mod = loadModule("ios");
      keychainMock().canImplyAuthentication.mockResolvedValue(true);

      await expect(mod.isAppLockAvailable()).resolves.toBe(true);
      expect(keychainMock().canImplyAuthentication).toHaveBeenCalledWith({
        authenticationType: "DevicePasscodeOrBiometrics",
      });
    });

    it("reports unavailable when canImplyAuthentication resolves false", async () => {
      const mod = loadModule("ios");
      keychainMock().canImplyAuthentication.mockResolvedValue(false);

      await expect(mod.isAppLockAvailable()).resolves.toBe(false);
    });

    it("falls back to getSupportedBiometryType when canImplyAuthentication is missing", async () => {
      const mod = loadModule("ios");
      Reflect.deleteProperty(keychainMock(), "canImplyAuthentication");
      keychainMock().getSupportedBiometryType.mockResolvedValue("FaceID");

      await expect(mod.isAppLockAvailable()).resolves.toBe(true);
      expect(keychainMock().isPasscodeAuthAvailable).not.toHaveBeenCalled();
    });

    it("falls back to a passcode check when no biometry is enrolled", async () => {
      const mod = loadModule("ios");
      Reflect.deleteProperty(keychainMock(), "canImplyAuthentication");
      keychainMock().getSupportedBiometryType.mockResolvedValue(null);
      keychainMock().isPasscodeAuthAvailable.mockResolvedValue(true);

      await expect(mod.isAppLockAvailable()).resolves.toBe(true);
      expect(keychainMock().isPasscodeAuthAvailable).toHaveBeenCalledTimes(1);
    });

    it("is unavailable with no biometry and no passcode", async () => {
      const mod = loadModule("ios");
      Reflect.deleteProperty(keychainMock(), "canImplyAuthentication");
      keychainMock().getSupportedBiometryType.mockResolvedValue(null);
      keychainMock().isPasscodeAuthAvailable.mockResolvedValue(false);

      await expect(mod.isAppLockAvailable()).resolves.toBe(false);
    });

    it("is unavailable when the passcode helper is missing too", async () => {
      const mod = loadModule("ios");
      Reflect.deleteProperty(keychainMock(), "canImplyAuthentication");
      Reflect.deleteProperty(keychainMock(), "isPasscodeAuthAvailable");
      keychainMock().getSupportedBiometryType.mockResolvedValue(null);

      await expect(mod.isAppLockAvailable()).resolves.toBe(false);
    });

    it("fails closed and reports when the keychain throws", async () => {
      const mod = loadModule("ios");
      const error = new Error("keychain unavailable");
      keychainMock().canImplyAuthentication.mockRejectedValue(error);

      await expect(mod.isAppLockAvailable()).resolves.toBe(false);
      expect(sentryMock().captureException).toHaveBeenCalledWith(error, {
        action: "app_lock_availability_check",
        screen: "security_module",
      });
    });

    it("returns false on web without touching the keychain", async () => {
      const mod = loadModule("web");

      await expect(mod.isAppLockAvailable()).resolves.toBe(false);
      expect(keychainMock().canImplyAuthentication).not.toHaveBeenCalled();
      expect(keychainMock().getSupportedBiometryType).not.toHaveBeenCalled();
      expect(sentryMock().captureException).not.toHaveBeenCalled();
    });
  });

  describe("getAppLockType", () => {
    it("returns the enrolled biometry type", async () => {
      const mod = loadModule("ios");
      keychainMock().getSupportedBiometryType.mockResolvedValue("FaceID");

      // The annotation is the assertion: it fails to compile if the declared
      // return type stops being BIOMETRY_TYPE | "DEVICE_PASSCODE" | null.
      const result: BIOMETRY_TYPE | "DEVICE_PASSCODE" | null = await mod.getAppLockType();

      expect(result).toBe("FaceID");
      expect(keychainMock().isPasscodeAuthAvailable).not.toHaveBeenCalled();
    });

    it("reports DEVICE_PASSCODE when only a passcode is available", async () => {
      const mod = loadModule("ios");
      keychainMock().getSupportedBiometryType.mockResolvedValue(null);
      keychainMock().isPasscodeAuthAvailable.mockResolvedValue(true);

      await expect(mod.getAppLockType()).resolves.toBe("DEVICE_PASSCODE");
    });

    it("returns null with neither biometry nor passcode", async () => {
      const mod = loadModule("ios");
      keychainMock().getSupportedBiometryType.mockResolvedValue(null);
      keychainMock().isPasscodeAuthAvailable.mockResolvedValue(false);

      await expect(mod.getAppLockType()).resolves.toBeNull();
    });

    it("returns null when the passcode helper is unavailable", async () => {
      const mod = loadModule("ios");
      Reflect.deleteProperty(keychainMock(), "isPasscodeAuthAvailable");
      keychainMock().getSupportedBiometryType.mockResolvedValue(null);

      await expect(mod.getAppLockType()).resolves.toBeNull();
    });

    it("fails closed and reports when the keychain throws", async () => {
      const mod = loadModule("ios");
      const error = new Error("biometry subsystem error");
      keychainMock().getSupportedBiometryType.mockRejectedValue(error);

      await expect(mod.getAppLockType()).resolves.toBeNull();
      expect(sentryMock().captureException).toHaveBeenCalledWith(error, {
        action: "app_lock_type_check",
        screen: "security_module",
      });
    });

    it("returns null on web without touching the keychain", async () => {
      const mod = loadModule("web");

      await expect(mod.getAppLockType()).resolves.toBeNull();
      expect(keychainMock().getSupportedBiometryType).not.toHaveBeenCalled();
    });
  });

  describe("authenticateAppLock", () => {
    it("authenticates with the app-lock credential and records the outcome", async () => {
      const mod = loadModule("ios");
      keychainMock().getGenericPassword.mockResolvedValue(validCredential);

      await expect(mod.authenticateAppLock()).resolves.toBe(true);
      expect(keychainMock().getGenericPassword).toHaveBeenCalledWith({
        service: APP_LOCK_SERVICE,
        accessControl: "BiometryAnyOrDevicePasscode",
        authenticationPrompt: {
          title: "Unlock ChatApp",
          subtitle: "Authenticate to continue",
          cancel: "Cancel",
        },
      });
      expect(sentryMock().addUserActionBreadcrumb).toHaveBeenCalledWith(
        "app_lock_authentication_success",
        { authenticated: true }
      );
    });

    it("records a rejected outcome for a missing credential", async () => {
      const mod = loadModule("ios");
      keychainMock().getGenericPassword.mockResolvedValue(false);

      await expect(mod.authenticateAppLock()).resolves.toBe(false);
      expect(sentryMock().addUserActionBreadcrumb).toHaveBeenCalledWith(
        "app_lock_authentication_success",
        { authenticated: false }
      );
    });

    it("rejects a credential with the wrong account", async () => {
      const mod = loadModule("ios");
      keychainMock().getGenericPassword.mockResolvedValue({
        username: "someone-else",
        password: "enabled",
      });

      await expect(mod.authenticateAppLock()).resolves.toBe(false);
    });

    it("rejects a credential with the wrong secret", async () => {
      const mod = loadModule("ios");
      keychainMock().getGenericPassword.mockResolvedValue({
        username: APP_LOCK_ACCOUNT,
        password: "tampered",
      });

      await expect(mod.authenticateAppLock()).resolves.toBe(false);
    });

    it("REGRESSION: a keychain failure is reported to Sentry", async () => {
      const mod = loadModule("ios");
      const error = new Error("keychain locked");
      keychainMock().getGenericPassword.mockRejectedValue(error);

      await expect(mod.authenticateAppLock()).resolves.toBe(false);

      expect(sentryMock().addUserActionBreadcrumb).toHaveBeenCalledWith(
        "app_lock_authentication_failed",
        { error: "keychain locked" }
      );
      // Matches every sibling function: a real keychain fault is no longer
      // indistinguishable from a user cancellation in Sentry.
      expect(sentryMock().captureException).toHaveBeenCalledWith(error, {
        action: "app_lock_authentication",
        screen: "security_module",
      });
    });

    it("returns false on web without touching the keychain", async () => {
      const mod = loadModule("web");

      await expect(mod.authenticateAppLock()).resolves.toBe(false);
      expect(keychainMock().getGenericPassword).not.toHaveBeenCalled();
    });
  });

  describe("getAppLockEnabled", () => {
    it("reads the persisted preference", async () => {
      const mod = loadModule("ios");
      storageMock().secureGetJSON.mockResolvedValue(true);

      await expect(mod.getAppLockEnabled()).resolves.toBe(true);
      expect(storageMock().secureGetJSON).toHaveBeenCalledWith(ENABLED_KEY);
    });

    it("returns false when the preference is false", async () => {
      const mod = loadModule("ios");
      storageMock().secureGetJSON.mockResolvedValue(false);

      await expect(mod.getAppLockEnabled()).resolves.toBe(false);
    });

    it("returns false when nothing has been persisted yet", async () => {
      const mod = loadModule("ios");
      storageMock().secureGetJSON.mockResolvedValue(undefined);

      await expect(mod.getAppLockEnabled()).resolves.toBe(false);
    });

    it("requires a real boolean, not a truthy value", async () => {
      const mod = loadModule("ios");
      storageMock().secureGetJSON.mockResolvedValue("true");

      await expect(mod.getAppLockEnabled()).resolves.toBe(false);
    });

    it('REGRESSION: FAILS CLOSED — a storage error is rethrown, never reported as "not enabled"', async () => {
      const mod = loadModule("ios");
      const error = new Error("keychain locked before first unlock");
      storageMock().secureGetJSON.mockRejectedValue(error);

      // Before the fix this resolved to `false`, which useAppLock.ts reads as
      // "app lock disabled" and therefore unlocked the app without a prompt.
      await expect(mod.getAppLockEnabled()).rejects.toThrow("keychain locked before first unlock");
      expect(sentryMock().captureException).toHaveBeenCalledWith(error, {
        action: "app_lock_preference_read",
        screen: "security_module",
      });
    });

    it("REGRESSION: never resolves on a storage error, whatever the caller ignores", async () => {
      const mod = loadModule("ios");
      storageMock().secureGetJSON.mockRejectedValue(new Error("unavailable"));

      const outcome = await mod.getAppLockEnabled().then(
        (value) => ({ state: "resolved" as const, value }),
        () => ({ state: "rejected" as const, value: undefined })
      );

      expect(outcome).toEqual({ state: "rejected", value: undefined });
    });

    it("still reads the preference on web, so the flag stays inspectable", async () => {
      const mod = loadModule("web");
      storageMock().secureGetJSON.mockResolvedValue(true);

      await expect(mod.getAppLockEnabled()).resolves.toBe(true);
      expect(storageMock().secureGetJSON).toHaveBeenCalledWith(ENABLED_KEY);
    });
  });

  describe("enableAppLock", () => {
    it("stores a biometric-gated credential and persists the preference", async () => {
      const mod = loadModule("ios");
      keychainMock().canImplyAuthentication.mockResolvedValue(true);
      keychainMock().setGenericPassword.mockResolvedValue(true);
      keychainMock().resetGenericPassword.mockResolvedValue(true);
      storageMock().secureSetJSON.mockResolvedValue(undefined);

      await expect(mod.enableAppLock()).resolves.toBe(true);

      expect(keychainMock().resetGenericPassword).toHaveBeenCalledWith({
        service: APP_LOCK_SERVICE,
      });
      expect(keychainMock().setGenericPassword).toHaveBeenCalledWith(APP_LOCK_ACCOUNT, "enabled", {
        service: APP_LOCK_SERVICE,
        accessible: "AccessibleWhenUnlockedThisDeviceOnly",
        accessControl: "BiometryAnyOrDevicePasscode",
        storage: "KeystoreAESGCM",
        authenticationPrompt: {
          title: "Unlock ChatApp",
          subtitle: "Authenticate to continue",
          cancel: "Cancel",
        },
      });
      expect(storageMock().secureSetJSON).toHaveBeenCalledWith(ENABLED_KEY, true);
      expect(sentryMock().addUserActionBreadcrumb).toHaveBeenCalledWith("app_lock_enabled");
    });

    it("clears any previous credential before writing a new one", async () => {
      const mod = loadModule("ios");
      const calls: string[] = [];
      keychainMock().canImplyAuthentication.mockResolvedValue(true);
      keychainMock().resetGenericPassword.mockImplementation(async () => {
        calls.push("reset");
        return true;
      });
      keychainMock().setGenericPassword.mockImplementation(async () => {
        calls.push("set");
        return true;
      });
      storageMock().secureSetJSON.mockResolvedValue(undefined);

      await expect(mod.enableAppLock()).resolves.toBe(true);

      expect(calls).toEqual(["reset", "set"]);
    });

    it("skips the reset when the keychain does not implement it", async () => {
      const mod = loadModule("ios");
      Reflect.deleteProperty(keychainMock(), "resetGenericPassword");
      keychainMock().canImplyAuthentication.mockResolvedValue(true);
      keychainMock().setGenericPassword.mockResolvedValue(true);
      storageMock().secureSetJSON.mockResolvedValue(undefined);

      await expect(mod.enableAppLock()).resolves.toBe(true);
      expect(keychainMock().setGenericPassword).toHaveBeenCalledTimes(1);
    });

    it("returns false on web without touching the keychain or storage", async () => {
      const mod = loadModule("web");

      await expect(mod.enableAppLock()).resolves.toBe(false);
      expect(keychainMock().setGenericPassword).not.toHaveBeenCalled();
      expect(storageMock().secureSetJSON).not.toHaveBeenCalled();
    });

    it("refuses to enable when no authentication method exists", async () => {
      const mod = loadModule("ios");
      keychainMock().canImplyAuthentication.mockResolvedValue(false);

      await expect(mod.enableAppLock()).resolves.toBe(false);
      expect(keychainMock().setGenericPassword).not.toHaveBeenCalled();
      expect(storageMock().secureSetJSON).not.toHaveBeenCalled();
    });

    it("fails closed when the credential write returns false", async () => {
      const mod = loadModule("ios");
      keychainMock().canImplyAuthentication.mockResolvedValue(true);
      keychainMock().resetGenericPassword.mockResolvedValue(true);
      keychainMock().setGenericPassword.mockResolvedValue(false);

      await expect(mod.enableAppLock()).resolves.toBe(false);
      expect(storageMock().secureSetJSON).not.toHaveBeenCalled();
    });

    it("reports and fails closed when the credential write throws", async () => {
      const mod = loadModule("ios");
      const error = new Error("keystore write denied");
      keychainMock().canImplyAuthentication.mockResolvedValue(true);
      keychainMock().setGenericPassword.mockRejectedValue(error);

      await expect(mod.enableAppLock()).resolves.toBe(false);
      expect(sentryMock().captureException).toHaveBeenCalledWith(error, {
        action: "app_lock_credential_create",
        screen: "security_module",
      });
      expect(storageMock().secureSetJSON).not.toHaveBeenCalled();
    });

    it("REGRESSION: rolls the credential back when persisting the preference fails", async () => {
      const mod = loadModule("ios");
      const error = new Error("secure storage unavailable");
      keychainMock().canImplyAuthentication.mockResolvedValue(true);
      keychainMock().resetGenericPassword.mockResolvedValue(true);
      keychainMock().setGenericPassword.mockResolvedValue(true);
      storageMock().secureSetJSON.mockRejectedValue(error);

      await expect(mod.enableAppLock()).resolves.toBe(false);
      expect(sentryMock().captureException).toHaveBeenCalledWith(error, {
        action: "app_lock_enable",
        screen: "security_module",
      });

      // Atomic: the credential written before the failed preference write is
      // cleared, so no biometric-gated keychain state survives a no-op enable.
      // Before the fix the only reset was the pre-write one.
      expect(keychainMock().resetGenericPassword).toHaveBeenCalledTimes(2);
      expect(keychainMock().resetGenericPassword).toHaveBeenLastCalledWith({
        service: APP_LOCK_SERVICE,
      });
    });

    it("still fails closed and reports when the rollback itself fails", async () => {
      const mod = loadModule("ios");
      const writeError = new Error("secure storage unavailable");
      const rollbackError = new Error("keychain reset denied");
      keychainMock().canImplyAuthentication.mockResolvedValue(true);
      keychainMock()
        .resetGenericPassword.mockResolvedValueOnce(true)
        .mockRejectedValueOnce(rollbackError);
      keychainMock().setGenericPassword.mockResolvedValue(true);
      storageMock().secureSetJSON.mockRejectedValue(writeError);

      await expect(mod.enableAppLock()).resolves.toBe(false);

      expect(sentryMock().captureException).toHaveBeenCalledWith(rollbackError, {
        action: "app_lock_credential_rollback",
        screen: "security_module",
      });
    });

    it("leaves no credential behind when the keychain has no reset method", async () => {
      const mod = loadModule("ios");
      Reflect.deleteProperty(keychainMock(), "resetGenericPassword");
      keychainMock().canImplyAuthentication.mockResolvedValue(true);
      keychainMock().setGenericPassword.mockResolvedValue(true);
      storageMock().secureSetJSON.mockRejectedValue(new Error("secure storage unavailable"));

      await expect(mod.enableAppLock()).resolves.toBe(false);

      // The missing method raises inside the rollback try/catch, so the failure
      // is reported and enableAppLock still fails closed.
      expect(sentryMock().captureException).toHaveBeenCalledWith(expect.any(TypeError), {
        action: "app_lock_credential_rollback",
        screen: "security_module",
      });
    });
  });

  describe("disableAppLock", () => {
    it("authenticates first, then clears the credential and preference", async () => {
      const mod = loadModule("ios");
      keychainMock().hasGenericPassword.mockResolvedValue(true);
      keychainMock().getGenericPassword.mockResolvedValue(validCredential);
      keychainMock().resetGenericPassword.mockResolvedValue(true);
      storageMock().secureSetJSON.mockResolvedValue(undefined);

      await expect(mod.disableAppLock()).resolves.toBe(true);

      expect(keychainMock().getGenericPassword).toHaveBeenCalledTimes(1);
      expect(keychainMock().resetGenericPassword).toHaveBeenCalledWith({
        service: APP_LOCK_SERVICE,
      });
      expect(storageMock().secureSetJSON).toHaveBeenCalledWith(ENABLED_KEY, false);
      expect(sentryMock().addUserActionBreadcrumb).toHaveBeenCalledWith("app_lock_disabled");
    });

    it("skips authentication when no credential is stored", async () => {
      const mod = loadModule("ios");
      keychainMock().hasGenericPassword.mockResolvedValue(false);
      keychainMock().resetGenericPassword.mockResolvedValue(true);
      storageMock().secureSetJSON.mockResolvedValue(undefined);

      await expect(mod.disableAppLock()).resolves.toBe(true);

      expect(keychainMock().getGenericPassword).not.toHaveBeenCalled();
      expect(storageMock().secureSetJSON).toHaveBeenCalledWith(ENABLED_KEY, false);
    });

    it("assumes a credential exists when the keychain cannot report one", async () => {
      const mod = loadModule("ios");
      Reflect.deleteProperty(keychainMock(), "hasGenericPassword");
      keychainMock().getGenericPassword.mockResolvedValue(false);
      keychainMock().resetGenericPassword.mockResolvedValue(true);
      storageMock().secureSetJSON.mockResolvedValue(undefined);

      await expect(mod.disableAppLock()).resolves.toBe(false);
      expect(keychainMock().resetGenericPassword).not.toHaveBeenCalled();
    });

    it("refuses to disable when authentication fails", async () => {
      const mod = loadModule("ios");
      keychainMock().hasGenericPassword.mockResolvedValue(true);
      keychainMock().getGenericPassword.mockResolvedValue(false);
      keychainMock().resetGenericPassword.mockResolvedValue(true);

      await expect(mod.disableAppLock()).resolves.toBe(false);

      expect(keychainMock().resetGenericPassword).not.toHaveBeenCalled();
      expect(storageMock().secureSetJSON).not.toHaveBeenCalled();
      expect(sentryMock().addUserActionBreadcrumb).not.toHaveBeenCalledWith("app_lock_disabled");
    });

    it("REGRESSION: fails closed on web instead of claiming success", async () => {
      const mod = loadModule("web");

      await expect(mod.disableAppLock()).resolves.toBe(false);

      // No keychain access and no success claim: on web the app lock can never be
      // enabled, so a "disabled" result would be a lie that also clears the
      // persisted preference without any authentication.
      expect(keychainMock().hasGenericPassword).not.toHaveBeenCalled();
      expect(keychainMock().getGenericPassword).not.toHaveBeenCalled();
      expect(keychainMock().resetGenericPassword).not.toHaveBeenCalled();
    });

    it("reports and fails closed when clearing the credential throws", async () => {
      const mod = loadModule("ios");
      const error = new Error("keychain reset failed");
      keychainMock().hasGenericPassword.mockResolvedValue(false);
      keychainMock().resetGenericPassword.mockRejectedValue(error);

      await expect(mod.disableAppLock()).resolves.toBe(false);
      expect(sentryMock().captureException).toHaveBeenCalledWith(error, {
        action: "app_lock_disable",
        screen: "security_module",
      });
      expect(storageMock().secureSetJSON).not.toHaveBeenCalled();
    });

    it("reports and fails closed when persisting the preference throws", async () => {
      const mod = loadModule("ios");
      const error = new Error("secure storage unavailable");
      keychainMock().hasGenericPassword.mockResolvedValue(false);
      keychainMock().resetGenericPassword.mockResolvedValue(true);
      storageMock().secureSetJSON.mockRejectedValue(error);

      await expect(mod.disableAppLock()).resolves.toBe(false);
      expect(sentryMock().captureException).toHaveBeenCalledWith(error, {
        action: "app_lock_disable",
        screen: "security_module",
      });
      expect(sentryMock().addUserActionBreadcrumb).not.toHaveBeenCalledWith("app_lock_disabled");
    });
  });
});
