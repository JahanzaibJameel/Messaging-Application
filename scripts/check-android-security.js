#!/usr/bin/env node

/**
 * Validates the Android network security configuration.
 *
 * The project uses Expo prebuild (no android/ directory is committed), so the
 * manifest does not exist in source control. In that case this check passes;
 * otherwise it verifies that cleartext traffic is disabled for production.
 */

const fs = require("fs");
const path = require("path");

const manifestPath = path.resolve(
  process.cwd(),
  "android",
  "app",
  "src",
  "main",
  "AndroidManifest.xml"
);

if (!fs.existsSync(manifestPath)) {
  console.log(
    "check-android-security: no committed AndroidManifest.xml (Expo managed workflow) — skipping."
  );
  process.exit(0);
}

const manifest = fs.readFileSync(manifestPath, "utf8");

if (/usesCleartextTraffic="false"/.test(manifest)) {
  console.log("check-android-security: cleartext traffic is disabled.");
  process.exit(0);
}

console.error(
  'check-android-security: Android cleartext traffic is not disabled ("usesCleartextTraffic=\\"false\\"").'
);
process.exit(1);
