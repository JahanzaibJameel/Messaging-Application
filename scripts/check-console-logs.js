#!/usr/bin/env node

/**
 * Console Log Check Script
 * Scans client source files for console.log-style statements and fails if
 * any are found outside of approved logging infrastructure.
 *
 * Usage: node scripts/check-console-logs.js
 */

const fs = require("fs");
const path = require("path");
const glob = require("glob");

const CONFIG = {
  // Scan client production code. The server intentionally logs via console.
  patterns: ["client/src/**/*.{ts,tsx,js,jsx}"],
  // Patterns to ignore (test files, mocks, logging infrastructure)
  ignorePatterns: [
    "**/*.test.{ts,tsx,js,jsx}",
    "**/*.spec.{ts,tsx,js,jsx}",
    "**/__tests__/**",
    "**/test-utils/**",
    "**/node_modules/**",
    "**/dist/**",
    "**/coverage/**",
    "client/src/core/logger/**",
    "client/src/utils/logger.ts",
    "client/src/core/errorHandling/SentryBreadcrumbs.tsx",
  ],
  // Console methods that should never appear in production code paths
  forbiddenConsole: [
    "console.log",
    "console.info",
    "console.debug",
    "console.trace",
    "console.table",
  ],
};

function listFiles() {
  const files = new Set();
  for (const pattern of CONFIG.patterns) {
    for (const file of glob.sync(pattern, { ignore: CONFIG.ignorePatterns })) {
      files.add(file);
    }
  }
  return [...files];
}

function extractConsoleStatements(content) {
  const statements = [];
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    const withoutComments = line.split("//")[0];
    CONFIG.forbiddenConsole.forEach((method) => {
      if (withoutComments.includes(method)) {
        statements.push({
          method,
          line: index + 1,
          content: line.trim(),
        });
      }
    });
  });

  return statements;
}

function checkConsoleLogs() {
  const files = listFiles();
  const allIssues = [];

  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      allIssues.push(...extractConsoleStatements(content).map((issue) => ({ ...issue, filePath })));
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error.message);
      process.exitCode = 1;
    }
  }

  console.log(`Checked ${files.length} files for forbidden console statements.`);

  if (allIssues.length > 0) {
    console.error("\nForbidden console statements found:");
    for (const issue of allIssues) {
      console.error(`  ${issue.filePath}:${issue.line} ${issue.method}`);
    }
    process.exit(1);
  }

  console.log("No forbidden console statements found.");
}

if (require.main === module) {
  checkConsoleLogs();
}

module.exports = { checkConsoleLogs, CONFIG };
