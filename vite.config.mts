import { defineConfig, mergeConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig as defineVitestConfig } from "vitest/config";
import { nodePolyfills } from "vite-plugin-node-polyfills";

const viteConfig = defineConfig({
  define: {
    global: "globalThis",
    globalThis: "globalThis",
    "import.meta.url": "import.meta.url" // required for xmtp
  },
  worker: {
    format: "es",
  },
  plugins: [
    tsconfigPaths(),
    nodePolyfills({
      protocolImports: true,
      globals: { Buffer: false, global: false, process: false },
    }),
  ],
  optimizeDeps: {
    exclude: ["@xmtp/wasm-bindings", "@xmtp/browser-sdk"],
    include: ["buffer", "protobufjs/minimal", "@xmtp/proto"],
  },
  resolve: {
    alias: {
      buffer: "buffer/",
    },
  },
});

const vitestConfig = defineVitestConfig({
  optimizeDeps: {
    exclude: ["@xmtp/wasm-bindings", "@xmtp/browser-sdk"],
    include: ["buffer", "protobufjs/minimal"],
  },
  resolve: {
    alias: {
      buffer: "buffer/",
    },
  },
  test: {
    // Specifically include browser and common folder tests
    include: ["src/browser/**/*.test.{ts,js}", "src/common/**/*.test.{ts,js}"],
    browser: {
      enabled: true,
      provider: "playwright",
      instances: [{ browser: "chromium" }],
      headless: true,
    },
    testTimeout: 1200000,
    retry: 3,
  },
  server: {
    fs: {
      allow: [process.cwd()],
    },
  },
});

export default mergeConfig(viteConfig, vitestConfig);
