import { MessageType, ThreadId } from "./definitions";

/**
 * Validates that input is valid JSON
 * @param data - value to check
 * @returns boolean
 */
export function isValidJsonString(data: string): boolean {
  try {
    JSON.parse(data);
  } catch (e) {
    return false;
  }
  return true;
}

/**
 * Validates that input is one of
 * the defined message types
 * @param messageType - {@link MessageType}
 * @returns boolean
 */
export function isValidMessageType(messageType: MessageType): boolean {
  return Object.values(MessageType).includes(messageType);
}

/**
 * Validates that input is a valid ThreadId
 * @param threadId - {@link ThreadId}
 * @returns boolean
 */
export function isValidThreadId(threadId: ThreadId): boolean {
  return !!threadId.exchangeId && !!threadId.buyerId && !!threadId.sellerId;
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
