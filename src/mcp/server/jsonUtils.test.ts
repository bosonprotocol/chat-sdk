import { describe, it, expect } from "vitest";
import { stringifyWithBigInt } from "./jsonUtils.js";

describe("stringifyWithBigInt", () => {
  it("should stringify regular objects normally", () => {
    const obj = { name: "test", value: 42, active: true };
    const result = stringifyWithBigInt(obj);
    expect(result).toBe(JSON.stringify(obj, null, 2));
  });

  it("should convert BigInt values to strings", () => {
    const obj = { amount: BigInt(123456789012345) };
    const result = stringifyWithBigInt(obj);
    const expected = JSON.stringify({ amount: "123456789012345" }, null, 2);
    expect(result).toBe(expected);
  });

  it("should handle nested objects with BigInt", () => {
    const obj = {
      user: { id: 1, name: "Alice" },
      transaction: { amount: BigInt(999999999999999), fee: BigInt(1000) },
      timestamp: Date.now(),
    };
    const result = stringifyWithBigInt(obj);
    const parsed = JSON.parse(result);

    expect(parsed.transaction.amount).toBe("999999999999999");
    expect(parsed.transaction.fee).toBe("1000");
    expect(parsed.user.name).toBe("Alice");
  });

  it("should handle arrays with BigInt values", () => {
    const arr = [1, BigInt(42), "string", { value: BigInt(100) }];
    const result = stringifyWithBigInt(arr);
    const parsed = JSON.parse(result);

    expect(parsed[0]).toBe(1);
    expect(parsed[1]).toBe("42");
    expect(parsed[2]).toBe("string");
    expect(parsed[3].value).toBe("100");
  });

  it("should handle mixed data types", () => {
    const obj = {
      string: "hello",
      number: 123,
      boolean: true,
      null_value: null,
      bigint_value: BigInt(987654321),
      array: [BigInt(1), BigInt(2), "normal"],
      nested: {
        deep_bigint: BigInt(555),
      },
    };
    const result = stringifyWithBigInt(obj);
    const parsed = JSON.parse(result);

    expect(parsed.bigint_value).toBe("987654321");
    expect(parsed.array[0]).toBe("1");
    expect(parsed.array[1]).toBe("2");
    expect(parsed.array[2]).toBe("normal");
    expect(parsed.nested.deep_bigint).toBe("555");
    expect(parsed.string).toBe("hello");
  });

  it("should handle custom spacing parameter", () => {
    const obj = { bigint: BigInt(123) };

    const result4Spaces = stringifyWithBigInt(obj, 4);
    const result0Spaces = stringifyWithBigInt(obj, 0);
    const resultTabSpacing = stringifyWithBigInt(obj, "\t");

    expect(result4Spaces.includes("    ")).toBe(true); // 4 spaces
    expect(result0Spaces.includes(" ")).toBe(false); // no spaces
    expect(resultTabSpacing.includes("\t")).toBe(true); // tab character
  });

  it("should handle empty objects and arrays", () => {
    expect(stringifyWithBigInt({})).toBe("{}");
    expect(stringifyWithBigInt([])).toBe("[]");
    expect(stringifyWithBigInt({ empty: {} })).toBe(
      JSON.stringify({ empty: {} }, null, 2),
    );
  });

  it("should handle primitive values", () => {
    expect(stringifyWithBigInt("string")).toBe('"string"');
    expect(stringifyWithBigInt(42)).toBe("42");
    expect(stringifyWithBigInt(true)).toBe("true");
    expect(stringifyWithBigInt(null)).toBe("null");
    expect(stringifyWithBigInt(BigInt(999))).toBe('"999"');
  });

  it("should handle undefined values (JSON.stringify behavior)", () => {
    const obj = { defined: "value", undefined: undefined };
    const result = stringifyWithBigInt(obj);
    const parsed = JSON.parse(result);

    expect(parsed.defined).toBe("value");
    expect("undefined" in parsed).toBe(false); // undefined properties are omitted
  });

  it("should handle very large BigInt values", () => {
    const largeBigInt = BigInt(
      "12345678901234567890123456789012345678901234567890",
    );
    const obj = { large: largeBigInt };
    const result = stringifyWithBigInt(obj);
    const parsed = JSON.parse(result);

    expect(parsed.large).toBe(
      "12345678901234567890123456789012345678901234567890",
    );
  });
});
