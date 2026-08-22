const fs = require("fs");
const path = require("path");

function patchDir(nodeModulesDir) {
  if (!fs.existsSync(nodeModulesDir)) return;

  const dirs = fs.readdirSync(nodeModulesDir).filter((d) => d.startsWith("metro"));

  for (const dir of dirs) {
    const pkgPath = path.join(nodeModulesDir, dir, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        pkg.exports = {
          ".": "./src/index.js",
          "./package.json": "./package.json",
          "./private/*": "./src/*.js",
          "./src/*": "./src/*.js",
          "./src/*.js": "./src/*.js",
          "./*": ["./src/*.js", "./*.js", "./*"]
        };
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), "utf8");
      } catch (err) {
        console.error(`[patch-metro] Error in ${dir}:`, err.message);
      }
    }
  }
}

// Patch in root node_modules and apps/mobile/node_modules if present
patchDir(path.resolve(__dirname, "../node_modules"));
patchDir(path.resolve(__dirname, "../apps/mobile/node_modules"));
console.log("[patch-metro] All Metro packages patched with full universal exports mapping.");
