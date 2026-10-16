import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.tavrel.aris",
  appName: "A.R.I.S.",
  webDir: "dist",
  android: { allowMixedContent: false },
  server: { androidScheme: "https" }
};

export default config;
