import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node", // Use Node environment instead of browser
    testTimeout: 120000,
    retry: 0,
    // Optionally specify test file patterns for Node tests
    include: ["src/node/**/*.test.{ts,js}", "src/mcp/**/*.test.{ts,js}"],
  },
  resolve: {
    // No browser polyfills needed in Node environment
    alias: {},
  },
  // Remove browser-specific optimizations
  optimizeDeps: {
    // Node environment handles these natively
  },
});
