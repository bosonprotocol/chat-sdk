/* eslint-disable @typescript-eslint/no-explicit-any */

import { randomUUID } from "node:crypto";

import type { ConfigId } from "@bosonprotocol/common";
import type { XmtpEnv } from "@xmtp/node-sdk";
import { ethers } from "ethers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { XmtpMCPServer } from "./server.js";

// Mock all external dependencies
vi.mock("node:crypto", () => ({
  randomUUID: vi.fn(),
}));

vi.mock("@bosonprotocol/common", () => ({
  getConfigFromConfigId: vi.fn(),
}));

vi.mock("@modelcontextprotocol/sdk/server/mcp.js", () => ({
  McpServer: vi.fn(),
}));

vi.mock("@modelcontextprotocol/sdk/server/stdio.js", () => ({
  StdioServerTransport: vi.fn(),
}));

vi.mock("@modelcontextprotocol/sdk/server/streamableHttp.js", () => ({
  StreamableHTTPServerTransport: vi.fn(),
}));

vi.mock("@modelcontextprotocol/sdk/types.js", () => ({
  isInitializeRequest: vi.fn(),
}));

vi.mock("ethers", () => ({
  ethers: {
    providers: {
      JsonRpcProvider: vi.fn(),
    },
    Wallet: vi.fn(),
  },
}));

vi.mock("../../common/const.js", () => ({
  supportedXmtpEnvs: ["production", "staging", "local"],
}));

vi.mock("../../node/index.js", () => ({
  BosonXmtpNodeClient: {
    initialise: vi.fn(),
    revokeInstallations: vi.fn(),
  },
}));

vi.mock("./configLoader.js", () => ({
  loadConfigEnv: vi.fn(),
  parseArgs: vi.fn(),
}));

vi.mock("./handlers.js", () => ({
  createGetThreadHandler: vi.fn(),
  createGetThreadsHandler: vi.fn(),
  createInitializeClientHandler: vi.fn(),
  createSendMessageHandler: vi.fn(),
  revokeAllOtherInstallationsHandler: vi.fn(),
  revokeInstallationsHandler: vi.fn(),
}));

vi.mock("./logger.js", () => ({
  log: vi.fn(),
}));

vi.mock("./validation.js", () => ({
  getThreadsValidation: { shape: {}, parse: vi.fn() },
  getThreadValidation: { shape: {}, parse: vi.fn() },
  initializeClientValidation: { shape: {}, parse: vi.fn() },
  revokeAllOtherInstallationsValidation: { shape: {}, parse: vi.fn() },
  revokeInstallationsValidation: { shape: {}, parse: vi.fn() },
  sendMessageValidation: { shape: {}, parse: vi.fn() },
  xmtpEnvironmentsValidation: { shape: {} },
  privateKeyValidation: {
    safeParse: vi.fn(() => ({
      success: true,
      data: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    })),
  },
}));

// Import mocked dependencies
import { getConfigFromConfigId } from "@bosonprotocol/common";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { BosonXmtpNodeClient } from "../../node/index.js";
import { loadConfigEnv, parseArgs } from "./configLoader.js";
import * as handlers from "./handlers.js";
import * as validation from "./validation.js";

describe("XmtpMCPServer", () => {
  let server: XmtpMCPServer;
  let mockMcpServer: any;
  let mockWallet: any;
  let mockProvider: any;
  let mockClient: any;
  let mockTransport: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock ethers components
    mockProvider = {
      getNetwork: vi.fn().mockResolvedValue({ chainId: 1 }),
    };
    mockWallet = {
      getAddress: vi
        .fn()
        .mockResolvedValue("0x1234567890123456789012345678901234567890"),
      address: "0x1234567890123456789012345678901234567890",
    };

    vi.mocked(ethers.providers.JsonRpcProvider).mockReturnValue(mockProvider);
    vi.mocked(ethers.Wallet).mockReturnValue(mockWallet);

    // Clear the client cache before each test
    server = new XmtpMCPServer();
    (server as any).clients.clear();

    // Mock BosonXmtpNodeClient
    mockClient = {
      inboxId: "inbox_123",
      sendMessage: vi.fn(),
      getThreads: vi.fn(),
    };
    vi.mocked(BosonXmtpNodeClient.initialise).mockResolvedValue(mockClient);

    // Mock MCP Server
    mockMcpServer = {
      tool: vi.fn(),
      connect: vi.fn(),
      close: vi.fn(),
    };
    vi.mocked(McpServer).mockReturnValue(mockMcpServer);

    // Mock transport
    mockTransport = {
      handleRequest: vi.fn(),
      onclose: null,
      sessionId: "session_123",
    };
    vi.mocked(StdioServerTransport).mockReturnValue(mockTransport);
    vi.mocked(StreamableHTTPServerTransport).mockReturnValue(mockTransport);

    // Mock config
    vi.mocked(getConfigFromConfigId).mockReturnValue({
      envName: "staging",
      contracts: { protocolDiamond: "0xprotocol123" },
    });

    // Mock handlers
    Object.values(handlers).forEach((handler) => {
      if (typeof handler === "function") {
        vi.mocked(handler).mockReturnValue(
          vi.fn().mockResolvedValue('{"success":true}'),
        );
      }
    });

    // Mock validation - ensure all validators have proper mock implementations
    const validationMocks = {
      getThreadsValidation: { shape: {}, parse: vi.fn((args) => args) },
      getThreadValidation: { shape: {}, parse: vi.fn((args) => args) },
      initializeClientValidation: { shape: {}, parse: vi.fn((args) => args) },
      revokeAllOtherInstallationsValidation: {
        shape: {},
        parse: vi.fn((args) => args),
      },
      revokeInstallationsValidation: {
        shape: {},
        parse: vi.fn((args) => args),
      },
      sendMessageValidation: { shape: {}, parse: vi.fn((args) => args) },
      xmtpEnvironmentsValidation: { shape: {} },
      privateKeyValidation: {
        safeParse: vi.fn(() => ({
          success: true,
          data: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        })),
      },
    };

    Object.entries(validationMocks).forEach(([key, mock]) => {
      if (validation[key as keyof typeof validation]) {
        Object.assign(validation[key as keyof typeof validation], mock);
      }
    });

    // Mock randomUUID
    vi.mocked(randomUUID).mockReturnValue("uuid-123");

    server = new XmtpMCPServer();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should create server instance with empty client map", () => {
      expect(server).toBeInstanceOf(XmtpMCPServer);
      expect((server as any).clients).toBeInstanceOf(Map);
      expect((server as any).clients.size).toBe(0);
    });
  });

  describe("getClientKey", () => {
    it("should create unique client key from parameters", () => {
      const envName = "staging-0xprotocol123" as any;
      const xmtpEnvName = "production" as XmtpEnv;

      const key = (server as any).getClientKey(envName, xmtpEnvName);
      expect(key).toBe(`${envName}-${xmtpEnvName}`);
    });

    it("should create different keys for different parameters", () => {
      const key1 = (server as any).getClientKey("env1", "production");
      const key2 = (server as any).getClientKey("env2", "production");
      const key3 = (server as any).getClientKey("env1", "staging");

      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key2).not.toBe(key3);
    });
  });

  describe("getOrCreateClient", () => {
    it("should create new client when not cached", async () => {
      const envName = "staging-0xprotocol123" as any;
      const xmtpEnvName = "production" as XmtpEnv;

      const client = await (server as any).getOrCreateClient(
        envName,
        xmtpEnvName,
      );

      // The wallet is built once from the env secret, not from a tool argument.
      expect(BosonXmtpNodeClient.initialise).toHaveBeenCalledWith(
        mockWallet,
        xmtpEnvName,
        envName,
      );
      expect(client).toBe(mockClient);
      expect((server as any).clients.size).toBe(1);
    });

    it("should return cached client when available", async () => {
      const envName = "staging-0xprotocol123" as any;
      const xmtpEnvName = "production" as XmtpEnv;

      // First call - creates client
      const client1 = await (server as any).getOrCreateClient(
        envName,
        xmtpEnvName,
      );

      // Second call - should return cached client
      const client2 = await (server as any).getOrCreateClient(
        envName,
        xmtpEnvName,
      );

      expect(BosonXmtpNodeClient.initialise).toHaveBeenCalledTimes(1);
      expect(client1).toBe(client2);
      expect((server as any).clients.size).toBe(1);
    });

    it("should create separate clients for different env/xmtp parameters", async () => {
      const mockClient2 = { inboxId: "inbox_456" };

      vi.mocked(BosonXmtpNodeClient.initialise).mockClear();
      vi.mocked(BosonXmtpNodeClient.initialise)
        .mockResolvedValueOnce(mockClient)
        .mockResolvedValueOnce(mockClient2);

      const client1 = await (server as any).getOrCreateClient(
        "staging-0xprotocol123",
        "production" as XmtpEnv,
      );
      const client2 = await (server as any).getOrCreateClient(
        "production-0xprotocol999",
        "dev" as XmtpEnv,
      );

      expect(BosonXmtpNodeClient.initialise).toHaveBeenCalledTimes(2);
      expect(client1).not.toBe(client2);
      expect((server as any).clients.size).toBe(2);
    });
  });

  describe("createHandler", () => {
    it("should create handler requiring client", async () => {
      const mockHandlerFactory = vi
        .fn()
        .mockReturnValue(vi.fn().mockResolvedValue("success"));
      const args = {
        configId: "staging-80002-0x123" as ConfigId,
        xmtpEnvName: "production" as XmtpEnv,
      };

      const handler = (server as any).createHandler(mockHandlerFactory, {
        requiresClient: true,
        requiresSigner: false,
      });

      const result = await handler(args);

      expect(getConfigFromConfigId).toHaveBeenCalledWith(args.configId);
      expect(mockHandlerFactory).toHaveBeenCalledWith(expect.any(Function));
      expect(result).toBe("success");
    });

    it("should create handler requiring signer using the shared wallet", async () => {
      const mockHandlerFactory = vi
        .fn()
        .mockReturnValue(vi.fn().mockResolvedValue("success"));
      const args = {};

      const handler = (server as any).createHandler(mockHandlerFactory, {
        requiresClient: false,
        requiresSigner: true,
      });

      const result = await handler(args);

      // The signer is the shared wallet built from the env secret, not from args.
      expect(mockHandlerFactory).toHaveBeenCalledWith(
        undefined,
        expect.any(Function),
      );
      const signerGetter = mockHandlerFactory.mock.calls[0][1];
      expect(signerGetter()).toBe(mockWallet);
      expect(result).toBe("success");
    });

    it("should throw error when client is required but parameters missing", async () => {
      const mockHandlerFactory = vi.fn();
      const args = {}; // missing configId and xmtpEnvName

      const handler = (server as any).createHandler(mockHandlerFactory, {
        requiresClient: true,
        requiresSigner: false,
      });

      await expect(handler(args)).rejects.toThrow(
        "configId (undefined) and xmtpEnvName (undefined) are required",
      );
    });

    it("should throw when the wallet secret is missing or invalid", () => {
      vi.mocked(validation.privateKeyValidation.safeParse).mockReturnValueOnce({
        success: false,
      } as any);

      const freshServer = new XmtpMCPServer();

      expect(() => (freshServer as any).getSharedWallet()).toThrow(
        "BOSON_XMTP_PRIVATE_KEY environment variable is missing or is not a valid 32-byte hex private key",
      );
    });

    it("should throw error when neither client nor signer required", async () => {
      const mockHandlerFactory = vi.fn();
      const handler = (server as any).createHandler(mockHandlerFactory, {
        requiresClient: false,
        requiresSigner: false,
      });

      await expect(handler({})).rejects.toThrow(
        "Handler must require either client or signer",
      );
    });
  });

  describe("createToolHandler", () => {
    it("should wrap handler result in MCP response format", async () => {
      const mockHandlerFactory = vi
        .fn()
        .mockReturnValue(vi.fn().mockResolvedValue('{"success":true}'));
      const args = {
        privateKey: "0xprivatekey123",
        configId: "staging-80002-0x123" as ConfigId,
        xmtpEnvName: "production" as XmtpEnv,
      };

      const toolHandler = (server as any).createToolHandler(
        mockHandlerFactory,
        {
          requiresClient: true,
          requiresSigner: false,
        },
      );

      const result = await toolHandler(args);

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: '{"success":true}',
          },
        ],
      });
    });
  });

  describe("createServerInstance", () => {
    it("should create MCP server with correct configuration", () => {
      const serverInstance = (server as any).createServerInstance();

      expect(McpServer).toHaveBeenCalledWith(
        {
          name: "xmtp-boson-server",
          version: "1.0.0",
        },
        {
          capabilities: {
            tools: {},
            resources: {},
            completions: {},
          },
        },
      );
      expect(serverInstance).toBe(mockMcpServer);
    });

    it("should set up tool handlers", () => {
      (server as any).createServerInstance();

      // Verify all tools are registered
      expect(mockMcpServer.tool).toHaveBeenCalledWith(
        "get_xmtp_environments",
        "Get the list of supported XMTP environments",
        validation.xmtpEnvironmentsValidation.shape,
        expect.any(Function),
      );

      expect(mockMcpServer.tool).toHaveBeenCalledWith(
        "initialize_xmtp_client",
        "Initialize an XMTP client for a specific signer and environment",
        validation.initializeClientValidation.shape,
        expect.any(Function),
      );

      // Should be called 7 times for all tools
      expect(mockMcpServer.tool).toHaveBeenCalledTimes(7);
    });
  });

  describe("setupErrorHandling", () => {
    let originalProcessOn: any;
    let processOnSpy: any;

    beforeEach(() => {
      originalProcessOn = process.on;
      processOnSpy = vi.fn();
      process.on = processOnSpy;
    });

    afterEach(() => {
      process.on = originalProcessOn;
    });

    it("should set up SIGINT handler", () => {
      (server as any).setupErrorHandling(mockMcpServer);

      expect(processOnSpy).toHaveBeenCalledWith("SIGINT", expect.any(Function));
    });
  });

  describe("run", () => {
    beforeEach(() => {
      vi.mocked(parseArgs).mockReturnValue({
        config: "test-config",
        server: "test-server",
        http: false,
      });

      // Mock process.env to avoid HTTP mode
      delete process.env.MCP_TRANSPORT;
    });

    it("should start stdio server by default", async () => {
      const startStdioSpy = vi
        .spyOn(server as any, "startStdio")
        .mockResolvedValue(undefined);

      await server.run();

      expect(loadConfigEnv).toHaveBeenCalledWith("test-config", "test-server");
      expect(startStdioSpy).toHaveBeenCalled();
    });

    it("should start HTTP server when http flag is true", async () => {
      vi.mocked(parseArgs).mockReturnValue({
        config: "test-config",
        server: "test-server",
        http: true,
      });

      const startHttpSpy = vi
        .spyOn(server as any, "startHttp")
        .mockResolvedValue(undefined);

      await server.run();

      expect(startHttpSpy).toHaveBeenCalled();
    });

    it("should start HTTP server when environment variable is set", async () => {
      process.env.MCP_TRANSPORT = "http";

      const startHttpSpy = vi
        .spyOn(server as any, "startHttp")
        .mockResolvedValue(undefined);

      await server.run();

      expect(startHttpSpy).toHaveBeenCalled();

      // Clean up
      delete process.env.MCP_TRANSPORT;
    });
  });

  describe("tool handlers integration", () => {
    beforeEach(() => {
      (server as any).createServerInstance();
    });

    it("should handle get_xmtp_environments tool", () => {
      const toolCall = mockMcpServer.tool.mock.calls.find(
        (call) => call[0] === "get_xmtp_environments",
      );
      const handler = toolCall?.[3];

      expect(handler).toBeDefined();
      const result = handler();

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              data: { environments: ["production", "staging", "local"] },
            }),
          },
        ],
      });
    });

    it("should handle initialize_xmtp_client tool", async () => {
      const toolCall = mockMcpServer.tool.mock.calls.find(
        (call) => call[0] === "initialize_xmtp_client",
      );
      const handler = toolCall?.[3];
      const args = {
        privateKey: "0xprivatekey123",
        configId: "staging-80002-0x123",
        xmtpEnvName: "production",
      };

      expect(handler).toBeDefined();

      const result = await handler(args);

      expect(validation.initializeClientValidation.parse).toHaveBeenCalledWith(
        args,
      );
      expect(result).toHaveProperty("content");
      expect(result.content[0]).toHaveProperty("type", "text");
    });

    it("should validate arguments for each tool", async () => {
      const toolValidationMap = {
        initialize_xmtp_client: "initializeClientValidation",
        revoke_all_other_installations: "revokeAllOtherInstallationsValidation",
        revoke_installations: "revokeInstallationsValidation",
        get_xmtp_threads: "getThreadsValidation",
        get_xmtp_thread: "getThreadValidation",
        send_xmtp_message: "sendMessageValidation",
      };

      for (const [toolName, validationKey] of Object.entries(
        toolValidationMap,
      )) {
        const toolCall = mockMcpServer.tool.mock.calls.find(
          (call) => call[0] === toolName,
        );
        expect(toolCall).toBeDefined();

        const handler = toolCall?.[3];
        // Use proper args structure that matches expected validation
        const mockArgs = {
          privateKey: "0xtest123",
          configId: "staging-80002-0x123" as ConfigId,
          xmtpEnvName: "production" as XmtpEnv,
          test: "args",
        };

        const validationObj = (validation as any)[validationKey];
        expect(validationObj).toBeDefined();
        expect(validationObj.parse).toBeDefined();

        if (handler && validationObj?.parse) {
          await handler(mockArgs);
          expect(validationObj.parse).toHaveBeenCalledWith(mockArgs);
        }
      }
    });
  });

  describe("client management", () => {
    it("should maintain separate clients for different configurations", async () => {
      const mockClient2 = { inboxId: "inbox_456" };

      vi.mocked(BosonXmtpNodeClient.initialise).mockClear();
      vi.mocked(BosonXmtpNodeClient.initialise)
        .mockResolvedValueOnce(mockClient)
        .mockResolvedValueOnce(mockClient2);

      const client1 = await (server as any).getOrCreateClient(
        "staging-0xprotocol123",
        "production" as XmtpEnv,
      );

      const client2 = await (server as any).getOrCreateClient(
        "production-0xprotocol999",
        "production" as XmtpEnv,
      );

      expect(client1).not.toBe(client2);
      expect((server as any).clients.size).toBe(2);
    });

    it("should reuse clients with same configuration", async () => {
      const envName = "staging-0xprotocol123" as any;
      const xmtpEnvName = "production" as XmtpEnv;

      const client1 = await (server as any).getOrCreateClient(
        envName,
        xmtpEnvName,
      );

      const client2 = await (server as any).getOrCreateClient(
        envName,
        xmtpEnvName,
      );

      expect(client1).toBe(client2);
      expect((server as any).clients.size).toBe(1);
      expect(BosonXmtpNodeClient.initialise).toHaveBeenCalledTimes(1);
    });
  });

  describe("error handling", () => {
    let freshServer: XmtpMCPServer;

    beforeEach(() => {
      // Create completely fresh server for error handling tests
      freshServer = new XmtpMCPServer();
    });

    it("should handle client creation errors", async () => {
      const error = new Error("Client initialization failed");

      const args = {
        privateKey: "0xprivatekey123",
        configId: "staging-80002-0x123" as ConfigId,
        xmtpEnvName: "production" as XmtpEnv,
      };

      const handler = (freshServer as any).createHandler(
        () => vi.fn().mockRejectedValueOnce(error),
        {
          requiresClient: true,
          requiresSigner: false,
        },
      );

      await expect(handler(args)).rejects.toThrow(
        "Client initialization failed",
      );
    });

    it("should handle wallet creation errors", () => {
      const error = new Error("Invalid private key");
      vi.mocked(ethers.Wallet).mockImplementation(() => {
        throw error;
      });

      const freshServer = new XmtpMCPServer();

      expect(() => (freshServer as any).getSharedWallet()).toThrow(
        "Invalid private key",
      );
    });
  });

  describe("configuration handling", () => {
    it("should properly parse config ID and create environment name", async () => {
      const configId = "production-1-0xabc123" as ConfigId;
      const args = {
        privateKey: "0xkey",
        configId,
        xmtpEnvName: "production" as XmtpEnv,
      };

      // Clear the clients cache to ensure fresh state
      (server as any).clients.clear();

      vi.mocked(getConfigFromConfigId).mockReturnValue({
        envName: "production",
        contracts: { protocolDiamond: "0xabc123" },
      });

      const handler = (server as any).createHandler(
        vi.fn().mockReturnValue(vi.fn().mockResolvedValue("success")),
        { requiresClient: true, requiresSigner: false },
      );

      await handler(args);

      expect(getConfigFromConfigId).toHaveBeenCalledWith(configId);
    });

    it("should handle different config formats", async () => {
      const testConfigs = [
        {
          configId: "staging-80002-0x123" as ConfigId,
          expected: {
            envName: "staging",
            contracts: { protocolDiamond: "0x123" },
          },
        },
        {
          configId: "production-1-0xabc" as ConfigId,
          expected: {
            envName: "production",
            contracts: { protocolDiamond: "0xabc" },
          },
        },
      ];

      for (const testConfig of testConfigs) {
        vi.mocked(getConfigFromConfigId).mockReturnValue(testConfig.expected);

        const args = {
          privateKey: "0xkey",
          configId: testConfig.configId,
          xmtpEnvName: "production" as XmtpEnv,
        };

        const handler = (server as any).createHandler(
          vi.fn().mockReturnValue(vi.fn().mockResolvedValue("success")),
          { requiresClient: true, requiresSigner: false },
        );

        await handler(args);

        expect(getConfigFromConfigId).toHaveBeenCalledWith(testConfig.configId);
      }
    });
  });
});
