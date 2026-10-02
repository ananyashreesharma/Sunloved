import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "in.knowbetter.app",
  appName: "Know Better",
  webDir: "out",
  server: {
    // Points the native app at your live site — no static export needed.
    // 10.0.2.2 is the Android emulator's alias for the host machine's localhost (dev server).
    // iOS Simulator shares the host's network directly, so it uses "localhost" instead.
    // Before publishing, switch this to your production URL, e.g. "https://knowbetter.in"
    url: process.env.CAP_PLATFORM === "ios" ? "http://localhost:3000" : "http://10.0.2.2:3000",
    cleartext: true,
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#F4EFE7",
    preferredContentMode: "mobile",
  },
  android: {
    backgroundColor: "#F4EFE7",
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#F4EFE7",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
    StatusBar: {
      style: "Dark",
      backgroundColor: "#1A1714",
    },
  },
}

export default config
