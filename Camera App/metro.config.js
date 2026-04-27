const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add tflite as a recognized asset extension so models can be bundled via require()
config.resolver.assetExts.push('tflite');

module.exports = config;
