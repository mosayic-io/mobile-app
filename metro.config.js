const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for .js extensions in node_modules
config.resolver.sourceExts.push('js');

// Ensure proper module resolution for TanStack Query
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Fix for @tanstack/react-query module resolution
  if (moduleName.startsWith('@tanstack/react-query')) {
    // Let Metro handle it with default resolution
    return context.resolveRequest(context, moduleName, platform);
  }

  // Default resolution for everything else
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
