/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Chain } from "@goat-sdk/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BosonXmtpMCPClientHttp } from "../../client/boson-client-http.js";
import { BosonXmtpMCPClientStdio } from "../../client/boson-client-stdio.js";
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

vi.mock("../../client/boson-client-http.js", () => ({
  BosonXmtpMCPClientHttp: vi.fn().mockImplementation(() => ({
    isConnected: false,
    connectToServer: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock("../../client/boson-client-stdio.js", () => ({
  BosonXmtpMCPClientStdio: vi.fn().mockImplementation(() => ({
    isConnected: false,
    connectToServer: vi.fn().mockResolvedValue(undefined),
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
  let mockStdioOptions: BosonProtocolXmtpOptions;
  let mockHttpOptions: BosonProtocolXmtpOptions;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset the mock implementation to ensure consistent behavior
    vi.mocked(BosonXmtpPluginService).mockImplementation(
      (client, privateKey) => ({
        client,
        privateKey,
        mockService: true,
      }),
    );

    mockStdioOptions = {
      privateKey:
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      stdio: true,
    };
    mockHttpOptions = {
      privateKey:
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      http: true,
      url: "http://localhost:3000",
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should create plugin with correct name and service using stdio", () => {
      const plugin = new BosonProtocolXmtpPlugin(mockStdioOptions);

      expect(plugin.name).toBe("boson-protocol-xmtp");
      expect(plugin.tools).toHaveLength(1);
      expect(plugin.tools[0]).toHaveProperty("mockService", true);
    });

    it("should create plugin with correct name and service using http", () => {
      const plugin = new BosonProtocolXmtpPlugin(mockHttpOptions);

      expect(plugin.name).toBe("boson-protocol-xmtp");
      expect(plugin.tools).toHaveLength(1);
      expect(plugin.tools[0]).toHaveProperty("mockService", true);
    });

    it("should initialize BosonXmtpMCPClientStdio when stdio option is provided", () => {
      new BosonProtocolXmtpPlugin(mockStdioOptions);

      expect(BosonXmtpMCPClientStdio).toHaveBeenCalledTimes(1);
      expect(BosonXmtpMCPClientStdio).toHaveBeenCalledWith();
    });

    it("should initialize BosonXmtpMCPClientHttp when http option is provided", () => {
      new BosonProtocolXmtpPlugin(mockHttpOptions);

      expect(BosonXmtpMCPClientHttp).toHaveBeenCalledTimes(1);
      expect(BosonXmtpMCPClientHttp).toHaveBeenCalledWith(mockHttpOptions.url);
    });

    it("should initialize BosonXmtpPluginService with client and private key", () => {
      new BosonProtocolXmtpPlugin(mockStdioOptions);

      expect(BosonXmtpPluginService).toHaveBeenCalledTimes(1);
      expect(BosonXmtpPluginService).toHaveBeenCalledWith(
        expect.any(Object), // The MCP client instance
        mockStdioOptions.privateKey,
      );
    });

    it("should handle different private key formats", () => {
      const testKeys = [
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        "0xABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890",
      ];

      testKeys.forEach((privateKey) => {
        const options = { privateKey, stdio: true as const };
        new BosonProtocolXmtpPlugin(options);

        expect(BosonXmtpPluginService).toHaveBeenCalledWith(
          expect.any(Object),
          privateKey,
        );

        // Clear mock for next iteration
        vi.mocked(BosonXmtpPluginService).mockClear();
      });
    });

    it("should throw error when neither stdio nor http options are provided", () => {
      const invalidOptions = {
        privateKey:
          "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      } as any;

      expect(() => {
        new BosonProtocolXmtpPlugin(invalidOptions);
      }).toThrow("Invalid options in BosonProtocolXmtpPlugin constructor");
    });
  });

  describe("supportsChain", () => {
    let plugin: BosonProtocolXmtpPlugin;

    beforeEach(() => {
      plugin = new BosonProtocolXmtpPlugin(mockStdioOptions);
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
      const plugin = new BosonProtocolXmtpPlugin(mockStdioOptions);

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
    it("should pass the correct parameters to BosonXmtpPluginService with stdio client", () => {
      const customOptions = {
        privateKey:
          "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
        stdio: true as const,
      };

      new BosonProtocolXmtpPlugin(customOptions);

      const serviceCall = vi.mocked(BosonXmtpPluginService).mock.calls[0];
      expect(serviceCall[0]).toBeDefined(); // MCP client instance
      expect(serviceCall[1]).toBe(customOptions.privateKey);
    });

    it("should pass the correct parameters to BosonXmtpPluginService with http client", () => {
      const customOptions = {
        privateKey:
          "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
        http: true as const,
        url: "http://localhost:4000",
      };

      new BosonProtocolXmtpPlugin(customOptions);

      const serviceCall = vi.mocked(BosonXmtpPluginService).mock.calls[0];
      expect(serviceCall[0]).toBeDefined(); // MCP client instance
      expect(serviceCall[1]).toBe(customOptions.privateKey);
    });

    it("should create a new MCP client instance for each plugin instance", () => {
      const plugin1 = new BosonProtocolXmtpPlugin(mockStdioOptions);
      const plugin2 = new BosonProtocolXmtpPlugin(mockHttpOptions);

      expect(BosonXmtpMCPClientStdio).toHaveBeenCalledTimes(1);
      expect(BosonXmtpMCPClientHttp).toHaveBeenCalledTimes(1);

      // Verify they have different service instances
      expect(plugin1.tools[0]).not.toBe(plugin2.tools[0]);
    });
  });

  describe("error handling", () => {
    it("should handle invalid options gracefully", () => {
      // Test with missing client type options
      expect(() => {
        new BosonProtocolXmtpPlugin({
          privateKey:
            "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        } as any);
      }).toThrow("Invalid options in BosonProtocolXmtpPlugin constructor");
    });

    it("should handle stdio client creation failures", () => {
      vi.mocked(BosonXmtpMCPClientStdio).mockImplementationOnce(() => {
        throw new Error("Stdio client creation failed");
      });

      expect(() => {
        new BosonProtocolXmtpPlugin(mockStdioOptions);
      }).toThrow("Stdio client creation failed");
    });

    it("should handle http client creation failures", () => {
      vi.mocked(BosonXmtpMCPClientHttp).mockImplementationOnce(() => {
        throw new Error("HTTP client creation failed");
      });

      expect(() => {
        new BosonProtocolXmtpPlugin(mockHttpOptions);
      }).toThrow("HTTP client creation failed");
    });

    it("should handle service creation failures", () => {
      vi.mocked(BosonXmtpPluginService).mockImplementationOnce(() => {
        throw new Error("Service creation failed");
      });

      expect(() => {
        new BosonProtocolXmtpPlugin(mockStdioOptions);
      }).toThrow("Service creation failed");
    });
  });
});

describe("bosonProtocolXmtpPlugin factory function", () => {
  let mockStdioOptions: BosonProtocolXmtpOptions;
  let mockHttpOptions: BosonProtocolXmtpOptions;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset the mock implementation to ensure consistent behavior
    vi.mocked(BosonXmtpPluginService).mockImplementation(
      (client, privateKey) => ({
        client,
        privateKey,
        mockService: true,
      }),
    );

    mockStdioOptions = {
      privateKey:
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      stdio: true,
    };
    mockHttpOptions = {
      privateKey:
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      http: true,
      url: "http://localhost:3000",
    };
  });

  it("should create and return BosonProtocolXmtpPlugin instance with stdio", () => {
    const plugin = bosonProtocolXmtpPlugin(mockStdioOptions);

    expect(plugin).toBeInstanceOf(BosonProtocolXmtpPlugin);
    expect(plugin.name).toBe("boson-protocol-xmtp");
  });

  it("should create and return BosonProtocolXmtpPlugin instance with http", () => {
    const plugin = bosonProtocolXmtpPlugin(mockHttpOptions);

    expect(plugin).toBeInstanceOf(BosonProtocolXmtpPlugin);
    expect(plugin.name).toBe("boson-protocol-xmtp");
  });

  it("should pass stdio options correctly to constructor", () => {
    const customOptions = {
      privateKey:
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
      stdio: true as const,
    };

    bosonProtocolXmtpPlugin(customOptions);

    expect(BosonXmtpPluginService).toHaveBeenCalledWith(
      expect.any(Object),
      customOptions.privateKey,
    );
  });

  it("should pass http options correctly to constructor", () => {
    const customOptions = {
      privateKey:
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
      http: true as const,
      url: "http://localhost:5000",
    };

    bosonProtocolXmtpPlugin(customOptions);

    expect(BosonXmtpPluginService).toHaveBeenCalledWith(
      expect.any(Object),
      customOptions.privateKey,
    );
    expect(BosonXmtpMCPClientHttp).toHaveBeenCalledWith(customOptions.url);
  });

  it("should create independent plugin instances", () => {
    const plugin1 = bosonProtocolXmtpPlugin(mockStdioOptions);
    const plugin2 = bosonProtocolXmtpPlugin(mockHttpOptions);

    expect(plugin1).not.toBe(plugin2);
    expect(plugin1.tools[0]).not.toBe(plugin2.tools[0]);
  });

  it("should work with different option configurations", () => {
    const optionVariants = [
      {
        privateKey:
          "0x1111111111111111111111111111111111111111111111111111111111111111",
        stdio: true as const,
      },
      {
        privateKey:
          "0x2222222222222222222222222222222222222222222222222222222222222222",
        http: true as const,
        url: "http://localhost:3001",
      },
      {
        privateKey:
          "0x3333333333333333333333333333333333333333333333333333333333333333",
        stdio: true as const,
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
  let mockStdioOptions: BosonProtocolXmtpOptions;
  let mockHttpOptions: BosonProtocolXmtpOptions;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset the mock implementation to ensure consistent behavior
    vi.mocked(BosonXmtpPluginService).mockImplementation(
      (client, privateKey) => ({
        client,
        privateKey,
        mockService: true,
      }),
    );

    mockStdioOptions = {
      privateKey:
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      stdio: true,
    };
    mockHttpOptions = {
      privateKey:
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      http: true,
      url: "http://localhost:3000",
    };
  });

  it("should create a fully functional plugin instance with stdio", () => {
    const plugin = new BosonProtocolXmtpPlugin(mockStdioOptions);

    // Verify plugin structure
    expect(plugin.name).toBe("boson-protocol-xmtp");
    expect(plugin.tools).toHaveLength(1);
    expect(typeof plugin.supportsChain).toBe("function");

    // Verify chain support works
    expect(plugin.supportsChain({ type: "evm", id: 1 })).toBe(true);
    expect(plugin.supportsChain({ type: "bitcoin", id: 1 } as any)).toBe(false);

    // Verify service integration
    expect(BosonXmtpMCPClientStdio).toHaveBeenCalled();
    expect(BosonXmtpPluginService).toHaveBeenCalledWith(
      expect.any(Object),
      mockStdioOptions.privateKey,
    );
  });

  it("should create a fully functional plugin instance with http", () => {
    const plugin = new BosonProtocolXmtpPlugin(mockHttpOptions);

    // Verify plugin structure
    expect(plugin.name).toBe("boson-protocol-xmtp");
    expect(plugin.tools).toHaveLength(1);
    expect(typeof plugin.supportsChain).toBe("function");

    // Verify chain support works
    expect(plugin.supportsChain({ type: "evm", id: 1 })).toBe(true);
    expect(plugin.supportsChain({ type: "bitcoin", id: 1 } as any)).toBe(false);

    // Verify service integration
    expect(BosonXmtpMCPClientHttp).toHaveBeenCalledWith(mockHttpOptions.url);
    expect(BosonXmtpPluginService).toHaveBeenCalledWith(
      expect.any(Object),
      mockHttpOptions.privateKey,
    );
  });

  it("should work end-to-end with factory function", () => {
    const plugin = bosonProtocolXmtpPlugin(mockStdioOptions);

    // Test the complete plugin functionality
    expect(plugin.name).toBe("boson-protocol-xmtp");
    expect(plugin.supportsChain({ type: "evm", id: 137 })).toBe(true);
    expect(plugin.supportsChain({ type: "evm", id: 999 })).toBe(false);
    expect(plugin.tools).toHaveLength(1);
  });

  it("should maintain separation between plugin instances", () => {
    const options1 = { privateKey: "0x1111", stdio: true as const };
    const options2 = {
      privateKey: "0x2222",
      http: true as const,
      url: "http://localhost:3000",
    };

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
