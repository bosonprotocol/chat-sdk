export function stringifyWithBigInt(
  value: unknown,
  space: string | number = 2,
): string {
  return JSON.stringify(
    value,
    (_key, val) =>
      typeof val === "bigint" ? val.toString() : (val as unknown),
    space,
  );
}
