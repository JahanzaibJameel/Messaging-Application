#!/usr/bin/env node

/**
 * Validates required public environment variables for production builds.
 * Exits with code 1 if any required variable is missing or empty.
 */

const PRODUCTION_REQUIRED = ["EXPO_PUBLIC_API_URL", "EXPO_PUBLIC_WS_URL", "EXPO_PUBLIC_SENTRY_DSN"];

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function main() {
  if (!isProduction()) {
    console.log("validate-env: NODE_ENV is not production — skipping strict checks.");
    process.exit(0);
  }

  const missing = PRODUCTION_REQUIRED.filter((key) => !String(process.env[key] ?? "").trim());

  if (missing.length > 0) {
    console.error("validate-env: production build requires the following variables to be set:");
    missing.forEach((key) => console.error(`  - ${key}`));
    process.exit(1);
  }

  console.log("validate-env: all required production variables are set.");
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { main, isProduction, PRODUCTION_REQUIRED };
