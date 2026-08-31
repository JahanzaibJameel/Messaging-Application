/**
 * Secure Storage Tests
 *
 * Tests for the single-layer encrypted MMKV storage.
 * The new API throws on keychain failure instead of silently falling back,
 * and uses only MMKV's built-in AES-256 — no CryptoJS.
 */

import { MMKV } from "react-native-mmkv";
import type * as SecureStorageModule from "../secureStorage";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Inline keychain mock factory (instances created per resetModules cycle)
jest.mock("react-native-keychain", () => {
  const ggp = jest.fn();
  const sgp = jest.fn();
  const rgp = jest.fn();
  return {
    __esModule: true,
    default: { getGenericPassword: ggp, setGenericPassword: sgp, resetGenericPassword: rgp },
    getGenericPassword: ggp,
    setGenericPassword: sgp,
    resetGenericPassword: rgp,
    ACCESS_CONTROL: {},
    AUTHENTICATION_TYPE: {},
    BIOMETRY_TYPE: {},
    ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: "WhenUnlockedThisDeviceOnly" },
    STORAGE_TYPE: { AES_GCM: "AESGCM" },
  };
});

// MMKV is mocked via moduleNameMapper (see jest.config.js) which points to
// client/src/test-utils/mocks/mmkvMock.ts — do not automock it here.
jest.mock("../../monitoring/sentry", () => ({
  captureException: jest.fn(),
  addUserActionBreadcrumb: jest.fn(),
}));

// Re-captured after each resetModules() so tests always reference the live
// MMKV constructor created by the re-evaluated mapper file.
let mockedMMKV: jest.MockedClass<typeof MMKV>;
const KeychainMock = {
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: "WhenUnlockedThisDeviceOnly" },
  STORAGE_TYPE: { AES_GCM: "AESGCM" },
};

// Re-captured after each resetModules() so tests always reference the live
// mock instances created by the inline factory above.
let mockedKeychain: {
  getGenericPassword: jest.Mock;
  setGenericPassword: jest.Mock;
  resetGenericPassword: jest.Mock;
};

// Re-bound to the fresh secureStorage instance after each resetModules().
let secureSetImpl: typeof SecureStorageModule.secureSet;
let secureGetImpl: typeof SecureStorageModule.secureGet;
let secureDeleteImpl: typeof SecureStorageModule.secureDelete;
let secureClearImpl: typeof SecureStorageModule.secureClear;
let secureSetJSONImpl: typeof SecureStorageModule.secureSetJSON;
let secureGetJSONImpl: typeof SecureStorageModule.secureGetJSON;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeStorageInstance() {
  return {
    set: jest.fn(),
    getString: jest.fn(),
    delete: jest.fn(),
    contains: jest.fn(),
    clearAll: jest.fn(),
    getAllKeys: jest.fn().mockReturnValue([]),
  } as unknown as jest.Mocked<MMKV>;
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let mockInstance: jest.Mocked<MMKV>;

beforeEach(() => {
  jest.clearAllMocks();

  // Reset the module-level singleton so each test starts fresh
  jest.resetModules();

  // Capture the fresh MMKV constructor created by the re-evaluated mapper
  // file (resetModules re-runs mmkvMock.ts, producing a new jest.fn).
  const MMKVMock = require("react-native-mmkv").MMKV as jest.MockedClass<typeof MMKV>;
  mockedMMKV = MMKVMock;

  // Re-require secureStorage so its internal bindings point at the fresh
  // keychain/MMKV mock instances created after resetModules().
  const fresh = require("../secureStorage") as typeof import("../secureStorage");
  secureSetImpl = fresh.secureSet;
  secureGetImpl = fresh.secureGet;
  secureDeleteImpl = fresh.secureDelete;
  secureClearImpl = fresh.secureClear;
  secureSetJSONImpl = fresh.secureSetJSON;
  secureGetJSONImpl = fresh.secureGetJSON;

  // Capture the live mock instances created by the inline factory
  const kc = jest.requireMock("react-native-keychain") as typeof mockedKeychain;
  mockedKeychain = kc;

  mockInstance = makeStorageInstance();
  mockedMMKV.mockImplementation(() => mockInstance);

  // Default: keychain has no existing key → will generate and store a new one
  mockedKeychain.getGenericPassword.mockResolvedValue(false);
  mockedKeychain.setGenericPassword.mockResolvedValue(true as any);
  mockedKeychain.resetGenericPassword.mockResolvedValue(true);
});

// ---------------------------------------------------------------------------
// Key management
// ---------------------------------------------------------------------------

describe("Encryption key management", () => {
  it("generates and persists a new key on first use", async () => {
    await secureSetImpl("k", "v");

    expect(mockedKeychain.getGenericPassword).toHaveBeenCalledWith({
      service: "com.chatapp.securestorage",
    });
    expect(mockedKeychain.setGenericPassword).toHaveBeenCalledWith(
      "mmkv-encryption-key",
      expect.any(String),
      expect.objectContaining({
        service: "com.chatapp.securestorage",
        accessible: KeychainMock.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      })
    );
  });

  it("reuses an existing key without writing to keychain again", async () => {
    mockedKeychain.getGenericPassword.mockResolvedValue({
      username: "mmkv-encryption-key",
      password: "existing-key-abc123",
      service: "com.chatapp.securestorage",
      storage: KeychainMock.STORAGE_TYPE.AES_GCM,
    });

    await secureSetImpl("k", "v");
    await secureGetImpl("k");

    // setGenericPassword must NOT have been called — key already exists
    expect(mockedKeychain.setGenericPassword).not.toHaveBeenCalled();
  });

  it("throws — does NOT fall back to a static key — when keychain read fails", async () => {
    mockedKeychain.getGenericPassword.mockRejectedValue(new Error("Keychain unavailable"));

    await expect(secureSetImpl("k", "v")).rejects.toThrow(/keychain read failed/);
  });

  it("throws when keychain write fails", async () => {
    mockedKeychain.setGenericPassword.mockRejectedValue(new Error("Keychain write error"));

    await expect(secureSetImpl("k", "v")).rejects.toThrow(/keychain write failed/);
  });

  it("creates MMKV with the encryption key — no CryptoJS involved", async () => {
    await secureSetImpl("k", "v");

    expect(mockedMMKV).toHaveBeenCalledWith({
      id: "secure-storage",
      encryptionKey: expect.any(String),
    });
    // Verify the raw value (not a CryptoJS ciphertext) is passed to MMKV
    expect(mockInstance.set).toHaveBeenCalledWith("k", "v");
  });
});

// ---------------------------------------------------------------------------
// secureSet / secureGet
// ---------------------------------------------------------------------------

describe("secureSet / secureGet", () => {
  it("stores and retrieves a plain string", async () => {
    mockInstance.getString.mockReturnValue("hello");

    await secureSetImpl("greeting", "hello");
    const result = await secureGetImpl("greeting");

    expect(mockInstance.set).toHaveBeenCalledWith("greeting", "hello");
    expect(result).toBe("hello");
  });

  it("returns undefined for a missing key", async () => {
    mockInstance.getString.mockReturnValue(undefined);

    const result = await secureGetImpl("missing");

    expect(result).toBeUndefined();
  });

  it("throws when MMKV set throws", async () => {
    mockInstance.set.mockImplementation(() => {
      throw new Error("MMKV write error");
    });

    await expect(secureSetImpl("k", "v")).rejects.toThrow("MMKV write error");
  });

  it("throws when MMKV get throws", async () => {
    mockInstance.getString.mockImplementation(() => {
      throw new Error("MMKV read error");
    });

    await expect(secureGetImpl("k")).rejects.toThrow("MMKV read error");
  });
});

// ---------------------------------------------------------------------------
// secureDelete
// ---------------------------------------------------------------------------

describe("secureDelete", () => {
  it("deletes an existing key", async () => {
    await secureDeleteImpl("token");

    expect(mockInstance.delete).toHaveBeenCalledWith("token");
  });

  it("throws when MMKV delete throws", async () => {
    mockInstance.delete.mockImplementation(() => {
      throw new Error("MMKV delete error");
    });

    await expect(secureDeleteImpl("k")).rejects.toThrow("MMKV delete error");
  });
});

// ---------------------------------------------------------------------------
// secureClear
// ---------------------------------------------------------------------------

describe("secureClear", () => {
  it("clears all data and resets the keychain entry", async () => {
    // Initialise storage first
    await secureSetImpl("existing", "value");

    await secureClearImpl();

    expect(mockInstance.clearAll).toHaveBeenCalled();
    expect(mockedKeychain.resetGenericPassword).toHaveBeenCalledWith({
      service: "com.chatapp.securestorage",
    });
  });
});

// ---------------------------------------------------------------------------
// secureSetJSON / secureGetJSON
// ---------------------------------------------------------------------------

describe("secureSetJSON / secureGetJSON", () => {
  it("serialises objects and retrieves them correctly", async () => {
    const payload = { userId: "u1", token: "abc", active: true };
    mockInstance.getString.mockReturnValue(JSON.stringify(payload));

    await secureSetJSONImpl("session", payload);
    const result = await secureGetJSONImpl<typeof payload>("session");

    expect(mockInstance.set).toHaveBeenCalledWith("session", JSON.stringify(payload));
    expect(result).toEqual(payload);
  });

  it("returns undefined for a missing key", async () => {
    mockInstance.getString.mockReturnValue(undefined);

    const result = await secureGetJSONImpl("missing");

    expect(result).toBeUndefined();
  });

  it("throws on invalid JSON stored in MMKV", async () => {
    mockInstance.getString.mockReturnValue("{not: valid json}");

    await expect(secureGetJSONImpl("bad")).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// No CryptoJS dependency
// ---------------------------------------------------------------------------

describe("CryptoJS is not used", () => {
  it("does not import or reference crypto-js", () => {
    // CryptoJS was removed from the dependency tree; requiring it must fail,
    // proving the module graph cannot pull it back in.
    expect(() => require("crypto-js")).toThrow();

    const secureStorageModule = require("../secureStorage");
    // Verify the module loaded without any CryptoJS dependency.
    expect(secureStorageModule).toBeDefined();
  });
});
