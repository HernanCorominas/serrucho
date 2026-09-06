const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch monorepo packages and node_modules without scanning unwanted root subdirectories
config.watchFolders = [
  path.resolve(monorepoRoot, "packages"),
  path.resolve(monorepoRoot, "node_modules"),
];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules/expo/node_modules"),
];

// 3. Polyfill Node built-in modules like buffer for react-native-svg
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  buffer: require.resolve("buffer/"),
};

module.exports = config;

