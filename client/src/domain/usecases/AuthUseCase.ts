import type { User } from "../entities/User";
import type { UserRepository } from "../repositories/UserRepository";

export class AuthUseCase {
  constructor(private userRepository: UserRepository) {}

  async login(phone: string): Promise<void> {
    await this.userRepository.login(phone);
  }

  async verifyOtp(otp: string): Promise<boolean> {
    return this.userRepository.verifyOtp(otp);
  }

  async logout(): Promise<void> {
    await this.userRepository.logout();
  }

  async getCurrentUser(): Promise<User | null> {
    return this.userRepository.getCurrentUser();
  }

  async isAuthenticated(): Promise<boolean> {
    return this.userRepository.isAuthenticated();
  }
}
