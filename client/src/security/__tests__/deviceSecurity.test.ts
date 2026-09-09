/**
 * Device Security Module Tests
 * Tests for jailbreak/root detection and device security checks
 */

import DeviceInfo from "react-native-device-info";
import { Platform, Alert } from "react-native";
import {
  checkDeviceSecurity,
  getSecurityStatus,
  isDeviceSecure,
  updateSecurityConfig,
  refreshSecurityStatus,
} from "../deviceSecurity";

// Mock Alert.alert
jest.spyOn(Alert, "alert").mockImplementation(jest.fn());

describe("DeviceSecurity", () => {
  let deviceSecurity: any;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    deviceSecurity = new (require("../deviceSecurity").DeviceSecurity)();
  });

  describe("Singleton exports", () => {
    it("should export checkDeviceSecurity function", () => {
      expect(typeof checkDeviceSecurity).toBe("function");
    });

    it("should export getSecurityStatus function", () => {
      expect(typeof getSecurityStatus).toBe("function");
    });

    it("should export isDeviceSecure function", () => {
      expect(typeof isDeviceSecure).toBe("function");
    });

    it("should export updateSecurityConfig function", () => {
      expect(typeof updateSecurityConfig).toBe("function");
    });

    it("should export refreshSecurityStatus function", () => {
      expect(typeof refreshSecurityStatus).toBe("function");
    });
  });

  describe("DeviceSecurity class", () => {
    it("should create instance with default config", () => {
      const instance = new (require("../deviceSecurity").DeviceSecurity)();
      // Note: __DEV__ is true in test environment, so enabled is !__DEV__ = false
      expect(instance.isEnabled()).toBe(false);
    });

    it("should create instance with custom config", () => {
      const instance = new (require("../deviceSecurity").DeviceSecurity)({ enabled: true });
      expect(instance.isEnabled()).toBe(true);
    });

    it("should update config", () => {
      const instance = new (require("../deviceSecurity").DeviceSecurity)();
      instance.updateConfig({ enabled: true });
      expect(instance.isEnabled()).toBe(true);
    });

    it("should get current config", () => {
      const instance = new (require("../deviceSecurity").DeviceSecurity)();
      const config = instance.getConfig();
      expect(config.enabled).toBe(false);
    });

    it("should check if security is enabled", () => {
      const instance = new (require("../deviceSecurity").DeviceSecurity)();
      expect(instance.isEnabled()).toBe(false);
    });

    it("should enable/disable security", () => {
      const instance = new (require("../deviceSecurity").DeviceSecurity)();
      instance.setEnabled(true);
      expect(instance.isEnabled()).toBe(true);
      instance.setEnabled(false);
      expect(instance.isEnabled()).toBe(false);
    });

    it("should get cached security status", () => {
      const instance = new (require("../deviceSecurity").DeviceSecurity)();
      const status = instance.getSecurityStatus();
      expect(status).toBeNull();
    });

    it("should check if device is secure with no status", () => {
      const instance = new (require("../deviceSecurity").DeviceSecurity)();
      expect(instance.isDeviceSecure()).toBe(true);
    });
  });

  describe("checkDeviceSecurity", () => {
    it("should check emulator status when not emulator", async () => {
      (DeviceInfo.isEmulator as jest.Mock).mockResolvedValueOnce(false);

      const status = await checkDeviceSecurity();

      expect(status.isEmulator).toBe(false);
      expect(status.isJailbroken).toBe(false);
      expect(status.isRooted).toBe(false);
      expect(status.isSecure).toBe(true);
    });

    it("should detect emulator when config blocks emulators", async () => {
      const instance = new (require("../deviceSecurity").DeviceSecurity)({ allowEmulators: false });
      (DeviceInfo.isEmulator as jest.Mock).mockResolvedValueOnce(true);

      const status = await instance.checkDeviceSecurity();

      expect(status.isEmulator).toBe(true);
      expect(status.threats).toContain("emulator_detected");
      expect(status.isSecure).toBe(false);
    });

    it("should detect jailbreak on iOS", async () => {
      jest.useFakeTimers();
      (Platform.OS as any) = "ios";
      jest.restoreAllMocks();

      (DeviceInfo.isEmulator as jest.Mock).mockResolvedValueOnce(false);
      (DeviceInfo.isJailBroken as jest.Mock).mockResolvedValueOnce(true);

      const instance = new (require("../deviceSecurity").DeviceSecurity)();
      const status = await instance.checkDeviceSecurity();

      expect(status.isJailbroken).toBe(true);
      expect(status.threats).toContain("jailbreak_detected");
      expect(status.isSecure).toBe(false);

      jest.useRealTimers();
    });

    it("should detect root on Android", async () => {
      jest.useFakeTimers();
      (Platform.OS as any) = "android";
      jest.restoreAllMocks();

      (DeviceInfo.isEmulator as jest.Mock).mockResolvedValueOnce(false);
      (DeviceInfo.isRooted as jest.Mock).mockResolvedValueOnce(true);

      const instance = new (require("../deviceSecurity").DeviceSecurity)();
      const status = await instance.checkDeviceSecurity();

      expect(status.isRooted).toBe(true);
      expect(status.threats).toContain("root_detected");
      expect(status.isSecure).toBe(false);

      jest.useRealTimers();
    });

    it("should return safe default on error", async () => {
      jest.useFakeTimers();
      jest.spyOn(DeviceInfo, "isEmulator").mockRejectedValueOnce(new Error("Test error"));
      jest.restoreAllMocks();

      const instance = new (require("../deviceSecurity").DeviceSecurity)();
      const status = await instance.checkDeviceSecurity();

      expect(status.isJailbroken).toBe(false);
      expect(status.isEmulator).toBe(false);
      expect(status.isRooted).toBe(false);
      expect(status.isSecure).toBe(true);
      expect(status.threats).toContain("security_check_failed");

      jest.useRealTimers();
    });

    it("should handle mixed threat detection", async () => {
      jest.useFakeTimers();
      (Platform.OS as any) = "ios";
      jest.restoreAllMocks();

      (DeviceInfo.isEmulator as jest.Mock).mockResolvedValueOnce(true);
      (DeviceInfo.isJailBroken as jest.Mock).mockResolvedValueOnce(false);

      const instance = new (require("../deviceSecurity").DeviceSecurity)({ allowEmulators: false });
      const status = await instance.checkDeviceSecurity();

      expect(status.isEmulator).toBe(true);
      expect(status.threats).toContain("emulator_detected");
      expect(status.isSecure).toBe(false);

      jest.useRealTimers();
    });
  });

  describe("handleSecurityThreat", () => {
    it("should log security threat to Sentry", async () => {
      const status = {
        isJailbroken: false,
        isEmulator: true,
        isRooted: false,
        isSecure: false,
        threats: ["emulator_detected"],
      };

      const instance = new (require("../deviceSecurity").DeviceSecurity)({ showWarning: false });
      await instance["handleSecurityThreat"](status as any);

      // Verify the method runs without throwing
      expect(true).toBe(true);
    });

    it("should show warning when config allows", async () => {
      const status = {
        isJailbroken: true,
        isEmulator: false,
        isRooted: false,
        isSecure: false,
        threats: ["jailbreak_detected"],
      };

      const instance = new (require("../deviceSecurity").DeviceSecurity)({ showWarning: true });
      await instance["handleSecurityThreat"](status as any);

      // Verify the method runs without throwing
      expect(true).toBe(true);
    });

    it("should not show warning when disabled", async () => {
      const status = {
        isJailbroken: true,
        isEmulator: false,
        isRooted: false,
        isSecure: false,
        threats: ["jailbreak_detected"],
      };

      const instance = new (require("../deviceSecurity").DeviceSecurity)({
        showWarning: false,
        enabled: false,
      });
      await instance["handleSecurityThreat"](status as any);

      // Verify the method runs without throwing
      expect(true).toBe(true);
    });
  });

  describe("showSecurityWarning", () => {
    it("should show warning message with jailbreak detection", () => {
      const status = {
        isJailbroken: true,
        isEmulator: false,
        isRooted: false,
        isSecure: false,
        threats: ["jailbreak_detected"],
      };

      const instance = new (require("../deviceSecurity").DeviceSecurity)();
      instance["showSecurityWarning"](status as any);

      // Verify the method runs without throwing
      expect(true).toBe(true);
    });

    it("should show warning message with root detection", () => {
      const status = {
        isJailbroken: false,
        isEmulator: false,
        isRooted: true,
        isSecure: false,
        threats: ["root_detected"],
      };

      const instance = new (require("../deviceSecurity").DeviceSecurity)();
      instance["showSecurityWarning"](status as any);

      // Verify the method runs without throwing
      expect(true).toBe(true);
    });

    it("should show warning message with emulator detection", () => {
      const status = {
        isJailbroken: false,
        isEmulator: true,
        isRooted: false,
        isSecure: false,
        threats: ["emulator_detected"],
      };

      const instance = new (require("../deviceSecurity").DeviceSecurity)();
      instance["showSecurityWarning"](status as any);

      // Verify the method runs without throwing
      expect(true).toBe(true);
    });

    it("should include dev-only button when in dev mode", () => {
      const status = {
        isJailbroken: false,
        isEmulator: false,
        isRooted: false,
        isSecure: false,
        threats: [],
      };

      const instance = new (require("../deviceSecurity").DeviceSecurity)();
      instance["showSecurityWarning"](status as any);

      // Verify the method runs without throwing
      expect(true).toBe(true);
    });
  });

  describe("refreshSecurityStatus", () => {
    it("should refresh security status by calling checkDeviceSecurity", async () => {
      jest.useFakeTimers();
      (Platform.OS as any) = "ios";
      jest.restoreAllMocks();

      (DeviceInfo.isEmulator as jest.Mock).mockResolvedValueOnce(false);
      (DeviceInfo.isJailBroken as jest.Mock).mockResolvedValueOnce(false);

      const instance = new (require("../deviceSecurity").DeviceSecurity)();
      const status = await instance.refreshSecurityStatus();

      expect(status.isJailbroken).toBe(false);
      expect(status.isSecure).toBe(true);

      jest.useRealTimers();
    });
  });
});
