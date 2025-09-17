import { describe, expect, it } from "vitest";

import { MessageType } from "../../common/util/v0.0.1/definitions.js";
import {
  ethereumAddressValidation,
  fileMessageSchema,
  getThreadValidation,
  proposalMessageSchema,
  sendMessageValidation,
  stringContentTypeSchema,
  stringMessageSchema,
  threadIdSchema,
} from "./validation.js";

describe("XMTP Validation Schemas", () => {
  describe("ethereumAddressValidation", () => {
    it("should validate correct Ethereum addresses", () => {
      const validAddress = "0x9c2925a41d6FB1c6C8f53351634446B0b2E65eE8";
      expect(() => ethereumAddressValidation.parse(validAddress)).not.toThrow();
    });

    it("should reject invalid Ethereum addresses", () => {
      const invalidAddress = "0xinvalid";
      expect(() => ethereumAddressValidation.parse(invalidAddress)).toThrow(
        "Must be a valid Ethereum address",
      );
    });
  });

  describe("threadIdSchema", () => {
    it("should validate correct thread ID structure", () => {
      const validThreadId = {
        sellerId: "seller123",
        buyerId: "buyer456",
        exchangeId: "exchange789",
      };
      expect(() => threadIdSchema.parse(validThreadId)).not.toThrow();
    });

    it("should reject incomplete thread ID", () => {
      const invalidThreadId = {
        sellerId: "seller123",
        buyerId: "buyer456",
        // missing exchangeId
      };
      expect(() => threadIdSchema.parse(invalidThreadId)).toThrow();
    });
  });

  describe("stringMessageSchema", () => {
    it("should validate string message", () => {
      const validMessage = { value: "Hello world" };
      expect(() => stringMessageSchema.parse(validMessage)).not.toThrow();
    });

    it("should reject non-string value", () => {
      const invalidMessage = { value: 123 };
      expect(() => stringMessageSchema.parse(invalidMessage)).toThrow();
    });
  });

  describe("fileMessageSchema", () => {
    it("should validate file message with correct structure", () => {
      const validFileMessage = {
        value: {
          fileName: "document.pdf",
          fileType: "application/pdf",
          fileSize: 1024,
          encodedContent: "data:application/pdf;base64,JVBERi0xLjQ=",
        },
      };
      expect(() => fileMessageSchema.parse(validFileMessage)).not.toThrow();
    });

    it("should reject file message with invalid data URL", () => {
      const invalidFileMessage = {
        value: {
          fileName: "document.pdf",
          fileType: "application/pdf",
          fileSize: 1024,
          encodedContent: "invalid-data-url",
        },
      };
      expect(() => fileMessageSchema.parse(invalidFileMessage)).toThrow(
        "Must be a valid data URL",
      );
    });
  });

  describe("proposalMessageSchema", () => {
    it("should validate proposal message", () => {
      const validProposal = {
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
      };
      expect(() => proposalMessageSchema.parse(validProposal)).not.toThrow();
    });

    it("should reject proposal with invalid percentage", () => {
      const invalidProposal = {
        value: {
          title: "Settlement Proposal",
          description: "Proposed resolution",
          disputeContext: ["context1"],
          proposals: [
            {
              type: "refund",
              percentageAmount: "50.5", // decimal not allowed
              signature: "0xabc123",
            },
          ],
        },
      };
      expect(() => proposalMessageSchema.parse(invalidProposal)).toThrow(
        "Must be a positive integer without decimal point",
      );
    });
  });

  describe("stringContentTypeSchema", () => {
    it("should validate complete string content type message", () => {
      const validContent = {
        contentType: MessageType.String,
        content: { value: "Hello world" },
        threadId: {
          sellerId: "seller123",
          buyerId: "buyer456",
          exchangeId: "exchange789",
        },
        version: "0.0.1",
      };
      expect(() => stringContentTypeSchema.parse(validContent)).not.toThrow();
    });
  });

  describe("sendMessageValidation", () => {
    it("should validate send message parameters", () => {
      const validSendMessage = {
        privateKey:
          "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        configId: "testing-80002-0",
        xmtpEnvName: "dev",
        messageObject: {
          contentType: MessageType.String,
          content: { value: "Test message" },
          threadId: {
            sellerId: "seller123",
            buyerId: "buyer456",
            exchangeId: "exchange789",
          },
          version: "0.0.1",
        },
        recipient: "0x9c2925a41d6FB1c6C8f53351634446B0b2E65eE8",
      };
      expect(() => sendMessageValidation.parse(validSendMessage)).not.toThrow();
    });
  });

  describe("getThreadValidation", () => {
    it("should validate get thread parameters", () => {
      const validGetThread = {
        privateKey:
          "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        configId: "testing-80002-0",
        xmtpEnvName: "dev",
        threadId: {
          sellerId: "seller123",
          buyerId: "buyer456",
          exchangeId: "exchange789",
        },
        counterparty: "0x9c2925a41d6FB1c6C8f53351634446B0b2E65eE8",
        options: {
          limit: 10,
          direction: 1,
        },
      };
      expect(() => getThreadValidation.parse(validGetThread)).not.toThrow();
    });
  });
});
