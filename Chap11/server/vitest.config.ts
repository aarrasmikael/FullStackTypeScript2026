import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globalSetup: ["./src/__tests__/globalSetup.ts"],
    setupFiles: ["./src/__tests__/setupEnv.ts"],
    // Testit jakavat yhden tietokannan, joten tiedostot ajetaan perakkain
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
