import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Signer as SignerEthers } from "ethers";
import { toBytes } from "viem";
import { commonCreateEOASigner } from "./createSigner.js";

vi.mock("viem", () => ({
  toBytes: vi.fn(),
}));

describe("commonCreateEOASigner", () => {
  let mockEthersSigner: SignerEthers;
  let mockToBytes: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockEthersSigner = {
      signMessage: vi.fn(),
    } as unknown as SignerEthers;

    mockToBytes = vi.mocked(toBytes);
  });

  describe("with identifierKind as string", () => {
    it("should create a signer with correct structure", () => {
      const address = "0x1234567890123456789012345678901234567890" as const;
      const identifierKind = "Ethereum" as const;

      const signer = commonCreateEOASigner(
        address,
        mockEthersSigner,
        identifierKind,
      );

      expect(signer.type).toBe("EOA");
      expect(typeof signer.getIdentifier).toBe("function");
      expect(typeof signer.signMessage).toBe("function");
    });

    it("should return correct identifier with lowercase address", () => {
      const address = "0xABCDEF1234567890123456789012345678901234" as const;
      const identifierKind = "Ethereum" as const;

      const signer = commonCreateEOASigner(
        address,
        mockEthersSigner,
        identifierKind,
      );
      const identifier = signer.getIdentifier();

      expect(identifier.identifier).toBe(address.toLowerCase());
      expect(identifier.identifierKind).toBe(identifierKind);
    });

    it("should handle mixed case addresses correctly", () => {
      const testCases = [
        "0xAbCdEf1234567890123456789012345678901234",
        "0xABCDEF1234567890123456789012345678901234",
        "0xabcdef1234567890123456789012345678901234",
      ] as const;

      testCases.forEach((address) => {
        const signer = commonCreateEOASigner(
          address,
          mockEthersSigner,
          "Ethereum",
        );
        const identifier = signer.getIdentifier();

        expect(identifier.identifier).toBe(address.toLowerCase());
      });
    });
  });

  describe("with identifierKind as number", () => {
    it("should create a signer with numeric identifier kind", () => {
      const address = "0x1234567890123456789012345678901234567890" as const;
      const identifierKind = 0 as const;

      const signer = commonCreateEOASigner(
        address,
        mockEthersSigner,
        identifierKind,
      );
      const identifier = signer.getIdentifier();

      expect(identifier.identifier).toBe(address.toLowerCase());
      expect(identifier.identifierKind).toBe(0);
    });
  });

  describe("signMessage functionality", () => {
    it("should sign a message and convert to bytes", async () => {
      const address = "0x1234567890123456789012345678901234567890" as const;
      const message = "Hello, XMTP!";
      const signature = "0xsignature...";
      const expectedBytes = new Uint8Array([1, 2, 3, 4]);

      mockEthersSigner.signMessage = vi.fn().mockResolvedValue(signature);
      mockToBytes.mockReturnValue(expectedBytes);

      const signer = commonCreateEOASigner(
        address,
        mockEthersSigner,
        "Ethereum",
      );
      const result = await signer.signMessage(message);

      expect(mockEthersSigner.signMessage).toHaveBeenCalledWith(message);
      expect(mockToBytes).toHaveBeenCalledWith(signature);
      expect(result).toBe(expectedBytes);
    });

    it("should handle empty message", async () => {
      const address = "0x1234567890123456789012345678901234567890" as const;
      const message = "";
      const signature = "0xemptysignature";
      const expectedBytes = new Uint8Array([]);

      mockEthersSigner.signMessage = vi.fn().mockResolvedValue(signature);
      mockToBytes.mockReturnValue(expectedBytes);

      const signer = commonCreateEOASigner(
        address,
        mockEthersSigner,
        "Ethereum",
      );
      const result = await signer.signMessage(message);

      expect(mockEthersSigner.signMessage).toHaveBeenCalledWith(message);
      expect(result).toBe(expectedBytes);
    });

    it("should handle long messages", async () => {
      const address = "0x1234567890123456789012345678901234567890" as const;
      const longMessage = "A".repeat(1000);
      const signature = "0xlongsignature";
      const expectedBytes = new Uint8Array([5, 6, 7, 8]);

      mockEthersSigner.signMessage = vi.fn().mockResolvedValue(signature);
      mockToBytes.mockReturnValue(expectedBytes);

      const signer = commonCreateEOASigner(
        address,
        mockEthersSigner,
        "Ethereum",
      );
      const result = await signer.signMessage(longMessage);

      expect(mockEthersSigner.signMessage).toHaveBeenCalledWith(longMessage);
      expect(result).toBe(expectedBytes);
    });

    it("should propagate errors from ethers signer", async () => {
      const address = "0x1234567890123456789012345678901234567890" as const;
      const message = "Test message";
      const error = new Error("Signing failed");

      mockEthersSigner.signMessage = vi.fn().mockRejectedValue(error);

      const signer = commonCreateEOASigner(
        address,
        mockEthersSigner,
        "Ethereum",
      );

      await expect(signer.signMessage(message)).rejects.toThrow(
        "Signing failed",
      );
      expect(mockEthersSigner.signMessage).toHaveBeenCalledWith(message);
    });

    it("should propagate errors from toBytes conversion", async () => {
      const address = "0x1234567890123456789012345678901234567890" as const;
      const message = "Test message";
      const signature = "0xinvalidsignature";
      const error = new Error("Invalid bytes conversion");

      mockEthersSigner.signMessage = vi.fn().mockResolvedValue(signature);
      mockToBytes.mockImplementation(() => {
        throw error;
      });

      const signer = commonCreateEOASigner(
        address,
        mockEthersSigner,
        "Ethereum",
      );

      await expect(signer.signMessage(message)).rejects.toThrow(
        "Invalid bytes conversion",
      );
    });
  });

  describe("edge cases", () => {
    it("should handle zero address", () => {
      const zeroAddress = "0x0000000000000000000000000000000000000000" as const;

      const signer = commonCreateEOASigner(
        zeroAddress,
        mockEthersSigner,
        "Ethereum",
      );
      const identifier = signer.getIdentifier();

      expect(identifier.identifier).toBe(zeroAddress);
      expect(signer.type).toBe("EOA");
    });

    it("should handle maximum address value", () => {
      const maxAddress = "0xffffffffffffffffffffffffffffffffffffffff" as const;

      const signer = commonCreateEOASigner(
        maxAddress,
        mockEthersSigner,
        "Ethereum",
      );
      const identifier = signer.getIdentifier();

      expect(identifier.identifier).toBe(maxAddress);
    });
  });

  describe("type safety", () => {
    it("should accept both string and numeric identifier kinds", () => {
      const address = "0x1234567890123456789012345678901234567890" as const;

      // Should compile without errors
      const signer1 = commonCreateEOASigner(
        address,
        mockEthersSigner,
        "Ethereum",
      );
      const signer2 = commonCreateEOASigner(address, mockEthersSigner, 0);

      expect(signer1.getIdentifier().identifierKind).toBe("Ethereum");
      expect(signer2.getIdentifier().identifierKind).toBe(0);
    });
  });
});
