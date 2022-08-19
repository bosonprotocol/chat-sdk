import { MessageData, MessageType } from "../../../src/util/v0.0.1/types";
import { validateMessage } from "../../../src/util/validators";
import {
  mockInvalidBase64ValueEncodedFilePng,
  mockInvalidDataUrlEncodedFilePng,
  mockMessageObject
} from "../../mocks";

describe("v0.0.1", () => {
  describe("string message", () => {
    test("valid string message", async () => {
      const message: MessageData["data"] = {
        ...mockMessageObject(MessageType.String)
      };
      expect(await validateMessage(message)).toBe(true);
    });
    test("invalid string message", async () => {
      const msg = mockMessageObject(MessageType.String);
      const message: MessageData["data"] = {
        ...msg,
        content: {
          ...msg.content,
          value: 1
        }
      } as unknown as MessageData["data"];
      expect(await validateMessage(message)).toBe(false);
    });
  });
  describe("file message", () => {
    test("valid file message", async () => {
      const message: MessageData["data"] = {
        ...mockMessageObject(MessageType.File)
      };
      expect(await validateMessage(message)).toBe(true);
    });
    test("invalid file message - invalid value", async () => {
      const message: MessageData["data"] = {
        ...mockMessageObject(MessageType.File),
        content: {
          value: 1
        }
      } as unknown as MessageData["data"];
      expect(await validateMessage(message)).toBe(false);
    });
    test("invalid file message - invalid dataurl value", async () => {
      const message: MessageData["data"] = {
        ...mockMessageObject(MessageType.File),
        content: {
          ...mockInvalidDataUrlEncodedFilePng()
        }
      } as unknown as MessageData["data"];
      expect(await validateMessage(message)).toBe(false);
    });
    // TODO: remove .skip
    test.skip("invalid file message - invalid base64 value", async () => {
      const message: MessageData["data"] = {
        ...mockMessageObject(MessageType.File),
        content: {
          ...mockInvalidBase64ValueEncodedFilePng()
        }
      } as unknown as MessageData["data"];
      expect(await validateMessage(message)).toBe(false);
    });
    test("invalid file message - empty fileName", async () => {
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
      expect(await validateMessage(message)).toBe(false);
    });
    test("invalid file message - invalid fileType", async () => {
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
      expect(await validateMessage(message)).toBe(false);
    });
    test("invalid file message - invalid fileSize", async () => {
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
      expect(await validateMessage(message)).toBe(false);
    });
  });
  describe("proposal message", () => {
    test("valid proposal message", async () => {
      const message: MessageData["data"] = {
        ...mockMessageObject(MessageType.Proposal)
      };
      expect(await validateMessage(message)).toBe(true);
    });
    test("invalid proposal message - percentageAmount with decimals", async () => {
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
      expect(await validateMessage(message)).toBe(false);
    });
  });
  describe("invalid message", () => {
    test("invalid message type", async () => {
      const message: MessageData["data"] = {
        ...mockMessageObject(null as never)
      };
      expect(await validateMessage(message)).toBe(false);
    });
  });
});
describe("invalid version", () => {
  test("valid string message", async () => {
    const message: MessageData["data"] = {
      ...mockMessageObject(MessageType.String),
      version: "invalid"
    } as unknown as MessageData["data"];
    expect(await validateMessage(message)).toBe(false);
  });
});
