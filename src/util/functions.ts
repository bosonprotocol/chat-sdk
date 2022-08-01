import { MessageType, ThreadId } from "./definitions";

export function isJsonString(data: string): boolean {
  try {
    JSON.parse(data);
  } catch (e) {
    return false;
  }
  return true;
}

export function isValidMessageType(messageType: MessageType): boolean {
  if (Object.values(MessageType).includes(messageType)) {
    return true;
  }
  return false;
}

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

export function validThreadId(threadId: ThreadId): boolean {
  if (threadId.exchangeId && threadId.buyerId && threadId.sellerId) {
    return true;
  }
  return false;
}
