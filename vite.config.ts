import { defineConfig, mergeConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig as defineVitestConfig } from "vitest/config";

const viteConfig = defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      buffer: "buffer/" // Add buffer polyfill
    }
  },
  optimizeDeps: {
    exclude: ["@xmtp/wasm-bindings"],
    include: [
      // Add browser polyfills
      "buffer"
    ]
  }
});

const vitestConfig = defineVitestConfig({
  test: {
    browser: {
      provider: "playwright",
      enabled: true,
      headless: true,
      screenshotFailures: false,
      instances: [
        {
          browser: "chromium"
        }
      ]
    },
    testTimeout: 120000,
    setupFiles: ["./test-setup.ts"] // Add setup file
  },
  server: {
    fs: {
      allow: [
        // Allow access to node_modules
        "node_modules",
        // Allow access to workspace root
        process.cwd()
      ]
    }
  }
});

export default mergeConfig(viteConfig, vitestConfig);
