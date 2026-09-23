import * as Keychain from "react-native-keychain";
import { Platform } from "react-native";
import { secureGetJSON, secureSetJSON } from "./secureStorage";
import { captureException, addUserActionBreadcrumb } from "@/monitoring/sentry";

const isWeb = Platform.OS === "web";

const APP_LOCK_SERVICE = "com.chatapp.app-lock";
const APP_LOCK_ACCOUNT = "app-lock";
const APP_LOCK_ENABLED_KEY = "app_lock_enabled";

const AUTHENTICATION_PROMPT = {
  title: "Unlock ChatApp",
  subtitle: "Authenticate to continue",
  cancel: "Cancel",
};

async function createLockCredential(): Promise<boolean> {
  try {
    if (typeof Keychain.resetGenericPassword === "function") {
      await Keychain.resetGenericPassword({ service: APP_LOCK_SERVICE });
    }

    const result = await Keychain.setGenericPassword(APP_LOCK_ACCOUNT, "enabled", {
      service: APP_LOCK_SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
      storage: Keychain.STORAGE_TYPE.AES_GCM,
      authenticationPrompt: AUTHENTICATION_PROMPT,
    });

    return result !== false;
  } catch (error) {
    captureException(error as Error, {
      action: "app_lock_credential_create",
      screen: "security_module",
    });
    return false;
  }
}

export async function isAppLockAvailable(): Promise<boolean> {
  if (isWeb) return false;
  try {
    if (typeof Keychain.canImplyAuthentication === "function") {
      return await Keychain.canImplyAuthentication({
        authenticationType: Keychain.AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS,
      });
    }

    const biometryType = await Keychain.getSupportedBiometryType();
    return (
      biometryType !== null ||
      (typeof Keychain.isPasscodeAuthAvailable === "function"
        ? await Keychain.isPasscodeAuthAvailable()
        : false)
    );
  } catch (error) {
    captureException(error as Error, {
      action: "app_lock_availability_check",
      screen: "security_module",
    });
    return false;
  }
}

export async function getAppLockType(): Promise<Keychain.BIOMETRY_TYPE | "DEVICE_PASSCODE" | null> {
  if (isWeb) return null;
  try {
    return (
      (await Keychain.getSupportedBiometryType()) ??
      (typeof Keychain.isPasscodeAuthAvailable === "function" &&
        (await Keychain.isPasscodeAuthAvailable())
        ? "DEVICE_PASSCODE"
        : null)
    );
  } catch (error) {
    captureException(error as Error, {
      action: "app_lock_type_check",
      screen: "security_module",
    });
    return null;
  }
}

export async function authenticateAppLock(): Promise<boolean> {
  if (isWeb) return false;
  try {
    addUserActionBreadcrumb("app_lock_authentication_attempt");

    const credentials = await Keychain.getGenericPassword({
      service: APP_LOCK_SERVICE,
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
      authenticationPrompt: AUTHENTICATION_PROMPT,
    });

    const authenticated =
      credentials !== false &&
      credentials.username === APP_LOCK_ACCOUNT &&
      credentials.password === "enabled";

    addUserActionBreadcrumb("app_lock_authentication_success", { authenticated });
    return authenticated;
  } catch (error) {
    addUserActionBreadcrumb("app_lock_authentication_failed", {
      error: (error as Error).message,
    });
    return false;
  }
}

export async function getAppLockEnabled(): Promise<boolean> {
  try {
    return (await secureGetJSON<boolean>(APP_LOCK_ENABLED_KEY)) === true;
  } catch (error) {
    captureException(error as Error, {
      action: "app_lock_preference_read",
      screen: "security_module",
    });
    return false;
  }
}

export async function enableAppLock(): Promise<boolean> {
  if (isWeb) return false;
  if (!(await isAppLockAvailable())) {
    return false;
  }

  if (!(await createLockCredential())) {
    return false;
  }

  try {
    await secureSetJSON(APP_LOCK_ENABLED_KEY, true);
    addUserActionBreadcrumb("app_lock_enabled");
    return true;
  } catch (error) {
    captureException(error as Error, {
      action: "app_lock_enable",
      screen: "security_module",
    });
    return false;
  }
}

export async function disableAppLock(): Promise<boolean> {
  if (isWeb) return true;
  try {
    const hasCredential =
      typeof Keychain.hasGenericPassword === "function"
        ? await Keychain.hasGenericPassword({ service: APP_LOCK_SERVICE })
        : true;

    if (hasCredential && !(await authenticateAppLock())) {
      return false;
    }

    await Keychain.resetGenericPassword({ service: APP_LOCK_SERVICE });
    await secureSetJSON(APP_LOCK_ENABLED_KEY, false);
    addUserActionBreadcrumb("app_lock_disabled");
    return true;
  } catch (error) {
    captureException(error as Error, {
      action: "app_lock_disable",
      screen: "security_module",
    });
    return false;
  }
}
