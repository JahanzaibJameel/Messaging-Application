/**
 * Validation utilities
 * Provides input validation and sanitization functions
 */

export interface ValidationResult {
  isValid: boolean;
  error: string | null;
  normalized?: string;
}

export interface PasswordValidationResult extends ValidationResult {
  strength: "weak" | "medium" | "strong";
  requirements?: {
    hasMinLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumbers: boolean;
    hasSpecialChars: boolean;
  };
}

export interface UsernameValidationResult extends ValidationResult {
  normalized?: string;
}

/**
 * Validates phone numbers
 */
export function validatePhone(phone: string | null | undefined): ValidationResult {
  if (!phone || phone.trim() === "") {
    return { isValid: false, error: "Phone number is required" };
  }

  // Remove all non-digit characters except + at the start
  const normalized = phone.replace(/[^\d+]/g, "");
  const cleaned = normalized.startsWith("+") ? normalized : "+" + normalized;

  // Check if phone has at least 10 digits after cleaning
  if (cleaned.replace(/\D/g, "").length < 10) {
    return { isValid: false, error: "Phone number must have at least 10 digits" };
  }

  return { isValid: true, error: null, normalized: cleaned };
}

/**
 * Validates email addresses
 */
export function validateEmail(email: string | null | undefined): ValidationResult {
  if (!email || email.trim() === "") {
    return { isValid: false, error: "Email is required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Invalid email format" };
  }

  return { isValid: true, error: null };
}

/**
 * Validates passwords
 */
export function validatePassword(
  password: string | null | undefined,
  requirements?: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
  }
): PasswordValidationResult {
  if (!password || password.trim() === "") {
    return {
      isValid: false,
      error: "Password is required",
      strength: "weak",
    };
  }

  const minLength = requirements?.minLength || 8;
  const requireUppercase = requirements?.requireUppercase || false;
  const requireLowercase = requirements?.requireLowercase || false;
  const requireNumbers = requirements?.requireNumbers || false;
  const requireSpecialChars = requirements?.requireSpecialChars || false;

  const hasMinLength = password.length >= minLength;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const validationRequirements = {
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumbers,
    hasSpecialChars,
  };

  // Determine password strength
  let strength: "weak" | "medium" | "strong" = "weak";

  if (hasMinLength && hasUppercase && hasLowercase && hasNumbers && hasSpecialChars) {
    strength = "strong";
  } else if (hasMinLength && (hasUppercase || hasLowercase || hasNumbers)) {
    strength = "medium";
  }

  const isValid =
    hasMinLength &&
    (!requireUppercase || hasUppercase) &&
    (!requireLowercase || hasLowercase) &&
    (!requireNumbers || hasNumbers) &&
    (!requireSpecialChars || hasSpecialChars);

  return {
    isValid,
    error: isValid ? null : "Password does not meet requirements",
    strength,
    requirements: validationRequirements,
  };
}

/**
 * Validates usernames
 */
export function validateUsername(username: string | null | undefined): UsernameValidationResult {
  if (!username || username.trim() === "") {
    return { isValid: false, error: "Username is required" };
  }

  const trimmed = username.trim();

  // Check length (3-50 characters)
  if (trimmed.length < 3) {
    return { isValid: false, error: "Username must be at least 3 characters" };
  }

  if (trimmed.length > 50) {
    return { isValid: false, error: "Username must be 50 characters or less" };
  }

  // Check for invalid characters (alphanumeric, underscores, hyphens only)
  const validUsernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!validUsernameRegex.test(trimmed)) {
    return {
      isValid: false,
      error: "Username can only contain letters, numbers, underscores, and hyphens",
    };
  }

  // Normalize by removing invalid characters and trimming
  const normalized = trimmed.replace(/[^a-zA-Z0-9_-]/g, "").trim();

  return { isValid: true, error: null, normalized };
}

/**
 * Sanitizes user input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: string | null | undefined): string {
  if (!input) return "";

  return (
    input
      // Remove HTML tags
      .replace(/<[^>]*>/g, "")
      // Encode HTML entities
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      // Remove potentially dangerous patterns
      .replace(/javascript:/gi, "")
      .replace(/data:/gi, "")
      .replace(/vbscript:/gi, "")
      .replace(/on\w+\s*=/gi, "")
      .trim()
  );
}
