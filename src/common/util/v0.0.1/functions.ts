import { z } from "zod";

import type { ThreadId } from "./definitions";
/**
 * Validates that input is a valid ThreadId
 * @param threadId - {@link ThreadId}
 * @returns boolean
 */
export function isValidThreadId(threadId: ThreadId): boolean {
  return (
    !!threadId.exchangeId?.trim() &&
    !!threadId.buyerId?.trim() &&
    !!threadId.sellerId?.trim()
  );
}

/**
 * Validates that inputs are valid ThreadId
 * objects and compares their values
 * @param threadId1 - {@link ThreadId}
 * @param threadId2 - {@link ThreadId}
 * @returns boolean
 */
export function matchThreadIds(
  threadId1: ThreadId,
  threadId2: ThreadId,
): boolean {
  return (
    isValidThreadId(threadId1) &&
    isValidThreadId(threadId2) &&
    threadId1.exchangeId === threadId2.exchangeId &&
    threadId1.buyerId === threadId2.buyerId &&
    threadId1.sellerId === threadId2.sellerId
  );
}
export type AuthorityIdEnvName = Parameters<typeof getAuthorityId>[0];

export const authorityIdEnvNameSchema = z
  .string()
  .regex(
    /^(local|testing|staging|production)-0x[a-fA-F0-9]+$/,
    "Must be in the format {environment}-{walletAddress}, e.g. production-0x1234...",
  );
/**
 * Helper function to return Authority ID
 * required by XMTP
 * @param envName - environment name (e.g. "production-0x123", "testing-0x123", etc)
 * @returns string
 */
export function getAuthorityId(
  envName: `${"local" | "testing" | "staging" | "production"}-0x${string}`,
): string {
  return `bosonprotocol-${envName}`;
}
