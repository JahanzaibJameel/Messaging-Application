#!/usr/bin/env node

/**
 * Validates required public environment variables for production builds.
 * Exits with code 1 if any required variable is missing, empty, or (for
 * certificate pins) malformed or a known placeholder.
 */

const PRODUCTION_REQUIRED = [
  "EXPO_PUBLIC_API_URL",
  "EXPO_PUBLIC_WS_URL",
  "EXPO_PUBLIC_SENTRY_DSN",
  // iOS/Android pinning. Web builds skip pinning, but a release pipeline that
  // cannot supply pins cannot ship native either, so it is validated globally.
  "EXPO_PUBLIC_CERT_HASHES",
];

/** `sha256/` + 43 base64 chars + `=` (the encoding of a 32-byte SHA-256 digest). */
const PIN_PATTERN = /^sha256\/[A-Za-z0-9+/]{43}=$/;

/** Documented placeholders that are syntactically valid but never match a real cert. */
const PLACEHOLDER_PINS = new Set(["sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="]);

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function parseCertificateHashes(value) {
  return String(value ?? "")
    .split(",")
    .map((pin) => pin.trim())
    .filter(Boolean);
}

function validateCertificateHashes(value) {
  const pins = parseCertificateHashes(value);

  if (pins.length === 0) {
    return ["EXPO_PUBLIC_CERT_HASHES must list at least one certificate pin"];
  }

  const invalid = pins.filter((pin) => !PIN_PATTERN.test(pin) || PLACEHOLDER_PINS.has(pin));

  return invalid.length > 0
    ? [`EXPO_PUBLIC_CERT_HASHES contains malformed or placeholder pins: ${invalid.join(", ")}`]
    : [];
}

function main() {
  if (!isProduction()) {
    console.log("validate-env: NODE_ENV is not production — skipping strict checks.");
    process.exit(0);
  }

  const missing = PRODUCTION_REQUIRED.filter((key) => !String(process.env[key] ?? "").trim());
  const pinErrors = missing.includes("EXPO_PUBLIC_CERT_HASHES")
    ? []
    : validateCertificateHashes(process.env.EXPO_PUBLIC_CERT_HASHES);

  if (missing.length > 0 || pinErrors.length > 0) {
    console.error("validate-env: production build requires the following variables to be set:");
    missing.forEach((key) => console.error(`  - ${key}`));
    pinErrors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }

  console.log("validate-env: all required production variables are set.");
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = {
  main,
  isProduction,
  PRODUCTION_REQUIRED,
  PIN_PATTERN,
  PLACEHOLDER_PINS,
  parseCertificateHashes,
  validateCertificateHashes,
};
