const fs = require("fs");
const path = require("path");

// Read LCOV file
const lcovContent = fs.readFileSync(
  "D:/reactnative/Messaging-Application/coverage/lcov.info",
  "utf8"
);

// Parse LCOV
const records = lcovContent.split("\nend_of_record\n");

const fileData = {};

records.forEach((record) => {
  const lines = record.trim().split("\n");
  if (lines.length === 0) return;

  let currentFile = null;
  let totalLines = 0;
  let hitLines = 0;

  lines.forEach((line) => {
    if (line.startsWith("SF:")) {
      currentFile = line.substring(3);
      fileData[currentFile] = { totalLines: 0, hitLines: 0, uncoveredLines: [] };
    } else if (line.startsWith("LF:")) {
      totalLines = parseInt(line.substring(3), 10);
      fileData[currentFile].totalLines = totalLines;
    } else if (line.startsWith("LH:")) {
      hitLines = parseInt(line.substring(3), 10);
      fileData[currentFile].hitLines = hitLines;
    } else if (line.startsWith("DA:")) {
      const parts = line.substring(3).split(",");
      const lineNum = parseInt(parts[0], 10);
      const count = parseInt(parts[1], 10);
      if (count === 0) {
        fileData[currentFile].uncoveredLines.push(lineNum);
      }
    }
  });
});

// Filter and compute coverage
const EXCLUDE_PATTERNS = [
  /__tests__/,
  /test-utils/,
  /index\.ts$/,
  /\.d\.ts$/,
  /\.stories\.(ts|tsx)$/,
  /components/,
  /navigation/,
  /accessibility/,
  /Screens/,
];

const filteredFiles = [];

for (const [filePath, data] of Object.entries(fileData)) {
  const relativePath = filePath.replace(/^client\\src\\/i, "").replace(/\\/g, "/");

  // Check exclusions
  let excluded = false;
  for (const pattern of EXCLUDE_PATTERNS) {
    if (pattern.test(relativePath)) {
      excluded = true;
      break;
    }
  }

  if (excluded) continue;

  const totalLines = data.totalLines;
  const hitLines = data.hitLines;
  const uncoveredLines = data.uncoveredLines.length;
  const coveragePercent = totalLines > 0 ? (hitLines / totalLines) * 100 : 0;

  filteredFiles.push({
    filePath: relativePath,
    coveragePercent,
    totalLines,
    uncoveredLines,
    uncoveredLineNumbers: data.uncoveredLines, // keep for potential debugging
  });
}

// Sort by uncoveredLines descending
filteredFiles.sort((a, b) => b.uncoveredLines - a.uncoveredLines);

// Get top 15
const top15 = filteredFiles.slice(0, 15);

// Output JSON for easy parsing
console.log(JSON.stringify(top15, null, 2));
