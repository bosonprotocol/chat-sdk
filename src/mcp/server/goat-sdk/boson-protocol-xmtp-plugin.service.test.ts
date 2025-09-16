// BosonXmtpPluginService.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  BosonXmtpPluginService,
  type ReturnTypeMcp,
  type XmtpResponse,
} from "./boson-protocol-xmtp-plugin.service.js";
import type { BosonXmtpMCPClient } from "../../client/boson-client.js";
import type { EVMWalletClient } from "@goat-sdk/wallet-evm";

// Mock reflect-metadata
vi.mock("reflect-metadata", () => ({}));

// Mock @goat-sdk/core
vi.mock("@goat-sdk/core", () => ({
  Tool:
    () => (target: any, propertyKey: string, descriptor: PropertyDescriptor) =>
      descriptor,
}));

describe("BosonXmtpPluginService", () => {
  let service: BosonXmtpPluginService;
  let mockMcpClient: BosonXmtpMCPClient;
  let mockWalletClient: EVMWalletClient;
  const mockPrivateKey =
    "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

  // Helper function to create mock MCP response
  const createMockMcpResponse = (
    data?: any,
    success = true,
    message?: string,
    error?: string,
  ): ReturnTypeMcp => {
    const responseData: XmtpResponse = {
      success,
      data,
      message,
      error,
    };

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(responseData),
        },
      ],
    };
  };

  beforeEach(() => {
    // Create mock MCP client
    mockMcpClient = {
      isConnected: false,
      connectToServer: vi.fn().mockResolvedValue(undefined),
      getXmtpEnvironments: vi.fn(),
      initializeXmtpClient: vi.fn(),
      revokeAllOtherInstallations: vi.fn(),
      revokeInstallations: vi.fn(),
      getXmtpThreads: vi.fn(),
      getXmtpThread: vi.fn(),
      sendXmtpMessage: vi.fn(),
      sendStringMessage: vi.fn(),
      sendFileMessage: vi.fn(),
      sendProposalMessage: vi.fn(),
      sendCounterProposalMessage: vi.fn(),
      sendAcceptProposalMessage: vi.fn(),
      sendEscalateDisputeMessage: vi.fn(),
    } as unknown as BosonXmtpMCPClient;

    // Create mock wallet client
    mockWalletClient = {} as EVMWalletClient;

    // Create service instance
    service = new BosonXmtpPluginService(mockMcpClient, mockPrivateKey);

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("connectIfNeeded", () => {
    it("should connect to server when not connected", async () => {
      mockMcpClient.isConnected = false;

      await service.getXmtpEnvironments(mockWalletClient, {});

      expect(mockMcpClient.connectToServer).toHaveBeenCalledWith({});
    });

    it("should not connect when already connected", async () => {
      mockMcpClient.isConnected = true;
      vi.mocked(mockMcpClient.getXmtpEnvironments).mockResolvedValue(
        createMockMcpResponse([]),
      );

      await service.getXmtpEnvironments(mockWalletClient, {});

      expect(mockMcpClient.connectToServer).not.toHaveBeenCalled();
    });
  });

  describe("parseResponse", () => {
    it("should parse valid MCP response correctly", async () => {
      const mockData = { environments: ["production", "staging"] };
      const mockResponse = createMockMcpResponse(mockData, true, "Success");

      vi.mocked(mockMcpClient.getXmtpEnvironments).mockResolvedValue(
        mockResponse,
      );

      const result = await service.getXmtpEnvironments(mockWalletClient, {});

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(result.message).toBe("Success");
    });

    it("should handle MCP response with invalid structure", async () => {
      const invalidResponse = {
        content: [],
      } as ReturnTypeMcp;

      vi.mocked(mockMcpClient.getXmtpEnvironments).mockResolvedValue(
        invalidResponse,
      );

      const result = await service.getXmtpEnvironments(mockWalletClient, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain("No text content found in MCP response");
    });

    it("should handle invalid JSON in MCP response", async () => {
      const invalidJsonResponse = {
        content: [
          {
            type: "text" as const,
            text: "invalid json{",
          },
        ],
      };

      vi.mocked(mockMcpClient.getXmtpEnvironments).mockResolvedValue(
        invalidJsonResponse,
      );

      const result = await service.getXmtpEnvironments(mockWalletClient, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unexpected token");
    });
  });

  describe("getXmtpEnvironments", () => {
    it("should successfully get XMTP environments", async () => {
      const mockEnvironments = ["production", "staging", "local"];
      const mockResponse = createMockMcpResponse(
        mockEnvironments,
        true,
        "Environments retrieved",
      );

      vi.mocked(mockMcpClient.getXmtpEnvironments).mockResolvedValue(
        mockResponse,
      );

      const result = await service.getXmtpEnvironments(mockWalletClient, {});

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEnvironments);
      expect(result.message).toBe("Environments retrieved");
      expect(mockMcpClient.getXmtpEnvironments).toHaveBeenCalledWith({});
    });

    it("should handle errors when getting environments", async () => {
      const error = new Error("Network error");
      vi.mocked(mockMcpClient.getXmtpEnvironments).mockRejectedValue(error);

      const result = await service.getXmtpEnvironments(mockWalletClient, {});

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });
  });

  describe("initializeXmtpClient", () => {
    it("should successfully initialize XMTP client with private key", async () => {
      const parameters = { environment: "production" };
      const mockData = { clientId: "client_123" };
      const mockResponse = createMockMcpResponse(
        mockData,
        true,
        "Client initialized",
      );

      vi.mocked(mockMcpClient.initializeXmtpClient).mockResolvedValue(
        mockResponse,
      );

      const result = await service.initializeXmtpClient(
        mockWalletClient,
        parameters,
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(mockMcpClient.initializeXmtpClient).toHaveBeenCalledWith({
        ...parameters,
        privateKey: mockPrivateKey,
      });
    });

    it("should handle initialization errors", async () => {
      const parameters = { environment: "production" };
      const error = new Error("Invalid private key");
      vi.mocked(mockMcpClient.initializeXmtpClient).mockRejectedValue(error);

      const result = await service.initializeXmtpClient(
        mockWalletClient,
        parameters,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid private key");
    });
  });

  describe("revokeAllOtherInstallations", () => {
    it("should successfully revoke all other installations", async () => {
      const parameters = { clientId: "client_123" };
      const mockData = { revokedCount: 3 };
      const mockResponse = createMockMcpResponse(
        mockData,
        true,
        "Installations revoked",
      );

      vi.mocked(mockMcpClient.revokeAllOtherInstallations).mockResolvedValue(
        mockResponse,
      );

      const result = await service.revokeAllOtherInstallations(
        mockWalletClient,
        parameters,
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(mockMcpClient.revokeAllOtherInstallations).toHaveBeenCalledWith({
        ...parameters,
        privateKey: mockPrivateKey,
      });
    });
  });

  describe("revokeInstallations", () => {
    it("should successfully revoke specific installations", async () => {
      const parameters = { inboxIds: ["inbox1", "inbox2"] };
      const mockData = { revokedIds: ["inbox1", "inbox2"] };
      const mockResponse = createMockMcpResponse(
        mockData,
        true,
        "Specific installations revoked",
      );

      vi.mocked(mockMcpClient.revokeInstallations).mockResolvedValue(
        mockResponse,
      );

      const result = await service.revokeInstallations(
        mockWalletClient,
        parameters,
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(mockMcpClient.revokeInstallations).toHaveBeenCalledWith({
        ...parameters,
        privateKey: mockPrivateKey,
      });
    });
  });

  describe("getXmtpThreads", () => {
    it("should successfully get XMTP threads", async () => {
      const parameters = { limit: 10 };
      const mockThreads = [
        { threadId: "thread1", participantCount: 2 },
        { threadId: "thread2", participantCount: 3 },
      ];
      const mockResponse = createMockMcpResponse(
        mockThreads,
        true,
        "Threads retrieved",
      );

      vi.mocked(mockMcpClient.getXmtpThreads).mockResolvedValue(mockResponse);

      const result = await service.getXmtpThreads(mockWalletClient, parameters);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockThreads);
      expect(mockMcpClient.getXmtpThreads).toHaveBeenCalledWith({
        ...parameters,
        privateKey: mockPrivateKey,
      });
    });
  });

  describe("getXmtpThread", () => {
    it("should successfully get specific XMTP thread", async () => {
      const parameters = { threadId: "thread123" };
      const mockThread = { threadId: "thread123", messages: [] };
      const mockResponse = createMockMcpResponse(
        mockThread,
        true,
        "Thread retrieved",
      );

      vi.mocked(mockMcpClient.getXmtpThread).mockResolvedValue(mockResponse);

      const result = await service.getXmtpThread(mockWalletClient, parameters);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockThread);
      expect(mockMcpClient.getXmtpThread).toHaveBeenCalledWith({
        ...parameters,
        privateKey: mockPrivateKey,
      });
    });
  });

  describe("sendXmtpMessage", () => {
    it("should successfully send XMTP message", async () => {
      const parameters = { recipient: "0xabc123", message: "Hello" };
      const mockData = { messageId: "msg_123", sent: true };
      const mockResponse = createMockMcpResponse(
        mockData,
        true,
        "Message sent",
      );

      vi.mocked(mockMcpClient.sendXmtpMessage).mockResolvedValue(mockResponse);

      const result = await service.sendXmtpMessage(
        mockWalletClient,
        parameters,
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(mockMcpClient.sendXmtpMessage).toHaveBeenCalledWith({
        ...parameters,
        privateKey: mockPrivateKey,
      });
    });
  });

  describe("sendStringMessage", () => {
    it("should successfully send string message", async () => {
      const parameters = { recipient: "0xabc123", content: "Hello world" };
      const mockData = { messageId: "msg_456", sent: true };
      const mockResponse = createMockMcpResponse(
        mockData,
        true,
        "String message sent",
      );

      vi.mocked(mockMcpClient.sendStringMessage).mockResolvedValue(
        mockResponse,
      );

      const result = await service.sendStringMessage(
        mockWalletClient,
        parameters,
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(mockMcpClient.sendStringMessage).toHaveBeenCalledWith({
        ...parameters,
        privateKey: mockPrivateKey,
      });
    });
  });

  describe("sendFileMessage", () => {
    it("should successfully send file message", async () => {
      const parameters = {
        recipient: "0xabc123",
        fileName: "document.pdf",
        fileContent: "base64content",
        mimeType: "application/pdf",
      };
      const mockData = { messageId: "msg_789", sent: true };
      const mockResponse = createMockMcpResponse(
        mockData,
        true,
        "File message sent",
      );

      vi.mocked(mockMcpClient.sendFileMessage).mockResolvedValue(mockResponse);

      const result = await service.sendFileMessage(
        mockWalletClient,
        parameters,
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(mockMcpClient.sendFileMessage).toHaveBeenCalledWith({
        ...parameters,
        privateKey: mockPrivateKey,
      });
    });
  });

  describe("sendProposalMessage", () => {
    it("should successfully send proposal message", async () => {
      const parameters = {
        recipient: "0xabc123",
        proposalData: { type: "refund", amount: "100" },
      };
      const mockData = { messageId: "msg_proposal", sent: true };
      const mockResponse = createMockMcpResponse(
        mockData,
        true,
        "Proposal sent",
      );

      vi.mocked(mockMcpClient.sendProposalMessage).mockResolvedValue(
        mockResponse,
      );

      const result = await service.sendProposalMessage(
        mockWalletClient,
        parameters,
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(mockMcpClient.sendProposalMessage).toHaveBeenCalledWith({
        ...parameters,
        privateKey: mockPrivateKey,
      });
    });
  });

  describe("sendCounterProposalMessage", () => {
    it("should successfully send counter-proposal message", async () => {
      const parameters = {
        recipient: "0xabc123",
        counterProposalData: { type: "partial_refund", amount: "50" },
      };
      const mockData = { messageId: "msg_counter", sent: true };
      const mockResponse = createMockMcpResponse(
        mockData,
        true,
        "Counter-proposal sent",
      );

      vi.mocked(mockMcpClient.sendCounterProposalMessage).mockResolvedValue(
        mockResponse,
      );

      const result = await service.sendCounterProposalMessage(
        mockWalletClient,
        parameters,
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(mockMcpClient.sendCounterProposalMessage).toHaveBeenCalledWith({
        ...parameters,
        privateKey: mockPrivateKey,
      });
    });
  });

  describe("sendAcceptProposalMessage", () => {
    it("should successfully send accept proposal message", async () => {
      const parameters = {
        recipient: "0xabc123",
        proposalId: "proposal_123",
      };
      const mockData = { messageId: "msg_accept", sent: true };
      const mockResponse = createMockMcpResponse(
        mockData,
        true,
        "Proposal accepted",
      );

      vi.mocked(mockMcpClient.sendAcceptProposalMessage).mockResolvedValue(
        mockResponse,
      );

      const result = await service.sendAcceptProposalMessage(
        mockWalletClient,
        parameters,
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(mockMcpClient.sendAcceptProposalMessage).toHaveBeenCalledWith({
        ...parameters,
        privateKey: mockPrivateKey,
      });
    });
  });

  describe("sendEscalateDisputeMessage", () => {
    it("should successfully send escalate dispute message", async () => {
      const parameters = {
        recipient: "0xabc123",
        disputeId: "dispute_456",
      };
      const mockData = { messageId: "msg_escalate", sent: true };
      const mockResponse = createMockMcpResponse(
        mockData,
        true,
        "Dispute escalated",
      );

      vi.mocked(mockMcpClient.sendEscalateDisputeMessage).mockResolvedValue(
        mockResponse,
      );

      const result = await service.sendEscalateDisputeMessage(
        mockWalletClient,
        parameters,
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(mockMcpClient.sendEscalateDisputeMessage).toHaveBeenCalledWith({
        ...parameters,
        privateKey: mockPrivateKey,
      });
    });
  });

  describe("error handling", () => {
    it("should handle non-Error objects", async () => {
      vi.mocked(mockMcpClient.getXmtpEnvironments).mockRejectedValue(
        "String error",
      );

      const result = await service.getXmtpEnvironments(mockWalletClient, {});

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unknown error");
    });

    it("should handle connection failures", async () => {
      mockMcpClient.isConnected = false;
      const connectionError = new Error("Connection failed");
      vi.mocked(mockMcpClient.connectToServer).mockRejectedValue(
        connectionError,
      );

      const result = await service.getXmtpEnvironments(mockWalletClient, {});

      expect(result.success).toBe(false);
      expect(result.error).toBe("Connection failed");
    });

    it("should handle Zod validation errors", async () => {
      const invalidResponse = {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ invalidField: "value" }),
          },
        ],
      };

      vi.mocked(mockMcpClient.getXmtpEnvironments).mockResolvedValue(
        invalidResponse,
      );

      const result = await service.getXmtpEnvironments(mockWalletClient, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain("Required");
    });
  });

  describe("default messages", () => {
    it("should use default success message when none provided", async () => {
      const mockResponse = createMockMcpResponse({ data: "test" }, true);
      vi.mocked(mockMcpClient.getXmtpEnvironments).mockResolvedValue(
        mockResponse,
      );

      const result = await service.getXmtpEnvironments(mockWalletClient, {});

      expect(result.message).toBe("Successfully retrieved XMTP environments");
    });

    it("should preserve custom success messages", async () => {
      const customMessage = "Custom success message";
      const mockResponse = createMockMcpResponse(
        { data: "test" },
        true,
        customMessage,
      );
      vi.mocked(mockMcpClient.getXmtpEnvironments).mockResolvedValue(
        mockResponse,
      );

      const result = await service.getXmtpEnvironments(mockWalletClient, {});

      expect(result.message).toBe(customMessage);
    });
  });

  describe("private key handling", () => {
    it("should include private key in all authenticated methods", async () => {
      const parameters = { someParam: "value" };
      const mockResponse = createMockMcpResponse({}, true);

      // Test a few different methods
      const methods = [
        "initializeXmtpClient",
        "getXmtpThreads",
        "sendStringMessage",
      ] as const;

      for (const method of methods) {
        vi.mocked(mockMcpClient[method]).mockResolvedValue(mockResponse);

        await service[method](mockWalletClient, parameters as any);

        expect(mockMcpClient[method]).toHaveBeenCalledWith({
          ...parameters,
          privateKey: mockPrivateKey,
        });
      }
    });

    it("should not include private key in getXmtpEnvironments", async () => {
      const parameters = {};
      const mockResponse = createMockMcpResponse([], true);

      vi.mocked(mockMcpClient.getXmtpEnvironments).mockResolvedValue(
        mockResponse,
      );

      await service.getXmtpEnvironments(mockWalletClient, parameters);

      expect(mockMcpClient.getXmtpEnvironments).toHaveBeenCalledWith(
        parameters,
      );
      expect(mockMcpClient.getXmtpEnvironments).toHaveBeenCalledWith(
        expect.not.objectContaining({ privateKey: expect.anything() }),
      );
    });
  });

  describe("Tool decorators", () => {
    it("should have correct tool metadata", () => {
      // Since we're mocking the Tool decorator, we can't test the actual metadata
      // But we can verify the methods exist and are callable
      const toolMethods = [
        "getXmtpEnvironments",
        "initializeXmtpClient",
        "revokeAllOtherInstallations",
        "revokeInstallations",
        "getXmtpThreads",
        "getXmtpThread",
        "sendXmtpMessage",
        "sendStringMessage",
        "sendFileMessage",
        "sendProposalMessage",
        "sendCounterProposalMessage",
        "sendAcceptProposalMessage",
        "sendEscalateDisputeMessage",
      ];

      toolMethods.forEach((methodName) => {
        expect(typeof service[methodName as keyof BosonXmtpPluginService]).toBe(
          "function",
        );
      });
    });
  });
});
