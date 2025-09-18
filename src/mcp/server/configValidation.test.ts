import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the bosonprotocol common module
vi.mock("@bosonprotocol/common", () => ({
  getConfigFromConfigId: vi.fn((configId) => {
    // Mock implementation that returns valid configs for known IDs
    const validConfigs = {
      "local-31337-0": { chainId: 31337 },
      "testing-80002-0": { chainId: 80002 },
      "testing-84532-0": { chainId: 84532 },
      "testing-11155111-0": { chainId: 11155111 },
      "testing-11155420-0": { chainId: 11155420 },
      "testing-421614-0": { chainId: 421614 },
      "staging-80002-0": { chainId: 80002 },
      "staging-84532-0": { chainId: 84532 },
      "staging-11155111-0": { chainId: 11155111 },
      "staging-11155420-0": { chainId: 11155420 },
      "staging-421614-0": { chainId: 421614 },
      "production-137-0": { chainId: 137 },
      "production-42161-0": { chainId: 42161 },
      "production-8453-0": { chainId: 8453 },
      "production-10-0": { chainId: 10 },
      "production-1-0": { chainId: 1 },
      "invalid-config": null,
    };

    if (validConfigs[configId]) {
      return validConfigs[configId];
    }

    throw new Error(`Config not found for ID: ${configId}`);
  }),
}));

describe("Config Validation", () => {
  let originalEnv;

  beforeEach(() => {
    // Store original env
    originalEnv = process.env.CONFIG_IDS;
    // Clear any cached modules
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original env
    if (originalEnv !== undefined) {
      process.env.CONFIG_IDS = originalEnv;
    } else {
      delete process.env.CONFIG_IDS;
    }
  });

  describe("getSupportedConfigIds", () => {
    it("should return default config IDs when CONFIG_IDS env var is not set", async () => {
      delete process.env.CONFIG_IDS;

      // Dynamic import to get fresh module instance
      const { getSupportedConfigIds } = await import("./configValidation.js");
      const configIds = getSupportedConfigIds();

      expect(configIds).toContain("local-31337-0");
      expect(configIds).toContain("testing-80002-0");
      expect(configIds).toContain("production-137-0");
      expect(configIds.length).toBeGreaterThan(10);
    });

    it("should parse CONFIG_IDS from environment variable", async () => {
      process.env.CONFIG_IDS = "local-31337-0,testing-80002-0,production-137-0";

      // Dynamic import to get fresh module instance
      const { getSupportedConfigIds } = await import("./configValidation.js");
      const configIds = getSupportedConfigIds();

      expect(configIds).toEqual([
        "local-31337-0",
        "testing-80002-0",
        "production-137-0",
      ]);
    });

    it("should trim whitespace from config IDs", async () => {
      process.env.CONFIG_IDS =
        " local-31337-0 , testing-80002-0 , production-137-0 ";

      const { getSupportedConfigIds } = await import("./configValidation.js");
      const configIds = getSupportedConfigIds();

      expect(configIds).toEqual([
        "local-31337-0",
        "testing-80002-0",
        "production-137-0",
      ]);
    });

    it("should throw error for invalid config ID", async () => {
      process.env.CONFIG_IDS = "local-31337-0,invalid-config";

      await expect(async () => {
        await import("./configValidation.js");
      }).rejects.toThrow("Invalid config ID: invalid-config");
    });

    it("should cache config IDs after first call", async () => {
      const { getSupportedConfigIds } = await import("./configValidation.js");

      const configIds1 = getSupportedConfigIds();
      const configIds2 = getSupportedConfigIds();

      expect(configIds1).toBe(configIds2); // Same reference
    });
  });

  describe("supportedConfigIds", () => {
    it("should be initialized with config IDs", async () => {
      const { supportedConfigIds } = await import("./configValidation.js");

      expect(Array.isArray(supportedConfigIds)).toBe(true);
      expect(supportedConfigIds.length).toBeGreaterThan(0);
    });
  });

  describe("supportedChainIds", () => {
    it("should extract unique chain IDs from supported config IDs", async () => {
      const { supportedChainIds } = await import("./configValidation.js");

      expect(Array.isArray(supportedChainIds)).toBe(true);
      expect(supportedChainIds).toContain(31337);
      expect(supportedChainIds).toContain(80002);
      expect(supportedChainIds).toContain(137);

      // Should contain unique values only
      const uniqueChainIds = [...new Set(supportedChainIds)];
      expect(supportedChainIds.length).toBe(uniqueChainIds.length);
    });

    it("should filter out null chain IDs", async () => {
      const { supportedChainIds } = await import("./configValidation.js");

      expect(supportedChainIds.every((chainId) => chainId !== null)).toBe(true);
    });
  });

  describe("configIdValidation", () => {
    it("should validate supported config IDs", async () => {
      const { configIdValidation } = await import("./configValidation.js");

      expect(() => configIdValidation.parse("local-31337-0")).not.toThrow();
      expect(() => configIdValidation.parse("testing-80002-0")).not.toThrow();
      expect(() => configIdValidation.parse("production-137-0")).not.toThrow();
    });

    it("should reject unsupported config IDs", async () => {
      const { configIdValidation } = await import("./configValidation.js");

      expect(() => configIdValidation.parse("unsupported-config")).toThrow();
      expect(() => configIdValidation.parse("invalid-12345-0")).toThrow();
    });

    it("should provide helpful error message with supported config IDs", async () => {
      const { configIdValidation } = await import("./configValidation.js");

      try {
        configIdValidation.parse("invalid-config");
      } catch (error) {
        expect(error.message).toContain("Invalid config ID: invalid-config");
        expect(error.message).toContain("Supported config IDs:");
        expect(error.message).toContain("local-31337-0");
      }
    });

    it("should handle empty string", async () => {
      const { configIdValidation } = await import("./configValidation.js");

      expect(() => configIdValidation.parse("")).toThrow();
    });

    it("should handle non-string values", async () => {
      const { configIdValidation } = await import("./configValidation.js");

      expect(() => configIdValidation.parse(123)).toThrow();
      expect(() => configIdValidation.parse(null)).toThrow();
      expect(() => configIdValidation.parse(undefined)).toThrow();
    });
  });

  describe("environment variable edge cases", () => {
    it("should handle empty CONFIG_IDS environment variable", async () => {
      process.env.CONFIG_IDS = "";

      const { getSupportedConfigIds } = await import("./configValidation.js");
      const configIds = getSupportedConfigIds();

      // Should fall back to default config IDs
      expect(configIds.length).toBeGreaterThan(10);
    });

    it("should handle CONFIG_IDS with only commas", async () => {
      process.env.CONFIG_IDS = ",,,";

      await expect(async () => {
        await import("./configValidation.js");
      }).rejects.toThrow(); // Should throw because empty strings are invalid config IDs
    });

    it("should handle single config ID without commas", async () => {
      process.env.CONFIG_IDS = "local-31337-0";

      const { getSupportedConfigIds } = await import("./configValidation.js");
      const configIds = getSupportedConfigIds();

      expect(configIds).toEqual(["local-31337-0"]);
    });
  });
});
