export const mockKeychain = {
  setInternetCredentials: jest.fn(() => Promise.resolve()),
  getInternetCredentials: jest.fn(() => Promise.resolve({ username: "test", password: "test" })),
  resetInternetCredentials: jest.fn(() => Promise.resolve()),
  canImplyAuthentication: jest.fn(() => Promise.resolve(true)),
  getSupportedBiometryType: jest.fn(() => Promise.resolve("TouchID")),
  ACCESS_CONTROL: {
    USER_PRESENCE: "UserPresence",
    BIOMETRY_ANY: "BiometryAny",
    BIOMETRY_CURRENT_SET: "BiometryCurrentSet",
  },
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE: "WhenUnlockedThisDevice",
    AFTER_FIRST_UNLOCK: "AfterFirstUnlock",
    ALWAYS: "Always",
  },
  AUTHENTICATION_TYPE: {
    DEVICE_PASSCODE_OR_BIOMETRICS: "DevicePasscodeOrBiometrics",
    BIOMETRICS: "Biometrics",
    DEVICE_PASSCODE: "DevicePasscode",
  },
  BIOMETRY_TYPE: {
    TOUCH_ID: "TouchID",
    FACE_ID: "FaceID",
    FINGERPRINT: "Fingerprint",
  },
};

export default mockKeychain;
