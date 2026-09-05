const fs = require("fs");
const path = require("path");

const indexPath = path.join(process.cwd(), "dist", "index.html");
let content = fs.readFileSync(indexPath, "utf8");

content = content.replace(
  '<script src="/_expo/static/js/web/',
  '<script type="module" src="/_expo/static/js/web/'
);

fs.writeFileSync(indexPath, content);
console.log("Fixed script tag in", indexPath);
