import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { randomUUID } from "node:crypto";
import type { ConfigId } from "@bosonprotocol/common";
import { ethers } from "ethers";
import type { XmtpEnv } from "@xmtp/node-sdk";
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
}));

// Import mocked dependencies
import { getConfigFromConfigId } from "@bosonprotocol/common";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { BosonXmtpNodeClient } from "../../node/index.js";
import { loadConfigEnv, parseArgs } from "./configLoader.js";
import * as handlers from "./handlers.js";
import { log } from "./logger.js";
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
      const signerAddress = "0x1234567890123456789012345678901234567890";
      const envName = "staging-0xprotocol123" as any;
      const xmtpEnvName = "production" as XmtpEnv;

      const key = (server as any).getClientKey(
        signerAddress,
        envName,
        xmtpEnvName,
      );
      expect(key).toBe(`${signerAddress}-${envName}-${xmtpEnvName}`);
    });

    it("should create different keys for different parameters", () => {
      const key1 = (server as any).getClientKey("0xaaa", "env1", "production");
      const key2 = (server as any).getClientKey("0xbbb", "env1", "production");
      const key3 = (server as any).getClientKey("0xaaa", "env2", "production");
      const key4 = (server as any).getClientKey("0xaaa", "env1", "staging");

      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key1).not.toBe(key4);
      expect(key2).not.toBe(key3);
    });
  });

  describe("getOrCreateClient", () => {
    it("should create new client when not cached", async () => {
      const privateKey = "0xprivatekey123";
      const envName = "staging-0xprotocol123" as any;
      const xmtpEnvName = "production" as XmtpEnv;

      const client = await (server as any).getOrCreateClient(
        privateKey,
        envName,
        xmtpEnvName,
      );

      expect(ethers.Wallet).toHaveBeenCalledWith(privateKey, mockProvider);
      expect(BosonXmtpNodeClient.initialise).toHaveBeenCalledWith(
        mockWallet,
        xmtpEnvName,
        envName,
      );
      expect(client).toBe(mockClient);
      expect((server as any).clients.size).toBe(1);
    });

    it("should return cached client when available", async () => {
      const privateKey = "0xprivatekey123";
      const envName = "staging-0xprotocol123" as any;
      const xmtpEnvName = "production" as XmtpEnv;

      // First call - creates client
      const client1 = await (server as any).getOrCreateClient(
        privateKey,
        envName,
        xmtpEnvName,
      );

      // Second call - should return cached client
      const client2 = await (server as any).getOrCreateClient(
        privateKey,
        envName,
        xmtpEnvName,
      );

      expect(BosonXmtpNodeClient.initialise).toHaveBeenCalledTimes(1);
      expect(client1).toBe(client2);
      expect((server as any).clients.size).toBe(1);
    });

    it("should create separate clients for different parameters", async () => {
      const privateKey1 = "0xprivatekey123";
      const privateKey2 = "0xprivatekey456";
      const envName = "staging-0xprotocol123" as any;
      const xmtpEnvName = "production" as XmtpEnv;

      // Create different mock wallets with different addresses
      const mockWallet1 = {
        getAddress: vi
          .fn()
          .mockResolvedValue("0x1111111111111111111111111111111111111111"),
        address: "0x1111111111111111111111111111111111111111",
      };

      const mockWallet2 = {
        getAddress: vi
          .fn()
          .mockResolvedValue("0x2222222222222222222222222222222222222222"),
        address: "0x2222222222222222222222222222222222222222",
      };

      const mockClient2 = { inboxId: "inbox_456" };

      // Mock ethers.Wallet to return different wallet instances for different private keys
      vi.mocked(ethers.Wallet).mockClear();
      vi.mocked(ethers.Wallet)
        .mockImplementationOnce((privateKey) => {
          if (privateKey === privateKey1) return mockWallet1;
          return mockWallet1;
        })
        .mockImplementationOnce((privateKey) => {
          if (privateKey === privateKey2) return mockWallet2;
          return mockWallet2;
        });

      // Reset the mock to ensure clean state
      vi.mocked(BosonXmtpNodeClient.initialise).mockClear();
      vi.mocked(BosonXmtpNodeClient.initialise)
        .mockResolvedValueOnce(mockClient)
        .mockResolvedValueOnce(mockClient2);

      const client1 = await (server as any).getOrCreateClient(
        privateKey1,
        envName,
        xmtpEnvName,
      );
      const client2 = await (server as any).getOrCreateClient(
        privateKey2,
        envName,
        xmtpEnvName,
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
        privateKey: "0xprivatekey123",
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

    it("should create handler requiring signer", async () => {
      const mockHandlerFactory = vi
        .fn()
        .mockReturnValue(vi.fn().mockResolvedValue("success"));
      const args = {
        privateKey: "0xprivatekey123",
      };

      const handler = (server as any).createHandler(mockHandlerFactory, {
        requiresClient: false,
        requiresSigner: true,
      });

      const result = await handler(args);

      expect(ethers.Wallet).toHaveBeenCalledWith(args.privateKey, mockProvider);
      expect(mockHandlerFactory).toHaveBeenCalledWith(
        undefined,
        expect.any(Function),
      );
      expect(result).toBe("success");
    });

    it("should throw error when client is required but parameters missing", async () => {
      const mockHandlerFactory = vi.fn();
      const args = { privateKey: "0xkey123" }; // missing configId and xmtpEnvName

      const handler = (server as any).createHandler(mockHandlerFactory, {
        requiresClient: true,
        requiresSigner: false,
      });

      await expect(handler(args)).rejects.toThrow(
        "privateKey, configId (undefined), and xmtpEnvName (undefined) are required",
      );
    });

    it("should throw error when signer is required but privateKey missing", async () => {
      const mockHandlerFactory = vi.fn();
      const args = {}; // missing privateKey

      const handler = (server as any).createHandler(mockHandlerFactory, {
        requiresClient: false,
        requiresSigner: true,
      });

      await expect(handler(args)).rejects.toThrow("privateKey is required");
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
              environments: ["production", "staging", "local"],
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
      const config1 = {
        privateKey: "0xkey1",
        configId: "staging-80002-0x123" as ConfigId,
        xmtpEnvName: "production" as XmtpEnv,
      };

      const config2 = {
        privateKey: "0xkey2",
        configId: "staging-80002-0x123" as ConfigId,
        xmtpEnvName: "production" as XmtpEnv,
      };

      // Create different mock wallets with different addresses
      const mockWallet1 = {
        getAddress: vi
          .fn()
          .mockResolvedValue("0x1111111111111111111111111111111111111111"),
        address: "0x1111111111111111111111111111111111111111",
      };

      const mockWallet2 = {
        getAddress: vi
          .fn()
          .mockResolvedValue("0x2222222222222222222222222222222222222222"),
        address: "0x2222222222222222222222222222222222222222",
      };

      const mockClient2 = { inboxId: "inbox_456" };

      // Mock ethers.Wallet to return different wallet instances
      vi.mocked(ethers.Wallet).mockClear();
      vi.mocked(ethers.Wallet)
        .mockReturnValueOnce(mockWallet1)
        .mockReturnValueOnce(mockWallet2);

      // Reset the mock to ensure clean state and set up proper responses
      vi.mocked(BosonXmtpNodeClient.initialise).mockClear();
      vi.mocked(BosonXmtpNodeClient.initialise)
        .mockResolvedValueOnce(mockClient)
        .mockResolvedValueOnce(mockClient2);

      const client1 = await (server as any).getOrCreateClient(
        config1.privateKey,
        "staging-0xprotocol123",
        config1.xmtpEnvName,
      );

      const client2 = await (server as any).getOrCreateClient(
        config2.privateKey,
        "staging-0xprotocol123",
        config2.xmtpEnvName,
      );

      expect(client1).not.toBe(client2);
      expect((server as any).clients.size).toBe(2);
    });

    it("should reuse clients with same configuration", async () => {
      const config = {
        privateKey: "0xkey1",
        envName: "staging-0xprotocol123" as any,
        xmtpEnvName: "production" as XmtpEnv,
      };

      const client1 = await (server as any).getOrCreateClient(
        config.privateKey,
        config.envName,
        config.xmtpEnvName,
      );

      const client2 = await (server as any).getOrCreateClient(
        config.privateKey,
        config.envName,
        config.xmtpEnvName,
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

    it("should handle wallet creation errors", async () => {
      const error = new Error("Invalid private key");
      vi.mocked(ethers.Wallet).mockImplementation(() => {
        throw error;
      });

      const args = { privateKey: "invalid-key" };
      const handler = (server as any).createHandler(() => vi.fn(), {
        requiresClient: false,
        requiresSigner: true,
      });

      await expect(handler(args)).rejects.toThrow("Invalid private key");
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
