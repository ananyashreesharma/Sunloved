// No workspace here (see the root README), so the tests borrow the backend's Jest + ts-jest rather than
// installing a third copy. Run `npm install` in backend/ first.
const path = require("path")
const backend = path.join(__dirname, "../backend/node_modules")

module.exports = {
  rootDir: __dirname,
  roots: ["<rootDir>/test"],
  testEnvironment: "node",
  transform: {
    "^.+\\.ts$": [
      path.join(backend, "ts-jest"),
      { diagnostics: false, tsconfig: { module: "commonjs", target: "ES2020", isolatedModules: true } },
    ],
  },
}
