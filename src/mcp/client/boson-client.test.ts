import { beforeEach, describe, expect, it, vi } from "vitest";

import { MessageType } from "../../common/util/v0.0.1/definitions.js";
import { BosonXmtpMCPClient } from "./boson-client.js";

// Mock the MCP SDK
vi.mock("@modelcontextprotocol/sdk/client/stdio.js", () => ({
  StdioClientTransport: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
    close: vi.fn(),
  })),
}));

// Mock the base client with connectToServer method
vi.mock("./base-client.js", () => ({
  BaseMCPClient: class MockBaseMCPClient {
    _isConnected: boolean;
    transport: unknown;
    mcp: unknown;

    constructor() {
      this._isConnected = false;
      this.transport = null;
      this.mcp = {
        connect: vi.fn(),
        callTool: vi.fn(),
      };
    }

    // Add the connectToServer method that the tests expect
    async connectToServer(params: any = {}) {
      try {
        await this.mcp.connect(this.transport, params.options);
        this._isConnected = true;
      } catch (error) {
        console.error("Stdio connection failed", error);
        this._isConnected = false;
        throw error;
      }
    }
  },
}));

// Create a concrete test implementation since BosonXmtpMCPClient is abstract
class TestBosonXmtpMCPClient extends BosonXmtpMCPClient {
  // No additional implementation needed for testing the abstract methods
}

describe("BosonXmtpMCPClient", () => {
  let client: TestBosonXmtpMCPClient;
  let mockCallTool: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    client = new TestBosonXmtpMCPClient();
    mockCallTool = vi.fn();
    client.mcp.callTool = mockCallTool;
    client.mcp.connect = vi.fn();
  });

  describe("connectToServer", () => {
    it("should connect to server successfully", async () => {
      (client.mcp.connect as ReturnType<typeof vi.fn>).mockResolvedValue(
        undefined,
      );

      await client.connectToServer({
        env: { TEST_ENV: "test" },
        options: { timeout: 5000 },
      });

      expect(client._isConnected).toBe(true);
      expect(client.mcp.connect).toHaveBeenCalledWith(expect.any(Object), {
        timeout: 5000,
      });
    });

    it("should handle connection failure", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      (client.mcp.connect as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Connection failed"),
      );

      await expect(client.connectToServer({})).rejects.toThrow(
        "Connection failed",
      );

      expect(client._isConnected).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Stdio connection failed",
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("getXmtpEnvironments", () => {
    it("should call the correct tool with parameters", async () => {
      const params = { return: true };
      mockCallTool.mockResolvedValue({ result: "success" });

      await client.getXmtpEnvironments(params);

      expect(mockCallTool).toHaveBeenCalledWith({
        name: "get_xmtp_environments",
        arguments: params,
      });
    });
  });

  describe("initializeXmtpClient", () => {
    it("should call the correct tool with parameters", async () => {
      const params = {
        privateKey:
          "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        configId: "test-config",
        xmtpEnvName: "dev",
      };
      mockCallTool.mockResolvedValue({ result: "initialized" });

      await client.initializeXmtpClient(params);

      expect(mockCallTool).toHaveBeenCalledWith({
        name: "initialize_xmtp_client",
        arguments: params,
      });
    });
  });

  describe("revokeAllOtherInstallations", () => {
    it("should call the correct tool with parameters", async () => {
      const params = {
        privateKey:
          "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        configId: "test-config",
        xmtpEnvName: "dev",
      };
      mockCallTool.mockResolvedValue({ result: "revoked" });

      await client.revokeAllOtherInstallations(params);

      expect(mockCallTool).toHaveBeenCalledWith({
        name: "revoke_all_other_installations",
        arguments: params,
      });
    });
  });

  describe("revokeInstallations", () => {
    it("should call the correct tool with parameters", async () => {
      const params = {
        privateKey:
          "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        xmtpEnvName: "dev",
        inboxIds: ["inbox1", "inbox2"],
      };
      mockCallTool.mockResolvedValue({ result: "revoked" });

      await client.revokeInstallations(params);

      expect(mockCallTool).toHaveBeenCalledWith({
        name: "revoke_installations",
        arguments: params,
      });
    });
  });

  describe("getXmtpThreads", () => {
    it("should call the correct tool with parameters", async () => {
      const params = {
        privateKey:
          "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        configId: "test-config",
        xmtpEnvName: "dev",
        counterparties: ["0x742d35Cc6634C0532925a3b8D4a8D9f11b6A1567"],
        options: { limit: 10 },
      };
      mockCallTool.mockResolvedValue({ result: "threads" });

      await client.getXmtpThreads(params);

      expect(mockCallTool).toHaveBeenCalledWith({
        name: "get_xmtp_threads",
        arguments: params,
      });
    });
  });

  describe("getXmtpThread", () => {
    it("should call the correct tool with parameters", async () => {
      const params = {
        privateKey:
          "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        configId: "test-config",
        xmtpEnvName: "dev",
        threadId: {
          sellerId: "seller123",
          buyerId: "buyer456",
          exchangeId: "exchange789",
        },
        counterparty: "0x742d35Cc6634C0532925a3b8D4a8D9f11b6A1567",
        options: { limit: 5 },
      };
      mockCallTool.mockResolvedValue({ result: "thread" });

      await client.getXmtpThread(params);

      expect(mockCallTool).toHaveBeenCalledWith({
        name: "get_xmtp_thread",
        arguments: params,
      });
    });
  });

  describe("sendXmtpMessage", () => {
    it("should call the correct tool with parameters", async () => {
      const params = {
        privateKey:
          "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        configId: "test-config",
        xmtpEnvName: "dev",
        recipient: "0x742d35Cc6634C0532925a3b8D4a8D9f11b6A1567",
        messageObject: {
          threadId: {
            sellerId: "seller123",
            buyerId: "buyer456",
            exchangeId: "exchange789",
          },
          contentType: MessageType.String,
          version: "0.0.1",
          content: { value: "Test message" },
        },
      };
      mockCallTool.mockResolvedValue({ result: "message sent" });

      await client.sendXmtpMessage(params);

      expect(mockCallTool).toHaveBeenCalledWith({
        name: "send_xmtp_message",
        arguments: params,
      });
    });
  });

  describe("convenience methods", () => {
    const baseParams = Object.freeze({
      privateKey:
        "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      configId: "test-config",
      xmtpEnvName: "dev",
      recipient: "0x742d35Cc6634C0532925a3b8D4a8D9f11b6A1567",
      threadId: {
        sellerId: "seller123",
        buyerId: "buyer456",
        exchangeId: "exchange789",
      },
    });

    describe("sendStringMessage", () => {
      it("should create and send string message", async () => {
        mockCallTool.mockResolvedValue({ result: "sent" });

        await client.sendStringMessage({
          ...baseParams,
          message: "Hello world",
          metadata: { timestamp: Date.now() },
        });
        const { threadId, ...rest } = baseParams;
        expect(mockCallTool).toHaveBeenCalledWith({
          name: "send_xmtp_message",
          arguments: {
            ...rest,
            messageObject: {
              threadId: threadId,
              contentType: MessageType.String,
              version: "0.0.1",
              content: { value: "Hello world" },
              metadata: expect.any(Object),
            },
          },
        });
      });

      it("should work without metadata", async () => {
        mockCallTool.mockResolvedValue({ result: "sent" });

        await client.sendStringMessage({
          ...baseParams,
          message: "Hello world",
        });

        const call = mockCallTool.mock.calls[0][0];
        expect(call.arguments.messageObject.metadata).toBeUndefined();
      });
    });

    describe("sendFileMessage", () => {
      it("should create and send file message", async () => {
        mockCallTool.mockResolvedValue({ result: "sent" });

        await client.sendFileMessage({
          ...baseParams,
          fileName: "document.pdf",
          fileType: "application/pdf",
          fileSize: 1024,
          encodedContent: "data:application/pdf;base64,JVBERi0xLjQ=",
        });
        const { threadId, ...rest } = baseParams;
        expect(mockCallTool).toHaveBeenCalledWith({
          name: "send_xmtp_message",
          arguments: {
            ...rest,
            messageObject: {
              threadId: threadId,
              contentType: MessageType.File,
              version: "0.0.1",
              content: {
                value: {
                  fileName: "document.pdf",
                  fileType: "application/pdf",
                  fileSize: 1024,
                  encodedContent: "data:application/pdf;base64,JVBERi0xLjQ=",
                },
              },
            },
          },
        });
      });
    });

    describe("sendProposalMessage", () => {
      it("should create and send proposal message", async () => {
        mockCallTool.mockResolvedValue({ result: "sent" });

        await client.sendProposalMessage({
          ...baseParams,
          title: "Settlement Proposal",
          description: "Proposed resolution",
          disputeContext: ["context1", "context2"],
          proposals: [
            {
              type: "refund",
              percentageAmount: "50",
              signature: "0xabc123",
            },
          ],
        });
        const { threadId, ...rest } = baseParams;
        const result = {
          name: "send_xmtp_message",
          arguments: {
            ...rest,
            messageObject: {
              threadId: threadId,
              content: {
                value: {
                  title: "Settlement Proposal",
                  description: "Proposed resolution",
                  disputeContext: ["context1", "context2"],
                  proposals: [
                    {
                      type: "refund",
                      percentageAmount: "50",
                      signature: "0xabc123",
                    },
                  ],
                },
              },
              contentType: MessageType.Proposal,
              version: "0.0.1",
            },
          },
        };
        expect(mockCallTool).toHaveBeenCalledWith(result);
      });
    });

    describe("sendCounterProposalMessage", () => {
      it("should create and send counter-proposal message", async () => {
        mockCallTool.mockResolvedValue({ result: "sent" });

        await client.sendCounterProposalMessage({
          ...baseParams,
          title: "Counter Proposal",
          description: "Alternative resolution",
          disputeContext: ["context1"],
          proposals: [
            {
              type: "partial",
              percentageAmount: "75",
              signature: "0xdef456",
            },
          ],
        });

        const call = mockCallTool.mock.calls[0][0];
        expect(call.arguments.messageObject.contentType).toBe(
          MessageType.CounterProposal,
        );
        expect(call.arguments.messageObject.content.value.title).toBe(
          "Counter Proposal",
        );
      });
    });

    describe("sendAcceptProposalMessage", () => {
      it("should create and send accept proposal message", async () => {
        mockCallTool.mockResolvedValue({ result: "sent" });

        await client.sendAcceptProposalMessage({
          ...baseParams,
          title: "Proposal Accepted",
          proposal: {
            type: "refund",
            percentageAmount: "100",
            signature: "0xghi789",
          },
          icon: "check",
          heading: "Accepted",
          body: "Proposal has been accepted",
        });

        const call = mockCallTool.mock.calls[0][0];
        expect(call.arguments.messageObject.contentType).toBe(
          MessageType.AcceptProposal,
        );
        expect(call.arguments.messageObject.content.value.proposal.type).toBe(
          "refund",
        );
        expect(call.arguments.messageObject.content.value.icon).toBe("check");
      });
    });

    describe("sendEscalateDisputeMessage", () => {
      it("should create and send escalate dispute message", async () => {
        mockCallTool.mockResolvedValue({ result: "sent" });

        await client.sendEscalateDisputeMessage({
          ...baseParams,
          title: "Dispute Escalated",
          description: "Escalating to resolver",
          disputeResolverInfo: [
            { label: "Resolver", value: "John Doe" },
            { label: "Contact", value: "john@example.com" },
          ],
          icon: "warning",
          heading: "Escalated",
          body: "Dispute has been escalated",
        });

        const call = mockCallTool.mock.calls[0][0];
        expect(call.arguments.messageObject.contentType).toBe(
          MessageType.EscalateDispute,
        );
        expect(
          call.arguments.messageObject.content.value.disputeResolverInfo,
        ).toHaveLength(2);
        expect(
          call.arguments.messageObject.content.value.disputeResolverInfo[0]
            .label,
        ).toBe("Resolver");
      });
    });
  });

  describe("error handling", () => {
    const baseParams = {
      privateKey:
        "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      configId: "test-config",
      xmtpEnvName: "dev",
      recipient: "0x742d35Cc6634C0532925a3b8D4a8D9f11b6A1567",
      threadId: {
        sellerId: "seller123",
        buyerId: "buyer456",
        exchangeId: "exchange789",
      },
    };
    it("should propagate errors from tool calls", async () => {
      const error = new Error("Tool call failed");
      mockCallTool.mockRejectedValue(error);

      await expect(
        client.getXmtpEnvironments({ return: true }),
      ).rejects.toThrow("Tool call failed");
    });

    it("should handle malformed message objects gracefully", async () => {
      mockCallTool.mockResolvedValue({ result: "sent" });

      // This should work because the client doesn't validate the message structure
      await client.sendStringMessage({
        ...baseParams,
        message: "", // Empty message should still be sent
      });

      expect(mockCallTool).toHaveBeenCalled();
    });
  });
});
