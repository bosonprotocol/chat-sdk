import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  isValidThreadId,
  matchThreadIds,
  getAuthorityId,
  authorityIdEnvNameSchema,
  type AuthorityIdEnvName,
} from "./functions.js";
import type { ThreadId } from "./definitions.js";

// Mock ThreadId type for testing
const createMockThreadId = (
  exchangeId?: string | null,
  buyerId?: string | null,
  sellerId?: string | null,
): ThreadId => ({
  exchangeId: exchangeId as any,
  buyerId: buyerId as any,
  sellerId: sellerId as any,
});

describe("isValidThreadId", () => {
  describe("valid ThreadIds", () => {
    it("should return true for valid ThreadId with all fields present", () => {
      const threadId = createMockThreadId(
        "exchange-123",
        "buyer-456",
        "seller-789",
      );

      expect(isValidThreadId(threadId)).toBe(true);
    });

    it("should return true for ThreadId with non-empty string values", () => {
      const threadId = createMockThreadId("1", "2", "3");

      expect(isValidThreadId(threadId)).toBe(true);
    });

    it("should return true for ThreadId with long string values", () => {
      const threadId = createMockThreadId(
        "very-long-exchange-id-with-many-characters",
        "very-long-buyer-id-with-many-characters",
        "very-long-seller-id-with-many-characters",
      );

      expect(isValidThreadId(threadId)).toBe(true);
    });

    it("should return true for ThreadId with special characters", () => {
      const threadId = createMockThreadId(
        "exchange-123_test@example.com",
        "buyer-456#special",
        "seller-789$premium",
      );

      expect(isValidThreadId(threadId)).toBe(true);
    });
  });

  describe("invalid ThreadIds", () => {
    it("should return false when exchangeId is missing", () => {
      const threadId = createMockThreadId(null, "buyer-456", "seller-789");

      expect(isValidThreadId(threadId)).toBe(false);
    });

    it("should return false when buyerId is missing", () => {
      const threadId = createMockThreadId("exchange-123", null, "seller-789");

      expect(isValidThreadId(threadId)).toBe(false);
    });

    it("should return false when sellerId is missing", () => {
      const threadId = createMockThreadId("exchange-123", "buyer-456", null);

      expect(isValidThreadId(threadId)).toBe(false);
    });

    it("should return false when exchangeId is empty string", () => {
      const threadId = createMockThreadId("", "buyer-456", "seller-789");

      expect(isValidThreadId(threadId)).toBe(false);
    });

    it("should return false when buyerId is empty string", () => {
      const threadId = createMockThreadId("exchange-123", "", "seller-789");

      expect(isValidThreadId(threadId)).toBe(false);
    });

    it("should return false when sellerId is empty string", () => {
      const threadId = createMockThreadId("exchange-123", "buyer-456", "");

      expect(isValidThreadId(threadId)).toBe(false);
    });

    it("should return false when all fields are missing", () => {
      const threadId = createMockThreadId(null, null, null);

      expect(isValidThreadId(threadId)).toBe(false);
    });

    it("should return false when all fields are empty strings", () => {
      const threadId = createMockThreadId("", "", "");

      expect(isValidThreadId(threadId)).toBe(false);
    });

    it("should return false when exchangeId is undefined", () => {
      const threadId = createMockThreadId(undefined, "buyer-456", "seller-789");

      expect(isValidThreadId(threadId)).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle whitespace-only strings as invalid", () => {
      const threadId = createMockThreadId("   ", "buyer-456", "seller-789");

      expect(isValidThreadId(threadId)).toBe(false);
    });

    it("should handle numeric values as strings", () => {
      const threadId = createMockThreadId("123", "456", "789");

      expect(isValidThreadId(threadId)).toBe(true);
    });
  });
});

describe("matchThreadIds", () => {
  describe("matching ThreadIds", () => {
    it("should return true for identical valid ThreadIds", () => {
      const threadId1 = createMockThreadId(
        "exchange-123",
        "buyer-456",
        "seller-789",
      );
      const threadId2 = createMockThreadId(
        "exchange-123",
        "buyer-456",
        "seller-789",
      );

      expect(matchThreadIds(threadId1, threadId2)).toBe(true);
    });

    it("should return true for ThreadIds with same values but created separately", () => {
      const threadId1 = createMockThreadId("ex1", "by1", "se1");
      const threadId2 = createMockThreadId("ex1", "by1", "se1");

      expect(matchThreadIds(threadId1, threadId2)).toBe(true);
    });

    it("should be case sensitive for matching", () => {
      const threadId1 = createMockThreadId(
        "Exchange-123",
        "Buyer-456",
        "Seller-789",
      );
      const threadId2 = createMockThreadId(
        "exchange-123",
        "buyer-456",
        "seller-789",
      );

      expect(matchThreadIds(threadId1, threadId2)).toBe(false);
    });
  });

  describe("non-matching ThreadIds", () => {
    it("should return false when exchangeIds differ", () => {
      const threadId1 = createMockThreadId(
        "exchange-123",
        "buyer-456",
        "seller-789",
      );
      const threadId2 = createMockThreadId(
        "exchange-456",
        "buyer-456",
        "seller-789",
      );

      expect(matchThreadIds(threadId1, threadId2)).toBe(false);
    });

    it("should return false when buyerIds differ", () => {
      const threadId1 = createMockThreadId(
        "exchange-123",
        "buyer-456",
        "seller-789",
      );
      const threadId2 = createMockThreadId(
        "exchange-123",
        "buyer-789",
        "seller-789",
      );

      expect(matchThreadIds(threadId1, threadId2)).toBe(false);
    });

    it("should return false when sellerIds differ", () => {
      const threadId1 = createMockThreadId(
        "exchange-123",
        "buyer-456",
        "seller-789",
      );
      const threadId2 = createMockThreadId(
        "exchange-123",
        "buyer-456",
        "seller-456",
      );

      expect(matchThreadIds(threadId1, threadId2)).toBe(false);
    });

    it("should return false when all fields differ", () => {
      const threadId1 = createMockThreadId(
        "exchange-123",
        "buyer-456",
        "seller-789",
      );
      const threadId2 = createMockThreadId(
        "exchange-abc",
        "buyer-def",
        "seller-xyz",
      );

      expect(matchThreadIds(threadId1, threadId2)).toBe(false);
    });
  });

  describe("invalid ThreadIds", () => {
    it("should return false when first ThreadId is invalid", () => {
      const threadId1 = createMockThreadId(null, "buyer-456", "seller-789");
      const threadId2 = createMockThreadId(
        "exchange-123",
        "buyer-456",
        "seller-789",
      );

      expect(matchThreadIds(threadId1, threadId2)).toBe(false);
    });

    it("should return false when second ThreadId is invalid", () => {
      const threadId1 = createMockThreadId(
        "exchange-123",
        "buyer-456",
        "seller-789",
      );
      const threadId2 = createMockThreadId("exchange-123", null, "seller-789");

      expect(matchThreadIds(threadId1, threadId2)).toBe(false);
    });

    it("should return false when both ThreadIds are invalid", () => {
      const threadId1 = createMockThreadId(null, null, null);
      const threadId2 = createMockThreadId("", "", "");

      expect(matchThreadIds(threadId1, threadId2)).toBe(false);
    });

    it("should return false when ThreadIds have matching values but one is invalid", () => {
      const threadId1 = createMockThreadId("exchange-123", "buyer-456", "");
      const threadId2 = createMockThreadId("exchange-123", "buyer-456", "");

      expect(matchThreadIds(threadId1, threadId2)).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle whitespace differences", () => {
      const threadId1 = createMockThreadId(
        "exchange-123",
        "buyer-456",
        "seller-789",
      );
      const threadId2 = createMockThreadId(
        "exchange-123 ",
        "buyer-456",
        "seller-789",
      );

      expect(matchThreadIds(threadId1, threadId2)).toBe(false);
    });

    it("should handle special characters correctly", () => {
      const threadId1 = createMockThreadId("ex@123", "by#456", "se$789");
      const threadId2 = createMockThreadId("ex@123", "by#456", "se$789");

      expect(matchThreadIds(threadId1, threadId2)).toBe(true);
    });
  });
});

describe("authorityIdEnvNameSchema", () => {
  describe("valid environment names", () => {
    it("should validate local environment with wallet address", () => {
      const validNames = [
        "local-0x1234567890abcdef1234567890abcdef12345678",
        "local-0xABCDEF1234567890ABCDEF1234567890ABCDEF12",
        "local-0x0000000000000000000000000000000000000000",
        "local-0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
      ];

      validNames.forEach((name) => {
        expect(() => authorityIdEnvNameSchema.parse(name)).not.toThrow();
      });
    });

    it("should validate testing environment with wallet address", () => {
      const result = authorityIdEnvNameSchema.parse(
        "testing-0x1234567890abcdef1234567890abcdef12345678",
      );
      expect(result).toBe("testing-0x1234567890abcdef1234567890abcdef12345678");
    });

    it("should validate staging environment with wallet address", () => {
      const result = authorityIdEnvNameSchema.parse(
        "staging-0x1234567890abcdef1234567890abcdef12345678",
      );
      expect(result).toBe("staging-0x1234567890abcdef1234567890abcdef12345678");
    });

    it("should validate production environment with wallet address", () => {
      const result = authorityIdEnvNameSchema.parse(
        "production-0x1234567890abcdef1234567890abcdef12345678",
      );
      expect(result).toBe(
        "production-0x1234567890abcdef1234567890abcdef12345678",
      );
    });

    it("should accept mixed case in wallet addresses", () => {
      const validAddresses = [
        "production-0xAbCdEf1234567890aBcDeF1234567890AbCdEf12",
        "local-0x1a2B3c4D5e6F7890123456789aBcDeF123456789",
      ];

      validAddresses.forEach((addr) => {
        expect(() => authorityIdEnvNameSchema.parse(addr)).not.toThrow();
      });
    });
  });

  describe("invalid environment names", () => {
    it("should reject invalid environment names", () => {
      const invalidEnvs = [
        "development-0x1234567890abcdef1234567890abcdef12345678",
        "prod-0x1234567890abcdef1234567890abcdef12345678",
        "test-0x1234567890abcdef1234567890abcdef12345678",
        "invalid-0x1234567890abcdef1234567890abcdef12345678",
      ];

      invalidEnvs.forEach((env) => {
        expect(() => authorityIdEnvNameSchema.parse(env)).toThrow();
      });
    });

    it("should reject missing wallet address", () => {
      const invalidFormats = [
        "local-",
        "testing-0x",
        "staging",
        "production-wallet",
      ];

      invalidFormats.forEach((format) => {
        expect(() => authorityIdEnvNameSchema.parse(format)).toThrow();
      });
    });

    it("should reject empty strings and invalid formats", () => {
      const invalidInputs = [
        "",
        "local",
        "0x1234567890abcdef1234567890abcdef12345678",
        "local_0x1234567890abcdef1234567890abcdef12345678", // underscore instead of hyphen
        "local 0x1234567890abcdef1234567890abcdef12345678", // space instead of hyphen
      ];

      invalidInputs.forEach((input) => {
        expect(() => authorityIdEnvNameSchema.parse(input)).toThrow();
      });
    });
  });

  describe("error messages", () => {
    it("should provide helpful error message for invalid format", () => {
      try {
        authorityIdEnvNameSchema.parse("invalid-format");
      } catch (error) {
        expect(error).toBeInstanceOf(z.ZodError);
        const zodError = error as z.ZodError;
        expect(zodError.errors[0].message).toContain(
          "Must be in the format {environment}-{walletAddress}",
        );
        expect(zodError.errors[0].message).toContain("production-0x1234");
      }
    });
  });
});

describe("getAuthorityId", () => {
  describe("valid inputs", () => {
    it("should generate authority ID for local environment", () => {
      const envName =
        "local-0x1234567890abcdef1234567890abcdef12345678" as const;
      const result = getAuthorityId(envName);

      expect(result).toBe(
        "bosonprotocol-local-0x1234567890abcdef1234567890abcdef12345678",
      );
    });

    it("should generate authority ID for testing environment", () => {
      const envName =
        "testing-0x1234567890abcdef1234567890abcdef12345678" as const;
      const result = getAuthorityId(envName);

      expect(result).toBe(
        "bosonprotocol-testing-0x1234567890abcdef1234567890abcdef12345678",
      );
    });

    it("should generate authority ID for staging environment", () => {
      const envName =
        "staging-0x1234567890abcdef1234567890abcdef12345678" as const;
      const result = getAuthorityId(envName);

      expect(result).toBe(
        "bosonprotocol-staging-0x1234567890abcdef1234567890abcdef12345678",
      );
    });

    it("should generate authority ID for production environment", () => {
      const envName =
        "production-0x1234567890abcdef1234567890abcdef12345678" as const;
      const result = getAuthorityId(envName);

      expect(result).toBe(
        "bosonprotocol-production-0x1234567890abcdef1234567890abcdef12345678",
      );
    });

    it("should handle different wallet addresses", () => {
      const testCases = [
        {
          input:
            "production-0x0000000000000000000000000000000000000000" as const,
          expected:
            "bosonprotocol-production-0x0000000000000000000000000000000000000000",
        },
        {
          input: "local-0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF" as const,
          expected:
            "bosonprotocol-local-0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        },
        {
          input: "testing-0xAbCdEf1234567890aBcDeF1234567890AbCdEf12" as const,
          expected:
            "bosonprotocol-testing-0xAbCdEf1234567890aBcDeF1234567890AbCdEf12",
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getAuthorityId(input)).toBe(expected);
      });
    });
  });

  describe("return value format", () => {
    it('should always prefix with "bosonprotocol-"', () => {
      const envName =
        "production-0x1234567890abcdef1234567890abcdef12345678" as const;
      const result = getAuthorityId(envName);

      expect(result.startsWith("bosonprotocol-")).toBe(true);
    });

    it("should preserve the original environment name after prefix", () => {
      const envName =
        "staging-0xABCDEF1234567890ABCDEF1234567890ABCDEF12" as const;
      const result = getAuthorityId(envName);

      expect(result).toBe(`bosonprotocol-${envName}`);
    });

    it("should return string type", () => {
      const envName =
        "local-0x1234567890abcdef1234567890abcdef12345678" as const;
      const result = getAuthorityId(envName);

      expect(typeof result).toBe("string");
    });
  });
});

describe("AuthorityIdEnvName type", () => {
  it("should correctly type the parameter for getAuthorityId", () => {
    // This test ensures the type is working correctly at compile time
    const validEnvName: AuthorityIdEnvName =
      "production-0x1234567890abcdef1234567890abcdef12345678";

    // Should compile without errors
    const result = getAuthorityId(validEnvName);
    expect(result).toContain("bosonprotocol-");
  });
});

describe("integration tests", () => {
  it("should validate schema before using getAuthorityId", () => {
    const envName = "production-0x1234567890abcdef1234567890abcdef12345678";

    // Validate with schema first
    const validatedEnvName = authorityIdEnvNameSchema.parse(envName);

    // Then use with getAuthorityId
    const result = getAuthorityId(validatedEnvName as AuthorityIdEnvName);

    expect(result).toBe(
      "bosonprotocol-production-0x1234567890abcdef1234567890abcdef12345678",
    );
  });

  it("should work with all combinations of environments and addresses", () => {
    const environments = ["local", "testing", "staging", "production"] as const;
    const addresses = [
      "0x1234567890abcdef1234567890abcdef12345678",
      "0x0000000000000000000000000000000000000000",
      "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
    ];

    environments.forEach((env) => {
      addresses.forEach((addr) => {
        const envName = `${env}-${addr}` as AuthorityIdEnvName;

        // Should validate
        expect(() => authorityIdEnvNameSchema.parse(envName)).not.toThrow();

        // Should generate correct authority ID
        const result = getAuthorityId(envName);
        expect(result).toBe(`bosonprotocol-${envName}`);
      });
    });
  });
});
