import { MessageType, ThreadId } from "./types";

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
  if (Object.values(MessageType).includes(messageType)) {
    return true;
  }
  return false;
}

/**
 * Validates that input is a valid ThreadId
 * @param threadId - {@link ThreadId}
 * @returns boolean
 */
export function isValidThreadId(threadId: ThreadId): boolean {
  return !!threadId.exchangeId && !!threadId.buyerId && !!threadId.sellerId;
}
