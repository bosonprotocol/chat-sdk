import { defineConfig, mergeConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig as defineVitestConfig } from "vitest/config";
import { nodePolyfills } from "vite-plugin-node-polyfills";

const viteConfig = defineConfig({
  define: {
    global: "globalThis",
    globalThis: "globalThis"
  },
  worker: {
    format: "es"
  },
  plugins: [
    tsconfigPaths(),
    nodePolyfills({
      protocolImports: true,
      globals: { Buffer: false, global: false, process: false } // Keep this
    })
  ],
  optimizeDeps: {
    exclude: [
      "@xmtp/wasm-bindings",
      "@xmtp/browser-sdk" // Keep SDK excluded
    ],
    include: [
      "buffer", // Keep buffer polyfill included
      // *** Force Vite to process protobufjs/minimal ***
      "protobufjs/minimal"
      // You might also need 'protobufjs' if other parts are used,
      // or '@xmtp/proto' if that package causes issues later. Start with minimal.
    ]
  },
  resolve: {
    alias: {
      buffer: "buffer/" // Keep buffer alias
      // Alias for worker client removed
    }
  }
});

const vitestConfig = defineVitestConfig({
  optimizeDeps: {
    exclude: [
      "@xmtp/wasm-bindings",
      "@xmtp/browser-sdk" // Keep SDK excluded
    ],
    include: [
      "buffer", // Keep buffer polyfill included
      // *** MIRROR Force Vite to process protobufjs/minimal ***
      "protobufjs/minimal"
    ]
  },
  resolve: {
    alias: {
      buffer: "buffer/" // Keep buffer alias
      // Alias for worker client removed
    }
  },
  test: {
    // Keep browser config
    browser: {
      enabled: true,
      provider: "playwright",
      instances: [{ browser: "chromium" }],
      headless: true
    },
    testTimeout: 120000
  },
  server: {
    fs: {
      allow: [process.cwd()]
    }
  }
});

export default mergeConfig(viteConfig, vitestConfig);
