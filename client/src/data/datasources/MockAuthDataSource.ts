/**
 * Dev-only mock authentication data source.
 *
 * This file is only used when both:
 * - `__DEV__` is true, and
 * - `EXPO_PUBLIC_USE_MOCK_AUTH` is set to `"true"`.
 *
 * It lets the frontend exercise the full auth flow without a real backend.
 */

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface MockAuthLoginResponse {
  success: boolean;
}

export interface MockAuthVerifyOtpResponse {
  token: string;
  user: {
    id: string;
    name: string;
    phone: string;
    isOnline: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

export class MockAuthDataSource {
  async login(phone: string): Promise<MockAuthLoginResponse> {
    await delay(250);
    return { success: true };
  }

  async verifyOtp(phone: string, otp: string): Promise<MockAuthVerifyOtpResponse> {
    await delay(300);

    if (!/^\d{6}$/.test(otp)) {
      throw new Error("Invalid OTP");
    }

    const now = new Date().toISOString();
    return {
      token: `dev-token-${Date.now()}`,
      user: {
        id: "user_dev",
        name: "Dev User",
        phone,
        isOnline: true,
        createdAt: now,
        updatedAt: now,
      },
    };
  }
}
