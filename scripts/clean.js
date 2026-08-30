#!/usr/bin/env node

/**
 * Cross-platform cleanup script (replacement for `rm -rf`).
 * Removes build artifacts and installed dependencies.
 */

const fs = require("fs");
const path = require("path");

const targets = ["node_modules", "dist", ".expo", "server_dist", ".cache"];

for (const target of targets) {
  const fullPath = path.resolve(process.cwd(), target);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log(`Removed ${target}/`);
  }
}

console.log("Clean complete.");
