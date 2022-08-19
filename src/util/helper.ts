import { ThreadId } from "./v0.0.1/types";
import { isValidThreadId } from "./validity";

/**
 * Validates that inputs are valid ThreadId
 * objects and compares their values
 * @param threadId1 - {@link ThreadId}
 * @param threadId2 - {@link ThreadId}
 * @returns boolean
 */
export function matchThreadIds(
  threadId1: ThreadId,
  threadId2: ThreadId
): boolean {
  return (
    isValidThreadId(threadId1) &&
    isValidThreadId(threadId2) &&
    threadId1.exchangeId === threadId2.exchangeId &&
    threadId1.buyerId === threadId2.buyerId &&
    threadId1.sellerId === threadId2.sellerId
  );
}

/**
 * Helper function to return Authority ID
 * required by XMTP
 * @param envName - environment name (e.g. "production", "test", etc)
 * @returns string
 */
export function getAuthorityId(envName: string): string {
  return `bosonprotocol-${envName}`;
}
