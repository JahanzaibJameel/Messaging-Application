export const getGenericPassword = jest.fn(() =>
  Promise.resolve({ username: "test", password: "test" })
);
export const setGenericPassword = jest.fn(() => Promise.resolve(true));
export const resetGenericPassword = jest.fn(() => Promise.resolve(true));

export const ACCESS_CONTROL = {
  USER_PRESENCE: "UserPresence",
  BIOMETRY_ANY: "BiometryAny",
  BIOMETRY_CURRENT_SET: "BiometryCurrentSet",
};

export const ACCESSIBLE = {
  WHEN_UNLOCKED_THIS_DEVICE: "WhenUnlockedThisDevice",
  AFTER_FIRST_UNLOCK: "AfterFirstUnlock",
  ALWAYS: "Always",
};

export const AUTHENTICATION_TYPE = {
  DEVICE_PASSCODE_OR_BIOMETRICS: "DevicePasscodeOrBiometrics",
  BIOMETRICS: "Biometrics",
  DEVICE_PASSCODE: "DevicePasscode",
};

export const BIOMETRY_TYPE = {
  TOUCH_ID: "TouchID",
  FACE_ID: "FaceID",
  FINGERPRINT: "Fingerprint",
};

export const getSupportedBiometryType = jest.fn(() =>
  Promise.resolve("TouchID" as const)
);

export default {
  getGenericPassword,
  setGenericPassword,
  resetGenericPassword,
  getSupportedBiometryType,
  ACCESS_CONTROL,
  ACCESSIBLE,
  AUTHENTICATION_TYPE,
  BIOMETRY_TYPE,
};
