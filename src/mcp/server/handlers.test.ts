import { createEOASigner } from "../../node/helpers/createSigner.js";
import { logAndThrowError } from "./errorHandling.js";
import { stringifyWithBigInt } from "./jsonUtils.js";
import { log } from "./logger.js"; // xmtpHandlers.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ListMessagesOptions } from "@xmtp/node-sdk";
import type { Wallet } from "ethers";
import {
  createInitializeClientHandler,
  revokeAllOtherInstallationsHandler,
  revokeInstallationsHandler,
  createGetThreadsHandler,
  createGetThreadHandler,
  createSendMessageHandler,
} from "./handlers.js";
import { BosonXmtpNodeClient } from "../../node/index.js";

// Mock dependencies with proper return values
vi.mock("../../node/helpers/createSigner.js", () => ({
  createEOASigner: vi.fn(),
}));

vi.mock("../../node/index.js", () => ({
  BosonXmtpNodeClient: {
    revokeInstallations: vi.fn(),
  },
}));

vi.mock("./errorHandling.js", () => ({
  logAndThrowError: vi.fn(),
}));

vi.mock("./jsonUtils.js", () => ({
  stringifyWithBigInt: vi.fn(),
}));

vi.mock("./logger.js", () => ({
  log: vi.fn(),
}));

describe("XMTP Handler Functions", () => {
  let mockClient: BosonXmtpNodeClient;
  let mockWallet: Wallet;
  let getClient: () => Promise<BosonXmtpNodeClient>;
  let getWallet: () => Wallet;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset all mocks with proper implementations
    vi.mocked(logAndThrowError).mockImplementation((error, context) => {
      const errorMessage = error.message || error;
      throw new Error(`${context}: ${errorMessage}`);
    });

    vi.mocked(stringifyWithBigInt).mockImplementation((obj) =>
      JSON.stringify(obj),
    );

    vi.mocked(createEOASigner).mockReturnValue({
      type: "EOA",
      getIdentifier: () => ({ identifier: "0x123", identifierKind: 1 }),
      signMessage: vi.fn(),
    });

    // Mock BosonXmtpNodeClient
    mockClient = {
      inboxId: "inbox_123",
      revokeAllOtherInstallations: vi.fn().mockResolvedValue(undefined),
      getThreads: vi.fn(),
      getThread: vi.fn(),
      encodeAndSendMessage: vi.fn(),
    } as unknown as BosonXmtpNodeClient;

    // Mock Wallet
    mockWallet = {
      getAddress: vi
        .fn()
        .mockResolvedValue("0x1234567890123456789012345678901234567890"),
    } as unknown as Wallet;

    // Mock getter functions
    getClient = vi.fn().mockResolvedValue(mockClient);
    getWallet = vi.fn().mockReturnValue(mockWallet);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createInitializeClientHandler", () => {
    it("should successfully initialize client and return inbox ID", async () => {
      const handler = createInitializeClientHandler(getClient);
      const result = await handler();

      expect(log).toHaveBeenCalledWith("Initializing XMTP client");
      expect(getClient).toHaveBeenCalled();
      expect(stringifyWithBigInt).toHaveBeenCalledWith({
        success: true,
        data: {
          inboxId: "inbox_123",
        },
      });
      expect(result).toBe('{"success":true,"data":{"inboxId":"inbox_123"}}');
    });

    it("should throw error when getClient is not provided", async () => {
      const handler = createInitializeClientHandler();

      await expect(handler()).rejects.toThrow(
        "initialize XMTP client: Client getter not provided",
      );
      expect(logAndThrowError).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Client getter not provided" }),
        "initialize XMTP client",
      );
    });

    it("should handle client initialization errors", async () => {
      const error = new Error("Client initialization failed");
      const failingGetClient = vi.fn().mockRejectedValue(error);
      const handler = createInitializeClientHandler(failingGetClient);

      await expect(handler()).rejects.toThrow(
        "initialize XMTP client: Client initialization failed",
      );
      expect(logAndThrowError).toHaveBeenCalledWith(
        error,
        "initialize XMTP client",
      );
    });

    it("should handle clients with different inbox IDs", async () => {
      const clientWithDifferentId = { ...mockClient, inboxId: "inbox_456" };
      const getClientWithDifferentId = vi
        .fn()
        .mockResolvedValue(clientWithDifferentId);
      const handler = createInitializeClientHandler(getClientWithDifferentId);

      await handler();

      expect(stringifyWithBigInt).toHaveBeenCalledWith({
        success: true,
        data: {
          inboxId: "inbox_456",
        },
      });
    });
  });

  describe("revokeAllOtherInstallationsHandler", () => {
    it("should successfully revoke all other installations", async () => {
      const handler = revokeAllOtherInstallationsHandler(getClient);
      const result = await handler();

      expect(log).toHaveBeenCalledWith("Revoking all other installations");
      expect(getClient).toHaveBeenCalled();
      expect(mockClient.revokeAllOtherInstallations).toHaveBeenCalled();
      expect(stringifyWithBigInt).toHaveBeenCalledWith({ success: true });
      expect(result).toBe('{"success":true}');
    });

    it("should throw error when getClient is not provided", async () => {
      const handler = revokeAllOtherInstallationsHandler();

      await expect(handler()).rejects.toThrow(
        "initialize XMTP client: Client getter not provided",
      );
      expect(logAndThrowError).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Client getter not provided" }),
        "initialize XMTP client",
      );
    });

    it("should handle revocation errors", async () => {
      const error = new Error("Revocation failed");
      vi.mocked(mockClient.revokeAllOtherInstallations).mockRejectedValue(
        error,
      );
      const handler = revokeAllOtherInstallationsHandler(getClient);

      await expect(handler()).rejects.toThrow(
        "initialize XMTP client: Revocation failed",
      );
      expect(logAndThrowError).toHaveBeenCalledWith(
        error,
        "initialize XMTP client",
      );
    });
  });

  describe("revokeInstallationsHandler", () => {
    const mockParams = {
      inboxIds: ["inbox1", "inbox2"],
      xmtpEnvName: "production" as const,
    };

    it("should successfully revoke specific installations", async () => {
      const handler = revokeInstallationsHandler(getClient, getWallet);
      const result = await handler(mockParams);

      expect(log).toHaveBeenCalledWith(
        "Revoking installations for inbox IDs:",
        mockParams.inboxIds,
      );
      expect(getWallet).toHaveBeenCalled();
      expect(mockWallet.getAddress).toHaveBeenCalled();
      expect(createEOASigner).toHaveBeenCalledWith(
        "0x1234567890123456789012345678901234567890",
        mockWallet,
      );
      expect(BosonXmtpNodeClient.revokeInstallations).toHaveBeenCalledWith({
        inboxIds: mockParams.inboxIds,
        signer: expect.any(Object),
        xmtpEnvName: mockParams.xmtpEnvName,
      });
      expect(stringifyWithBigInt).toHaveBeenCalledWith({ success: true });
      expect(result).toBe('{"success":true}');
    });

    it("should throw error when getWallet is not provided", async () => {
      const handler = revokeInstallationsHandler(getClient, undefined);

      await expect(handler(mockParams)).rejects.toThrow(
        "initialize XMTP client: Wallet getter not provided",
      );
      expect(logAndThrowError).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Wallet getter not provided" }),
        "initialize XMTP client",
      );
    });

    it("should handle wallet address retrieval errors", async () => {
      const error = new Error("Failed to get address");
      vi.mocked(mockWallet.getAddress).mockRejectedValue(error);
      const handler = revokeInstallationsHandler(getClient, getWallet);

      await expect(handler(mockParams)).rejects.toThrow(
        "initialize XMTP client: Failed to get address",
      );
      expect(logAndThrowError).toHaveBeenCalledWith(
        error,
        "initialize XMTP client",
      );
    });

    it("should handle revocation API errors", async () => {
      const error = new Error("API revocation failed");
      vi.mocked(BosonXmtpNodeClient.revokeInstallations).mockRejectedValue(
        error,
      );
      const handler = revokeInstallationsHandler(getClient, getWallet);

      await expect(handler(mockParams)).rejects.toThrow(
        "initialize XMTP client: API revocation failed",
      );
      expect(logAndThrowError).toHaveBeenCalledWith(
        error,
        "initialize XMTP client",
      );
    });

    it("should handle different environment names", async () => {
      const paramsWithStaging = {
        ...mockParams,
        xmtpEnvName: "staging" as const,
      };
      const handler = revokeInstallationsHandler(getClient, getWallet);

      await handler(paramsWithStaging);

      expect(BosonXmtpNodeClient.revokeInstallations).toHaveBeenCalledWith({
        inboxIds: mockParams.inboxIds,
        signer: expect.any(Object),
        xmtpEnvName: "staging",
      });
    });
  });

  describe("createGetThreadsHandler", () => {
    const mockParams = {
      counterparties: ["0xabc123", "0xdef456"],
      options: { limit: 10 } as ListMessagesOptions,
    };

    it("should successfully get threads", async () => {
      const mockThreads = [
        { threadId: "thread1", messages: [] },
        { threadId: "thread2", messages: [] },
      ];
      vi.mocked(mockClient.getThreads).mockResolvedValue(mockThreads);

      const handler = createGetThreadsHandler(getClient);
      const result = await handler(mockParams);

      expect(log).toHaveBeenCalledWith(
        "Getting XMTP threads:",
        '{"counterparties":["0xabc123","0xdef456"],"options":{"limit":10}}',
      );
      expect(getClient).toHaveBeenCalled();
      expect(mockClient.getThreads).toHaveBeenCalledWith(
        mockParams.counterparties,
        mockParams.options,
      );
      expect(stringifyWithBigInt).toHaveBeenCalledWith({
        success: true,
        data: {
          threads: mockThreads,
          count: 2,
        },
      });
      expect(result).toBe(
        '{"success":true,"data":{"threads":[{"threadId":"thread1","messages":[]},{"threadId":"thread2","messages":[]}],"count":2}}',
      );
    });

    it("should handle parameters without options", async () => {
      const paramsWithoutOptions = { counterparties: ["0xabc123"] };
      const mockThreads = [{ threadId: "thread1", messages: [] }];
      vi.mocked(mockClient.getThreads).mockResolvedValue(mockThreads);

      const handler = createGetThreadsHandler(getClient);
      await handler(paramsWithoutOptions);

      expect(mockClient.getThreads).toHaveBeenCalledWith(
        paramsWithoutOptions.counterparties,
        undefined,
      );
    });

    it("should throw error when getClient is not provided", async () => {
      const handler = createGetThreadsHandler();

      await expect(handler(mockParams)).rejects.toThrow(
        "get XMTP threads: Client getter not provided",
      );
      expect(logAndThrowError).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Client getter not provided" }),
        "get XMTP threads",
      );
    });

    it("should handle empty thread results", async () => {
      vi.mocked(mockClient.getThreads).mockResolvedValue([]);

      const handler = createGetThreadsHandler(getClient);
      const result = await handler(mockParams);

      expect(stringifyWithBigInt).toHaveBeenCalledWith({
        success: true,
        data: {
          threads: [],
          count: 0,
        },
      });
    });

    it("should handle getThreads API errors", async () => {
      const error = new Error("Failed to get threads");
      vi.mocked(mockClient.getThreads).mockRejectedValue(error);
      const handler = createGetThreadsHandler(getClient);

      await expect(handler(mockParams)).rejects.toThrow(
        "get XMTP threads: Failed to get threads",
      );
      expect(logAndThrowError).toHaveBeenCalledWith(error, "get XMTP threads");
    });
  });

  describe("createGetThreadHandler", () => {
    const mockParams = {
      threadId: { exchangeId: "ex1", buyerId: "buyer1", sellerId: "seller1" },
      counterparty: "0xabc123",
      options: { limit: 20 } as ListMessagesOptions,
    };

    it("should successfully get a thread", async () => {
      const mockThread = { threadId: "thread1", messages: [{ id: "msg1" }] };
      vi.mocked(mockClient.getThread).mockResolvedValue(mockThread);

      const handler = createGetThreadHandler(getClient);
      const result = await handler(mockParams);

      expect(log).toHaveBeenCalledWith(
        "Getting XMTP thread:",
        '{"threadId":{"exchangeId":"ex1","buyerId":"buyer1","sellerId":"seller1"},"counterparty":"0xabc123","options":{"limit":20}}',
      );
      expect(getClient).toHaveBeenCalled();
      expect(mockClient.getThread).toHaveBeenCalledWith(
        mockParams.threadId,
        mockParams.counterparty,
        mockParams.options,
      );
      expect(stringifyWithBigInt).toHaveBeenCalledWith({
        success: true,
        data: mockThread,
      });
      expect(result).toBe(
        '{"success":true,"data":{"threadId":"thread1","messages":[{"id":"msg1"}]}}',
      );
    });

    it("should handle thread not found", async () => {
      vi.mocked(mockClient.getThread).mockResolvedValue(null);

      const handler = createGetThreadHandler(getClient);
      const result = await handler(mockParams);

      expect(stringifyWithBigInt).toHaveBeenCalledWith({
        success: false,
        error: "Thread not found",
        data: null,
      });
      expect(result).toBe(
        '{"success":false,"error":"Thread not found","data":null}',
      );
    });

    it("should handle parameters without options", async () => {
      const paramsWithoutOptions = {
        threadId: mockParams.threadId,
        counterparty: mockParams.counterparty,
      };
      const mockThread = { threadId: "thread1", messages: [] };
      vi.mocked(mockClient.getThread).mockResolvedValue(mockThread);

      const handler = createGetThreadHandler(getClient);
      await handler(paramsWithoutOptions);

      expect(mockClient.getThread).toHaveBeenCalledWith(
        paramsWithoutOptions.threadId,
        paramsWithoutOptions.counterparty,
        undefined,
      );
    });

    it("should throw error when getClient is not provided", async () => {
      const handler = createGetThreadHandler();

      await expect(handler(mockParams)).rejects.toThrow(
        "get XMTP thread: Client getter not provided",
      );
      expect(logAndThrowError).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Client getter not provided" }),
        "get XMTP thread",
      );
    });

    it("should handle getThread API errors", async () => {
      const error = new Error("Failed to get thread");
      vi.mocked(mockClient.getThread).mockRejectedValue(error);
      const handler = createGetThreadHandler(getClient);

      await expect(handler(mockParams)).rejects.toThrow(
        "get XMTP thread: Failed to get thread",
      );
      expect(logAndThrowError).toHaveBeenCalledWith(error, "get XMTP thread");
    });
  });

  describe("createSendMessageHandler", () => {
    const mockParams = {
      messageObject: {
        threadId: { exchangeId: "ex1", buyerId: "buyer1", sellerId: "seller1" },
        contentType: "String",
        version: "0.0.1",
        content: { value: "Hello world" },
      },
      recipient: "0xabc123",
    };

    it("should successfully send a message", async () => {
      const mockMessageData = { messageId: "msg123", sent: true };
      vi.mocked(mockClient.encodeAndSendMessage).mockResolvedValue(
        mockMessageData,
      );

      const handler = createSendMessageHandler(getClient);
      const result = await handler(mockParams);

      expect(log).toHaveBeenCalledWith(
        "Sending XMTP message:",
        '{"messageObject":{"threadId":{"exchangeId":"ex1","buyerId":"buyer1","sellerId":"seller1"},"contentType":"String","version":"0.0.1","content":{"value":"Hello world"}},"recipient":"0xabc123"}',
      );
      expect(getClient).toHaveBeenCalled();
      expect(mockClient.encodeAndSendMessage).toHaveBeenCalledWith(
        mockParams.messageObject,
        mockParams.recipient,
      );
      expect(stringifyWithBigInt).toHaveBeenCalledWith({
        success: true,
        data: mockMessageData,
      });
      expect(result).toBe(
        '{"success":true,"data":{"messageId":"msg123","sent":true}}',
      );
    });

    it("should handle failed message sending", async () => {
      vi.mocked(mockClient.encodeAndSendMessage).mockResolvedValue(null);

      const handler = createSendMessageHandler(getClient);
      const result = await handler(mockParams);

      expect(stringifyWithBigInt).toHaveBeenCalledWith({
        success: false,
        error: "Failed to send message",
        data: null,
      });
      expect(result).toBe(
        '{"success":false,"error":"Failed to send message","data":null}',
      );
    });

    it("should throw error when getClient is not provided", async () => {
      const handler = createSendMessageHandler();

      await expect(handler(mockParams)).rejects.toThrow(
        "send XMTP message: Client getter not provided",
      );
      expect(logAndThrowError).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Client getter not provided" }),
        "send XMTP message",
      );
    });

    it("should handle different message types", async () => {
      const fileMessageParams = {
        messageObject: {
          threadId: {
            exchangeId: "ex1",
            buyerId: "buyer1",
            sellerId: "seller1",
          },
          contentType: "File",
          version: "0.0.1",
          content: {
            value: {
              fileName: "test.pdf",
              fileType: "application/pdf",
              fileSize: 1024,
              encodedContent: "data:application/pdf;base64,test",
            },
          },
        },
        recipient: "0xabc123",
      };

      const mockMessageData = { messageId: "msg456", sent: true };
      vi.mocked(mockClient.encodeAndSendMessage).mockResolvedValue(
        mockMessageData,
      );

      const handler = createSendMessageHandler(getClient);
      await handler(fileMessageParams);

      expect(mockClient.encodeAndSendMessage).toHaveBeenCalledWith(
        fileMessageParams.messageObject,
        fileMessageParams.recipient,
      );
    });

    it("should handle encodeAndSendMessage API errors", async () => {
      const error = new Error("Failed to encode message");
      vi.mocked(mockClient.encodeAndSendMessage).mockRejectedValue(error);
      const handler = createSendMessageHandler(getClient);

      await expect(handler(mockParams)).rejects.toThrow(
        "send XMTP message: Failed to encode message",
      );
      expect(logAndThrowError).toHaveBeenCalledWith(error, "send XMTP message");
    });
  });

  describe("dependency integration", () => {
    it("should use stringifyWithBigInt for all return values", async () => {
      const handler = createInitializeClientHandler(getClient);
      await handler();

      expect(stringifyWithBigInt).toHaveBeenCalled();
    });

    it("should use log for all operations", async () => {
      const handler = createInitializeClientHandler(getClient);
      await handler();

      expect(log).toHaveBeenCalled();
    });

    it("should use logAndThrowError for all error cases", async () => {
      const handlers = [
        createInitializeClientHandler(),
        revokeAllOtherInstallationsHandler(),
        createGetThreadsHandler(),
        createGetThreadHandler(),
        createSendMessageHandler(),
      ];

      for (const handler of handlers) {
        try {
          if (handler.length === 0) {
            await handler();
          } else {
            await (handler as any)({});
          }
        } catch (error) {
          // Expected to throw
        }
      }

      expect(logAndThrowError).toHaveBeenCalled();
    });

    it("should properly create EOA signer in revokeInstallations", async () => {
      const handler = revokeInstallationsHandler(getClient, getWallet);
      const mockParams = {
        inboxIds: ["inbox1"],
        xmtpEnvName: "production" as const,
      };

      await handler(mockParams);

      expect(createEOASigner).toHaveBeenCalledWith(
        "0x1234567890123456789012345678901234567890",
        mockWallet,
      );
    });
  });

  describe("error context handling", () => {
    it("should provide correct error context for each handler", async () => {
      const handlers = [
        {
          handler: createInitializeClientHandler(),
          context: "initialize XMTP client",
        },
        {
          handler: revokeAllOtherInstallationsHandler(),
          context: "initialize XMTP client",
        },
        {
          handler: revokeInstallationsHandler(undefined, undefined),
          context: "initialize XMTP client",
        },
        { handler: createGetThreadsHandler(), context: "get XMTP threads" },
        { handler: createGetThreadHandler(), context: "get XMTP thread" },
        { handler: createSendMessageHandler(), context: "send XMTP message" },
      ];

      for (const { handler, context } of handlers) {
        try {
          if (handler.length === 0) {
            await handler();
          } else {
            await (handler as any)({});
          }
        } catch (error) {
          expect((error as Error).message).toContain(context);
        }
      }
    });
  });
});
