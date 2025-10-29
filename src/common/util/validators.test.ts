/* eslint-disable @typescript-eslint/no-explicit-any */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { validateMessage } from "./index.js";
import type { MessageData } from "./v0.0.1/definitions.js";
import { MessageType, version } from "./v0.0.1/definitions.js";

// Mock the v0.0.1 validator
vi.mock("./v0.0.1/validators.js", () => ({
  validateMessage: vi.fn(),
}));

import { validateMessage as validateV001 } from "./v0.0.1/validators.js";

describe("validateMessage (versioned)", () => {
  let mockValidateV001: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateV001 = vi.mocked(validateV001);

    // Mock console.error to test logging
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  // Helper function to create base message data
  const createBaseMessageData = (
    overrides: Partial<MessageData["data"]> = {},
  ): MessageData["data"] => ({
    threadId: {
      exchangeId: "exchange-123",
      buyerId: "buyer-456",
      sellerId: "seller-789",
    },
    contentType: MessageType.String,
    version: version,
    content: { value: "Test message" },
    ...overrides,
  });

  describe("version routing", () => {
    it('should call v0.0.1 validator for version "0.0.1"', () => {
      const messageData = createBaseMessageData({ version: "0.0.1" });
      mockValidateV001.mockImplementation(() => {}); // No throw = success

      const result = validateMessage(messageData);

      expect(mockValidateV001).toHaveBeenCalledWith(messageData);
      expect(mockValidateV001).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    it("should throw error for unsupported version", () => {
      const messageData = createBaseMessageData({ version: "1.0.0" });

      expect(() => validateMessage(messageData, { throwError: true })).toThrow(
        "Unsupported message version=1.0.0",
      );
    });

    it("should return false for unsupported version when throwError is false", () => {
      const messageData = createBaseMessageData({ version: "2.0.0" });

      const result = validateMessage(messageData, { throwError: false });

      expect(result).toBe(false);
    });

    it("should handle null version", () => {
      const messageData = createBaseMessageData({ version: null as any });

      const result = validateMessage(messageData, { throwError: false });

      expect(result).toBe(false);
    });

    it("should handle undefined version", () => {
      const messageData = createBaseMessageData({ version: undefined as any });

      const result = validateMessage(messageData, { throwError: false });

      expect(result).toBe(false);
    });

    it("should handle empty string version", () => {
      const messageData = createBaseMessageData({ version: "" });

      const result = validateMessage(messageData, { throwError: false });

      expect(result).toBe(false);
    });
  });

  describe("error handling options", () => {
    describe("throwError option", () => {
      it("should throw error when throwError is true and validation fails", () => {
        const messageData = createBaseMessageData();
        const validationError = new Error("Validation failed");
        mockValidateV001.mockImplementation(() => {
          throw validationError;
        });

        expect(() =>
          validateMessage(messageData, { throwError: true }),
        ).toThrow("Validation failed");
      });

      it("should return false when throwError is false and validation fails", () => {
        const messageData = createBaseMessageData();
        const validationError = new Error("Validation failed");
        mockValidateV001.mockImplementation(() => {
          throw validationError;
        });

        const result = validateMessage(messageData, { throwError: false });

        expect(result).toBe(false);
      });

      it("should default throwError to false when not specified", () => {
        const messageData = createBaseMessageData();
        const validationError = new Error("Validation failed");
        mockValidateV001.mockImplementation(() => {
          throw validationError;
        });

        const result = validateMessage(messageData);

        expect(result).toBe(false);
      });
    });

    describe("logError option", () => {
      it("should log error when logError is true and validation fails", () => {
        const messageData = createBaseMessageData();
        const validationError = new Error("Validation failed");
        mockValidateV001.mockImplementation(() => {
          throw validationError;
        });

        validateMessage(messageData, { logError: true, throwError: false });

        expect(console.error).toHaveBeenCalledWith(validationError);
        expect(console.error).toHaveBeenCalledTimes(1);
      });

      it("should not log error when logError is false and validation fails", () => {
        const messageData = createBaseMessageData();
        const validationError = new Error("Validation failed");
        mockValidateV001.mockImplementation(() => {
          throw validationError;
        });

        validateMessage(messageData, { logError: false, throwError: false });

        expect(console.error).not.toHaveBeenCalled();
      });

      it("should default logError to false when not specified", () => {
        const messageData = createBaseMessageData();
        const validationError = new Error("Validation failed");
        mockValidateV001.mockImplementation(() => {
          throw validationError;
        });

        validateMessage(messageData, { throwError: false });

        expect(console.error).not.toHaveBeenCalled();
      });

      it("should log error for unsupported version when logError is true", () => {
        const messageData = createBaseMessageData({ version: "999.0.0" });

        validateMessage(messageData, { logError: true, throwError: false });

        expect(console.error).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "Unsupported message version=999.0.0",
          }),
        );
      });
    });

    describe("combined options", () => {
      it("should log and throw when both logError and throwError are true", () => {
        const messageData = createBaseMessageData();
        const validationError = new Error("Validation failed");
        mockValidateV001.mockImplementation(() => {
          throw validationError;
        });

        expect(() =>
          validateMessage(messageData, { logError: true, throwError: true }),
        ).toThrow("Validation failed");

        expect(console.error).toHaveBeenCalledWith(validationError);
      });

      it("should neither log nor throw when both options are false", () => {
        const messageData = createBaseMessageData();
        const validationError = new Error("Validation failed");
        mockValidateV001.mockImplementation(() => {
          throw validationError;
        });

        const result = validateMessage(messageData, {
          logError: false,
          throwError: false,
        });

        expect(result).toBe(false);
        expect(console.error).not.toHaveBeenCalled();
      });
    });
  });

  describe("success cases", () => {
    it("should return true when validation passes", () => {
      const messageData = createBaseMessageData();
      mockValidateV001.mockImplementation(() => {}); // No throw = success

      const result = validateMessage(messageData);

      expect(result).toBe(true);
      expect(mockValidateV001).toHaveBeenCalledWith(messageData);
    });

    it("should return true even with error handling options when validation passes", () => {
      const messageData = createBaseMessageData();
      mockValidateV001.mockImplementation(() => {}); // No throw = success

      const result = validateMessage(messageData, {
        logError: true,
        throwError: true,
      });

      expect(result).toBe(true);
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle null messageData", () => {
      const result = validateMessage(null as any, { throwError: false });

      expect(result).toBe(false);
    });

    it("should handle undefined messageData", () => {
      const result = validateMessage(undefined as any, { throwError: false });

      expect(result).toBe(false);
    });

    it("should handle messageData without version property", () => {
      const messageData = createBaseMessageData();
      delete (messageData as any).version;

      const result = validateMessage(messageData, { throwError: false });

      expect(result).toBe(false);
    });

    it("should handle empty options object", () => {
      const messageData = createBaseMessageData();
      mockValidateV001.mockImplementation(() => {}); // No throw = success

      const result = validateMessage(messageData, {});

      expect(result).toBe(true);
    });

    it("should handle partial options object", () => {
      const messageData = createBaseMessageData();
      const validationError = new Error("Validation failed");
      mockValidateV001.mockImplementation(() => {
        throw validationError;
      });

      const result = validateMessage(messageData, { logError: true });

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(validationError);
    });

    it("should preserve original error properties when throwing", () => {
      const messageData = createBaseMessageData();
      const originalError = new Error("Original validation error");
      originalError.name = "ValidationError";
      (originalError as any).customProperty = "test";

      mockValidateV001.mockImplementation(() => {
        throw originalError;
      });

      try {
        validateMessage(messageData, { throwError: true });
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error).toBe(originalError);
        expect((error as any).customProperty).toBe("test");
        expect((error as Error).name).toBe("ValidationError");
      }
    });
  });

  describe("different error types", () => {
    it("should handle string errors", () => {
      const messageData = createBaseMessageData();
      mockValidateV001.mockImplementation(() => {
        throw "String error";
      });

      const result = validateMessage(messageData, {
        logError: true,
        throwError: false,
      });

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith("String error");
    });

    it("should handle custom error objects", () => {
      const messageData = createBaseMessageData();
      const customError = { message: "Custom error", code: 500 };
      mockValidateV001.mockImplementation(() => {
        throw customError;
      });

      const result = validateMessage(messageData, {
        logError: true,
        throwError: false,
      });

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(customError);
    });
  });

  describe("multiple calls", () => {
    it("should handle multiple successful validations", () => {
      const messageData1 = createBaseMessageData({
        content: { value: "Message 1" },
      });
      const messageData2 = createBaseMessageData({
        content: { value: "Message 2" },
      });

      mockValidateV001.mockImplementation(() => {}); // Always succeed

      const result1 = validateMessage(messageData1);
      const result2 = validateMessage(messageData2);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(mockValidateV001).toHaveBeenCalledTimes(2);
    });

    it("should handle mixed success and failure", () => {
      const messageData1 = createBaseMessageData({
        content: { value: "Message 1" },
      });
      const messageData2 = createBaseMessageData({
        content: { value: "Message 2" },
      });

      mockValidateV001
        .mockImplementationOnce(() => {}) // First call succeeds
        .mockImplementationOnce(() => {
          throw new Error("Second fails");
        }); // Second call fails

      const result1 = validateMessage(messageData1);
      const result2 = validateMessage(messageData2, { throwError: false });

      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });
  });
});
