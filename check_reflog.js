const { execSync } = require("child_process");
try {
  const log = execSync("git reflog --all", { encoding: "utf8" });
  console.log(log.substring(0, 2000));
} catch (e) {
  console.error(e.message);
}
