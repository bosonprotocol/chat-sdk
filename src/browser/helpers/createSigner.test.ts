import type { Signer as SignerEthers } from "ethers";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as commonHelpers from "../../common/helpers/createSigner.js";
import { createEOASigner } from "./createSigner.js";

vi.mock("../../common/helpers/createSigner", () => ({
  commonCreateEOASigner: vi.fn(),
}));

describe("createEOASigner", () => {
  let mockEthersSigner: SignerEthers;
  let mockCommonCreateEOASigner: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock ethers signer
    mockEthersSigner = {
      signMessage: vi.fn(),
    } as unknown as SignerEthers;

    mockCommonCreateEOASigner = vi.mocked(commonHelpers.commonCreateEOASigner);
  });

  it("should create an EOA signer with correct parameters", () => {
    const address = "0x1234567890123456789012345678901234567890" as const;
    const mockReturnValue = {
      type: "EOA",
      getIdentifier: () => ({
        identifier: address.toLowerCase(),
        identifierKind: "Ethereum",
      }),
      signMessage: vi.fn(),
    };

    mockCommonCreateEOASigner.mockReturnValue(mockReturnValue);

    const result = createEOASigner(address, mockEthersSigner);

    expect(mockCommonCreateEOASigner).toHaveBeenCalledWith(
      address,
      mockEthersSigner,
      "Ethereum",
    );
    expect(mockCommonCreateEOASigner).toHaveBeenCalledTimes(1);
    expect(result).toBe(mockReturnValue);
  });

  it("should handle different valid Ethereum addresses", () => {
    const testAddresses = [
      "0x0000000000000000000000000000000000000000",
      "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
      "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    ] as const;

    testAddresses.forEach((address) => {
      const mockReturnValue = {
        type: "EOA",
        getIdentifier: () => ({
          identifier: address.toLowerCase(),
          identifierKind: "Ethereum",
        }),
        signMessage: vi.fn(),
      };

      mockCommonCreateEOASigner.mockReturnValue(mockReturnValue);

      const result = createEOASigner(address, mockEthersSigner);

      expect(mockCommonCreateEOASigner).toHaveBeenCalledWith(
        address,
        mockEthersSigner,
        "Ethereum",
      );
      expect(result).toBe(mockReturnValue);
    });
  });

  it("should pass through the signer instance correctly", () => {
    const address = "0x1234567890123456789012345678901234567890" as const;
    const mockReturnValue = {
      type: "EOA",
      getIdentifier: () => ({
        identifier: address.toLowerCase(),
        identifierKind: "Ethereum",
      }),
      signMessage: vi.fn(),
    };

    mockCommonCreateEOASigner.mockReturnValue(mockReturnValue);

    createEOASigner(address, mockEthersSigner);

    expect(mockCommonCreateEOASigner).toHaveBeenCalledWith(
      expect.any(String),
      mockEthersSigner,
      expect.any(String),
    );
  });

  it("should type cast the return value as Signer from @xmtp/browser-sdk", () => {
    const address = "0x1234567890123456789012345678901234567890" as const;
    const mockReturnValue = {
      type: "EOA",
      getIdentifier: () => ({
        identifier: address.toLowerCase(),
        identifierKind: "Ethereum",
      }),
      signMessage: vi.fn(),
    };

    mockCommonCreateEOASigner.mockReturnValue(mockReturnValue);

    const result = createEOASigner(address, mockEthersSigner);

    // The result should be typed as Signer from @xmtp/browser-sdk
    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
  });
});
