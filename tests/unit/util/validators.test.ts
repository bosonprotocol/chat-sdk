import { MessageData, MessageType } from "../../../src/util/v0.0.1/definitions";
import { validateMessage } from "../../../src/util/validators";
import {
  mockInvalidDataUrlEncodedFilePng,
  mockMessageObject
} from "../../mocks";
import { describe, it, expect } from "vitest";

describe("v0.0.1", () => {
  describe("string message", () => {
    it("valid string message", async () => {
      const message: MessageData["data"] = {
        ...mockMessageObject(MessageType.String)
      };
      expect(validateMessage(message)).toBe(true);
    });
    it("invalid string message", async () => {
      const msg = mockMessageObject(MessageType.String);
      const message: MessageData["data"] = {
        ...msg,
        content: {
          ...msg.content,
          value: 1
        }
      } as unknown as MessageData["data"];
      expect(validateMessage(message)).toBe(false);
    });
  });
  describe("file message", () => {
    it("valid file message", async () => {
      const message: MessageData["data"] = {
        ...mockMessageObject(MessageType.File)
      };
      expect(validateMessage(message)).toBe(true);
    });
    it("invalid file message - invalid value", async () => {
      const message: MessageData["data"] = {
        ...mockMessageObject(MessageType.File),
        content: {
          value: 1
        }
      } as unknown as MessageData["data"];
      expect(validateMessage(message)).toBe(false);
    });
    it("invalid file message - invalid dataurl value", async () => {
      const message: MessageData["data"] = {
        ...mockMessageObject(MessageType.File),
        content: {
          ...mockInvalidDataUrlEncodedFilePng()
        }
      } as unknown as MessageData["data"];
      expect(validateMessage(message)).toBe(false);
    });
    it("invalid file message - empty fileName", async () => {
      const msg = mockMessageObject(MessageType.File);
      const message: MessageData["data"] = {
        ...msg,
        content: {
          ...msg.content,
          value: {
            ...(msg.content.value as Record<string, unknown>),
            fileName: ""
          }
        }
      } as unknown as MessageData["data"];
      expect(validateMessage(message)).toBe(false);
    });
    it("invalid file message - invalid fileType", async () => {
      const msg = mockMessageObject(MessageType.File);
      const message: MessageData["data"] = {
        ...msg,
        content: {
          ...msg.content,
          value: {
            ...(msg.content.value as Record<string, unknown>),
            fileType: "image/madeUp"
          }
        }
      } as unknown as MessageData["data"];
      expect(validateMessage(message)).toBe(false);
    });
    it("invalid file message - invalid fileSize", async () => {
      const msg = mockMessageObject(MessageType.File);
      const message: MessageData["data"] = {
        ...msg,
        content: {
          ...msg.content,
          value: {
            ...(msg.content.value as Record<string, unknown>),
            fileSize: 0
          }
        }
      } as unknown as MessageData["data"];
      expect(validateMessage(message)).toBe(false);
    });
  });
  describe("proposal message", () => {
    it("valid proposal message", async () => {
      const message: MessageData["data"] = {
        ...mockMessageObject(MessageType.Proposal)
      };
      expect(validateMessage(message)).toBe(true);
    });
    it("invalid proposal message - percentageAmount with decimals", async () => {
      const msg = mockMessageObject(MessageType.Proposal);
      const message: MessageData["data"] = {
        ...msg,
        content: {
          ...msg.content,
          value: {
            ...(msg.content.value as Record<string, unknown>),
            proposals: [
              {
                percentageAmount: "0.1",
                signature: "signature",
                type: "type"
              }
            ]
          }
        }
      } as unknown as MessageData["data"];
      expect(validateMessage(message)).toBe(false);
    });
  });
  describe("invalid message", () => {
    it("invalid message type", async () => {
      const message: MessageData["data"] = {
        ...mockMessageObject(null as never)
      };
      expect(validateMessage(message)).toBe(false);
    });
  });
});
describe("invalid version", () => {
  it("valid string message", async () => {
    const message: MessageData["data"] = {
      ...mockMessageObject(MessageType.String),
      version: "invalid"
    } as unknown as MessageData["data"];
    expect(validateMessage(message)).toBe(false);
  });
});
