/**
 * Generates the APPLE_CLIENT_SECRET JWT required by NextAuth AppleProvider.
 *
 * Prerequisites:
 *   1. Apple Developer account with Sign in with Apple enabled
 *   2. A Services ID created (this is your APPLE_CLIENT_ID, e.g. com.yourdomain.ouma)
 *   3. A Key created in "Keys" section with Sign in with Apple enabled
 *      → Download the .p8 file and note the Key ID
 *
 * Usage:
 *   node scripts/generate-apple-secret.mjs \
 *     --teamId=XXXXXXXXXX \
 *     --keyId=XXXXXXXXXX \
 *     --clientId=com.yourdomain.ouma \
 *     --keyFile=./AuthKey_XXXXXXXXXX.p8
 *
 * The output is the value to paste into APPLE_CLIENT_SECRET in .env.local.
 * It expires in 180 days — regenerate before then.
 */

import { readFileSync } from "fs"
import { createSign } from "crypto"

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, "").split("=")
    return [k, v.join("=")]
  })
)

const { teamId, keyId, clientId, keyFile } = args

if (!teamId || !keyId || !clientId || !keyFile) {
  console.error("Usage: node generate-apple-secret.mjs --teamId=X --keyId=X --clientId=X --keyFile=./AuthKey.p8")
  process.exit(1)
}

const privateKey = readFileSync(keyFile, "utf8")
const now = Math.floor(Date.now() / 1000)
const exp = now + 180 * 24 * 60 * 60  // 180 days

const header = Buffer.from(JSON.stringify({ alg: "ES256", kid: keyId })).toString("base64url")
const payload = Buffer.from(JSON.stringify({
  iss: teamId,
  iat: now,
  exp,
  aud: "https://appleid.apple.com",
  sub: clientId,
})).toString("base64url")

const unsigned = `${header}.${payload}`
const sign = createSign("SHA256")
sign.update(unsigned)
const signature = sign.sign({ key: privateKey, dsaEncoding: "ieee-p1363" }).toString("base64url")

console.log("\nAPPLE_CLIENT_SECRET=\n" + `${unsigned}.${signature}`)
console.log(`\nExpires: ${new Date(exp * 1000).toISOString()} (180 days from now)\n`)
