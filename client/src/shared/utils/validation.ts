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

/** Maximum digits in an international phone number (E.164). */
const MAX_PHONE_DIGITS = 15;

/**
 * Validates phone numbers. Accepts common formatting characters
 * (spaces, dashes, parentheses, dots) and normalizes the result
 * to a leading-plus digit string.
 */
export function validatePhone(phone: string | null | undefined): ValidationResult {
  if (!phone || typeof phone !== "string" || phone.trim() === "") {
    return { isValid: false, error: "Phone number is required" };
  }

  const digits = phone.replace(/\D/g, "");

  if (digits.length < 10) {
    return { isValid: false, error: "Phone number must have at least 10 digits" };
  }

  if (digits.length > MAX_PHONE_DIGITS) {
    return { isValid: false, error: "Phone number is too long" };
  }

  const normalized = `+${digits}`;
  return { isValid: true, error: null, normalized };
}

/**
 * Validates email addresses.
 */
export function validateEmail(email: string | null | undefined): ValidationResult {
  if (!email || typeof email !== "string" || email.trim() === "") {
    return { isValid: false, error: "Email is required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Invalid email format" };
  }

  // Reject consecutive dots (e.g. "user..name@domain.com")
  if (email.includes("..")) {
    return { isValid: false, error: "Invalid email format" };
  }

  return { isValid: true, error: null };
}

/**
 * Validates passwords against configurable requirements.
 * By default all character classes are required.
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
  if (!password || typeof password !== "string" || password.trim() === "") {
    return {
      isValid: false,
      error: "Password is required",
      strength: "weak",
    };
  }

  const minLength = requirements?.minLength ?? 8;
  const requireUppercase = requirements?.requireUppercase ?? true;
  const requireLowercase = requirements?.requireLowercase ?? true;
  const requireNumbers = requirements?.requireNumbers ?? true;
  const requireSpecialChars = requirements?.requireSpecialChars ?? true;

  const hasMinLength = password.length >= minLength;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

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
 * Validates usernames. Only letters, numbers, underscores and hyphens are
 * accepted; surrounding whitespace is tolerated and trimmed away.
 */
export function validateUsername(username: string | null | undefined): UsernameValidationResult {
  if (!username || typeof username !== "string" || username.trim() === "") {
    return { isValid: false, error: "Username is required" };
  }

  const normalized = username.trim();

  if (/[^a-zA-Z0-9_-]/.test(normalized)) {
    return {
      isValid: false,
      error: "Username can only contain letters, numbers, underscores, and hyphens",
    };
  }

  if (normalized.length > 50) {
    return { isValid: false, error: "Username must be 50 characters or less" };
  }

  return { isValid: true, error: null, normalized };
}

/**
 * Sanitizes user input to prevent XSS and injection attacks.
 * Strips known injection vectors, then HTML-encodes the remainder.
 */
export function sanitizeInput(input: string | null | undefined): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  return (
    input
      // Remove NULL bytes
      .replace(/\0/g, "")
      // Remove potentially dangerous URI schemes and event handlers
      .replace(/javascript:/gi, "")
      .replace(/data:/gi, "")
      .replace(/vbscript:/gi, "")
      .replace(/on\w+\s*=/gi, "")
      // Neutralize SQL comment markers and statement separators
      .replace(/--/g, "")
      .replace(/;/g, "")
      // Encode HTML entities
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .trim()
  );
}
