const path = require("path")
const { getDefaultConfig } = require("expo/metro-config")
const { withNativeWind } = require("nativewind/metro")

const config = getDefaultConfig(__dirname)

// Code shared with the web app lives outside this project (../packages/shared). Metro has to watch
// that folder and know where the "@skinlens/shared" import points, since it isn't in node_modules.
const sharedRoot = path.resolve(__dirname, "../packages/shared")
config.watchFolders = [...(config.watchFolders ?? []), sharedRoot]
config.resolver.extraNodeModules = { ...(config.resolver.extraNodeModules ?? {}), "@skinlens/shared": sharedRoot }

module.exports = withNativeWind(config, { input: "./src/global.css" })
