import { MessageType, ThreadId } from "./definitions";

/**
 * Validates that input is valid JSON
 * @param data - value to check
 * @returns boolean
 */
export function isJsonString(data: string): boolean {
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
 * @param messageType - value to check
 * @returns boolean
 */
export function isValidMessageType(messageType: MessageType): boolean {
  if (Object.values(MessageType).includes(messageType)) {
    return true;
  }
  return false;
}

/**
 * Validates that inputs are valid ThreadId
 * objects and compares their values
 * @param threadId1 - The first threadId
 * @param threadId2 - The second threadId
 * @returns boolean
 */
export function matchThreadIds(
  threadId1: ThreadId,
  threadId2: ThreadId
): boolean {
  if (validThreadId(threadId1) && validThreadId(threadId2)) {
    if (threadId1.exchangeId === threadId2.exchangeId) {
      if (threadId1.buyerId === threadId2.buyerId) {
        if (threadId1.sellerId === threadId2.sellerId) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Validates that input is a valid ThreadId
 * @param threadId - value to check
 * @returns boolean
 */
export function validThreadId(threadId: ThreadId): boolean {
  if (threadId.exchangeId && threadId.buyerId && threadId.sellerId) {
    return true;
  }
  return false;
}
