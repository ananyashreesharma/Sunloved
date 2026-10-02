const path = require("path")
const { getDefaultConfig } = require("expo/metro-config")
const { withNativeWind } = require("nativewind/metro")

const config = getDefaultConfig(__dirname)

// Code shared with the web app lives outside this project (../packages/shared). It's installed as a
// "file:" dependency (node_modules/@skinlens/shared is a symlink to it); Metro must also watch the
// real folder so edits there trigger reloads.
const sharedRoot = path.resolve(__dirname, "../packages/shared")
config.watchFolders = [...(config.watchFolders ?? []), sharedRoot]

module.exports = withNativeWind(config, { input: "./src/global.css" })
