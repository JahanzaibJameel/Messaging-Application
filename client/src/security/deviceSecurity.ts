/**
 * Device Security Module
 * Provides jailbreak/root detection and device security checks
 */

import DeviceInfo from "react-native-device-info";
import { Platform, Alert } from "react-native";
import { captureException, addUserActionBreadcrumb } from "../monitoring/sentry";
import { logger } from "../utils/logger";

export interface SecurityStatus {
  isJailbroken: boolean;
  isEmulator: boolean;
  isRooted: boolean;
  isSecure: boolean;
  threats: string[];
}

export interface SecurityConfig {
  enabled: boolean;
  allowEmulators: boolean;
  blockOnJailbreak: boolean;
  showWarning: boolean;
  logEvents: boolean;
}

const DEFAULT_CONFIG: SecurityConfig = {
  enabled: !__DEV__, // Disabled in development
  allowEmulators: __DEV__, // Allow emulators in development
  blockOnJailbreak: false, // Don't block, just warn
  showWarning: true,
  logEvents: true,
};

class DeviceSecurity {
  private config: SecurityConfig;
  private securityStatus: SecurityStatus | null = null;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Update security configuration
   */
  updateConfig(config: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info("Device security config updated", { config: this.config }, "security");
  }

  /**
   * Check if device is jailbroken/rooted
   */
  async checkDeviceSecurity(): Promise<SecurityStatus> {
    try {
      logger.info("Starting device security check", {}, "security");
      addUserActionBreadcrumb("device_security_check_start");

      const threats: string[] = [];

      // Check if device is an emulator
      const isEmulator = await DeviceInfo.isEmulator();
      if (isEmulator && !this.config.allowEmulators) {
        threats.push("emulator_detected");
      }

      // Check for jailbreak/root
      let isJailbroken = false;
      let isRooted = false;

      if (Platform.OS === "ios") {
        isJailbroken = await this.checkJailbreak();
        if (isJailbroken) {
          threats.push("jailbreak_detected");
        }
      } else if (Platform.OS === "android") {
        isRooted = await this.checkRoot();
        if (isRooted) {
          threats.push("root_detected");
        }
      }

      const isSecure = !isJailbroken && !isRooted && (!isEmulator || this.config.allowEmulators);

      const status: SecurityStatus = {
        isJailbroken,
        isEmulator,
        isRooted,
        isSecure,
        threats,
      };

      this.securityStatus = status;

      logger.info("Device security check completed", status, "security");
      addUserActionBreadcrumb("device_security_check_complete", status);

      // Handle security threats
      if (!status.isSecure && this.config.enabled) {
        await this.handleSecurityThreat(status);
      }

      return status;
    } catch (error) {
      logger.error("Device security check failed", error, "security");
      captureException(error as Error, {
        action: "device_security_check",
        screen: "security_module",
      });

      // Return safe default on error
      const safeStatus: SecurityStatus = {
        isJailbroken: false,
        isEmulator: false,
        isRooted: false,
        isSecure: true,
        threats: ["security_check_failed"],
      };

      this.securityStatus = safeStatus;
      return safeStatus;
    }
  }

  /**
   * Check for iOS jailbreak
   */
  private async checkJailbreak(): Promise<boolean> {
    try {
      // Check for common jailbreak indicators
      const jailbreakIndicators = [
        "/Applications/Cydia.app",
        "/Library/MobileSubstrate/MobileSubstrate.dylib",
        "/bin/bash",
        "/usr/sbin/sshd",
        "/etc/apt",
        "/private/var/lib/apt/",
      ];

      // This is a simplified check - in production, you'd want more sophisticated detection
      // For now, we'll use react-native-device-info's built-in check
      const isJailbroken =
        (await (DeviceInfo as typeof DeviceInfo & { isJailBroken?: () => Promise<boolean> })
          .isJailBroken?.()
          .catch(() => false)) ?? false;

      if (isJailbroken) {
        logger.security("Jailbreak detected", { indicators: jailbreakIndicators });
      }

      return isJailbroken;
    } catch (error) {
      logger.error("Jailbreak check failed", error, "security");
      return false;
    }
  }

  /**
   * Check for Android root
   */
  private async checkRoot(): Promise<boolean> {
    try {
      // Check for common root indicators
      const rootIndicators = [
        "/system/app/Superuser.apk",
        "/sbin/su",
        "/system/bin/su",
        "/system/xbin/su",
        "/data/local/xbin/su",
        "/data/local/bin/su",
        "/system/sd/xbin/su",
        "/system/bin/failsafe/su",
        "/data/local/su",
      ];

      // Use react-native-device-info's built-in check
      const isRooted =
        (await (DeviceInfo as typeof DeviceInfo & { isRooted?: () => Promise<boolean> })
          .isRooted?.()
          .catch(() => false)) ?? false;

      if (isRooted) {
        logger.security("Root detected", { indicators: rootIndicators });
      }

      return isRooted;
    } catch (error) {
      logger.error("Root check failed", error, "security");
      return false;
    }
  }

  /**
   * Handle security threats
   */
  private async handleSecurityThreat(status: SecurityStatus): Promise<void> {
    try {
      logger.security("Security threat detected", status);

      // Log to Sentry
      captureException(new Error("Security threat detected"), {
        action: "security_threat_detected",
        screen: "security_module",
        additionalData: status,
      });

      // Show warning to user
      if (this.config.showWarning) {
        this.showSecurityWarning(status);
      }

      // Could implement additional actions here:
      // - Disable certain features
      // - Limit functionality
      // - Require additional authentication
      // - Send alert to backend
    } catch (error) {
      logger.error("Failed to handle security threat", error, "security");
      captureException(error as Error, {
        action: "handle_security_threat",
        screen: "security_module",
      });
    }
  }

  /**
   * Show security warning to user
   */
  private showSecurityWarning(status: SecurityStatus): void {
    const title = "Security Warning";
    let message = "Your device may not be secure. Detected issues:\n\n";

    if (status.isJailbroken) {
      message += "• Device appears to be jailbroken\n";
    }
    if (status.isRooted) {
      message += "• Device appears to be rooted\n";
    }
    if (status.isEmulator) {
      message += "• Running on an emulator\n";
    }

    message += "\nFor your security, some features may be limited.";

    const buttons = [
      {
        text: "OK",
        onPress: () => {
          logger.userInteraction("security_warning_dismissed", "alert");
        },
      },
    ];

    if (__DEV__) {
      buttons.push({
        text: "Ignore (Dev Only)",
        onPress: () => {
          logger.userInteraction("security_warning_ignored", "alert");
          this.updateConfig({ enabled: false });
        },
      });
    }

    Alert.alert(title, message, buttons, { cancelable: false });
  }

  /**
   * Get current security status
   */
  getSecurityStatus(): SecurityStatus | null {
    return this.securityStatus;
  }

  /**
   * Check if device is secure (cached result)
   */
  isDeviceSecure(): boolean {
    return this.securityStatus?.isSecure ?? true;
  }

  /**
   * Force re-check device security
   */
  async refreshSecurityStatus(): Promise<SecurityStatus> {
    return await this.checkDeviceSecurity();
  }

  /**
   * Get security configuration
   */
  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  /**
   * Check if security features are enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Enable/disable security features
   */
  setEnabled(enabled: boolean): void {
    this.updateConfig({ enabled });
  }
}

// Create singleton instance
const deviceSecurity = new DeviceSecurity();

// Export convenience functions
export const checkDeviceSecurity = () => deviceSecurity.checkDeviceSecurity();
export const getSecurityStatus = () => deviceSecurity.getSecurityStatus();
export const isDeviceSecure = () => deviceSecurity.isDeviceSecure();
export const updateSecurityConfig = (config: Partial<SecurityConfig>) =>
  deviceSecurity.updateConfig(config);
export const refreshSecurityStatus = () => deviceSecurity.refreshSecurityStatus();

// Export class and instance
export { DeviceSecurity, deviceSecurity };
export default deviceSecurity;
