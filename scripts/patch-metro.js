const fs = require("fs");
const path = require("path");

const nodeModulesDir = path.resolve(__dirname, "../node_modules");

if (fs.existsSync(nodeModulesDir)) {
  const dirs = fs.readdirSync(nodeModulesDir).filter((d) => d.startsWith("metro"));

  for (const dir of dirs) {
    const pkgPath = path.join(nodeModulesDir, dir, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        if (pkg.exports) {
          // Delete restrictive exports field so Node.js falls back to legacy require
          delete pkg.exports;
          fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), "utf8");
          console.log(`[patch-metro] Unlocked exports in ${dir}`);
        }
      } catch (err) {
        console.error(`[patch-metro] Error patching ${dir}:`, err.message);
      }
    }
  }
}
