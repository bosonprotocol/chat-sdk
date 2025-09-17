/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Chain } from "@goat-sdk/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BosonXmtpMCPClient } from "../../client/boson-client.js";
import {
  type BosonProtocolXmtpOptions,
  BosonProtocolXmtpPlugin,
  bosonProtocolXmtpPlugin,
} from "./boson-protocol.plugin.js";
import { BosonXmtpPluginService } from "./boson-protocol-xmtp-plugin.service.js";

// Mock dependencies
vi.mock("@goat-sdk/core", () => ({
  PluginBase: class MockPluginBase {
    public name: string;
    public tools: any[];

    constructor(name: string, tools: any[]) {
      this.name = name;
      this.tools = tools;
    }
  },
}));

vi.mock("../../client/boson-client.js", () => ({
  BosonXmtpMCPClient: vi.fn().mockImplementation(() => ({
    isConnected: false,
    connectToServer: vi.fn(),
  })),
}));

vi.mock("./boson-protocol-xmtp-plugin.service.js", () => ({
  BosonXmtpPluginService: vi.fn().mockImplementation((client, privateKey) => ({
    client,
    privateKey,
    mockService: true,
  })),
}));

vi.mock("../configValidation.js", () => ({
  supportedChainIds: [1, 5, 11155111, 137, 80001], // Mock supported chain IDs
}));

describe("BosonProtocolXmtpPlugin", () => {
  let mockOptions: BosonProtocolXmtpOptions;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOptions = {
      privateKey:
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should create plugin with correct name and service", () => {
      const plugin = new BosonProtocolXmtpPlugin(mockOptions);

      expect(plugin.name).toBe("boson-protocol-xmtp");
      expect(plugin.tools).toHaveLength(1);
      expect(plugin.tools[0]).toHaveProperty("mockService", true);
    });

    it("should initialize BosonXmtpMCPClient", () => {
      new BosonProtocolXmtpPlugin(mockOptions);

      expect(BosonXmtpMCPClient).toHaveBeenCalledTimes(1);
      expect(BosonXmtpMCPClient).toHaveBeenCalledWith();
    });

    it("should initialize BosonXmtpPluginService with client and private key", () => {
      new BosonProtocolXmtpPlugin(mockOptions);

      expect(BosonXmtpPluginService).toHaveBeenCalledTimes(1);
      expect(BosonXmtpPluginService).toHaveBeenCalledWith(
        expect.any(Object), // The MCP client instance
        mockOptions.privateKey,
      );
    });

    it("should handle different private key formats", () => {
      const testKeys = [
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        "0xABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890",
      ];

      testKeys.forEach((privateKey) => {
        const options = { privateKey };
        new BosonProtocolXmtpPlugin(options);

        expect(BosonXmtpPluginService).toHaveBeenCalledWith(
          expect.any(Object),
          privateKey,
        );

        // Clear mock for next iteration
        vi.mocked(BosonXmtpPluginService).mockClear();
      });
    });
  });

  describe("supportsChain", () => {
    let plugin: BosonProtocolXmtpPlugin;

    beforeEach(() => {
      plugin = new BosonProtocolXmtpPlugin(mockOptions);
    });

    it("should return true for supported EVM chains", () => {
      const supportedChains: Chain[] = [
        { type: "evm", id: 1 }, // Ethereum mainnet
        { type: "evm", id: 5 }, // Goerli
        { type: "evm", id: 11155111 }, // Sepolia
        { type: "evm", id: 137 }, // Polygon
        { type: "evm", id: 80001 }, // Mumbai
      ];

      supportedChains.forEach((chain) => {
        expect(plugin.supportsChain(chain)).toBe(true);
      });
    });

    it("should return false for unsupported EVM chains", () => {
      const unsupportedEvmChains: Chain[] = [
        { type: "evm", id: 999 }, // Unknown chain
        { type: "evm", id: 56 }, // BSC (not in mock supported list)
        { type: "evm", id: 43114 }, // Avalanche (not in mock supported list)
        { type: "evm", id: 42161 }, // Arbitrum (not in mock supported list)
      ];

      unsupportedEvmChains.forEach((chain) => {
        expect(plugin.supportsChain(chain)).toBe(false);
      });
    });

    it("should return false for non-EVM chains", () => {
      const nonEvmChains: Chain[] = [
        { type: "bitcoin", id: 1 },
        { type: "solana", id: 1 },
        { type: "cosmos", id: 1 },
        { type: "substrate", id: 1 },
      ];

      nonEvmChains.forEach((chain) => {
        expect(plugin.supportsChain(chain as any)).toBe(false);
      });
    });

    it("should return false when chain type is EVM but ID is not supported", () => {
      const chain: Chain = { type: "evm", id: 9999 };

      expect(plugin.supportsChain(chain)).toBe(false);
    });

    it("should handle edge cases in chain validation", () => {
      const edgeCaseChains = [
        { type: "evm", id: 0 },
        { type: "evm", id: -1 },
        { type: "evm", id: 1.5 },
        { type: "EVM", id: 1 }, // Wrong case
        { type: "", id: 1 },
        { type: null, id: 1 },
        { type: "evm", id: null },
        { type: "evm", id: undefined },
      ];

      edgeCaseChains.forEach((chain) => {
        expect(plugin.supportsChain(chain as any)).toBe(false);
      });
    });
  });

  describe("inheritance from PluginBase", () => {
    it("should properly extend PluginBase", () => {
      const plugin = new BosonProtocolXmtpPlugin(mockOptions);

      // Verify it has the expected properties from PluginBase
      expect(plugin).toHaveProperty("name");
      expect(plugin).toHaveProperty("tools");
      expect(plugin).toHaveProperty("supportsChain");

      // Verify the name is set correctly
      expect(plugin.name).toBe("boson-protocol-xmtp");

      // Verify tools array is properly initialized
      expect(Array.isArray(plugin.tools)).toBe(true);
      expect(plugin.tools.length).toBe(1);
    });
  });

  describe("plugin service integration", () => {
    it("should pass the correct parameters to BosonXmtpPluginService", () => {
      const customOptions = {
        privateKey:
          "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
      };

      new BosonProtocolXmtpPlugin(customOptions);

      const serviceCall = vi.mocked(BosonXmtpPluginService).mock.calls[0];
      expect(serviceCall[0]).toBeDefined(); // MCP client instance
      expect(serviceCall[1]).toBe(customOptions.privateKey);
    });

    it("should create a new MCP client instance for each plugin instance", () => {
      const plugin1 = new BosonProtocolXmtpPlugin(mockOptions);
      const plugin2 = new BosonProtocolXmtpPlugin(mockOptions);

      expect(BosonXmtpMCPClient).toHaveBeenCalledTimes(2);

      // Verify they have different service instances
      expect(plugin1.tools[0]).not.toBe(plugin2.tools[0]);
    });
  });

  describe("error handling", () => {
    it("should handle invalid options gracefully", () => {
      // TypeScript would prevent this, but test runtime behavior
      expect(() => {
        new BosonProtocolXmtpPlugin({} as any);
      }).not.toThrow();

      expect(() => {
        new BosonProtocolXmtpPlugin({ privateKey: undefined } as any);
      }).not.toThrow();
    });

    it("should handle MCP client creation failures", () => {
      vi.mocked(BosonXmtpMCPClient).mockImplementationOnce(() => {
        throw new Error("MCP client creation failed");
      });

      expect(() => {
        new BosonProtocolXmtpPlugin(mockOptions);
      }).toThrow("MCP client creation failed");
    });

    it("should handle service creation failures", () => {
      vi.mocked(BosonXmtpPluginService).mockImplementationOnce(() => {
        throw new Error("Service creation failed");
      });

      expect(() => {
        new BosonProtocolXmtpPlugin(mockOptions);
      }).toThrow("Service creation failed");
    });
  });
});

describe("bosonProtocolXmtpPlugin factory function", () => {
  let mockOptions: BosonProtocolXmtpOptions;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOptions = {
      privateKey:
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    };
  });

  it("should create and return BosonProtocolXmtpPlugin instance", () => {
    const plugin = bosonProtocolXmtpPlugin(mockOptions);

    expect(plugin).toBeInstanceOf(BosonProtocolXmtpPlugin);
    expect(plugin.name).toBe("boson-protocol-xmtp");
  });

  it("should pass options correctly to constructor", () => {
    const customOptions = {
      privateKey:
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
    };

    bosonProtocolXmtpPlugin(customOptions);

    expect(BosonXmtpPluginService).toHaveBeenCalledWith(
      expect.any(Object),
      customOptions.privateKey,
    );
  });

  it("should create independent plugin instances", () => {
    const plugin1 = bosonProtocolXmtpPlugin(mockOptions);
    const plugin2 = bosonProtocolXmtpPlugin(mockOptions);

    expect(plugin1).not.toBe(plugin2);
    expect(plugin1.tools[0]).not.toBe(plugin2.tools[0]);
  });

  it("should work with different option configurations", () => {
    const optionVariants = [
      {
        privateKey:
          "0x1111111111111111111111111111111111111111111111111111111111111111",
      },
      {
        privateKey:
          "0x2222222222222222222222222222222222222222222222222222222222222222",
      },
      {
        privateKey:
          "0x3333333333333333333333333333333333333333333333333333333333333333",
      },
    ];

    optionVariants.forEach((options, index) => {
      const plugin = bosonProtocolXmtpPlugin(options);

      expect(plugin).toBeInstanceOf(BosonProtocolXmtpPlugin);
      expect(plugin.name).toBe("boson-protocol-xmtp");

      // Check that the correct private key was passed to the service
      const serviceCall = vi.mocked(BosonXmtpPluginService).mock.calls[index];
      expect(serviceCall[1]).toBe(options.privateKey);
    });
  });
});

describe("integration tests", () => {
  let mockOptions: BosonProtocolXmtpOptions;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOptions = {
      privateKey:
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    };
  });

  it("should create a fully functional plugin instance", () => {
    const plugin = new BosonProtocolXmtpPlugin(mockOptions);

    // Verify plugin structure
    expect(plugin.name).toBe("boson-protocol-xmtp");
    expect(plugin.tools).toHaveLength(1);
    expect(typeof plugin.supportsChain).toBe("function");

    // Verify chain support works
    expect(plugin.supportsChain({ type: "evm", id: 1 })).toBe(true);
    expect(plugin.supportsChain({ type: "bitcoin", id: 1 } as any)).toBe(false);

    // Verify service integration
    expect(BosonXmtpMCPClient).toHaveBeenCalled();
    expect(BosonXmtpPluginService).toHaveBeenCalledWith(
      expect.any(Object),
      mockOptions.privateKey,
    );
  });

  it("should work end-to-end with factory function", () => {
    const plugin = bosonProtocolXmtpPlugin(mockOptions);

    // Test the complete plugin functionality
    expect(plugin.name).toBe("boson-protocol-xmtp");
    expect(plugin.supportsChain({ type: "evm", id: 137 })).toBe(true);
    expect(plugin.supportsChain({ type: "evm", id: 999 })).toBe(false);
    expect(plugin.tools).toHaveLength(1);
  });

  it("should maintain separation between plugin instances", () => {
    const options1 = { privateKey: "0x1111" };
    const options2 = { privateKey: "0x2222" };

    const plugin1 = bosonProtocolXmtpPlugin(options1);
    const plugin2 = bosonProtocolXmtpPlugin(options2);

    // Both should work independently
    expect(plugin1.supportsChain({ type: "evm", id: 1 })).toBe(true);
    expect(plugin2.supportsChain({ type: "evm", id: 1 })).toBe(true);

    // But should be separate instances
    expect(plugin1).not.toBe(plugin2);
    expect(plugin1.tools).not.toBe(plugin2.tools);
  });
});
