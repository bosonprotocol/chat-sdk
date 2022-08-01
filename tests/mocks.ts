import { ThreadId } from "../src/util/definitions";

export function mockThreadId(): ThreadId {
  const threadId: ThreadId = {
    exchangeId: randomId(),
    buyerId: randomId(),
    sellerId: randomId()
  };

  return threadId;
}

function randomId(): string {
  return Math.floor(Math.random() * 100).toString();
}

export function validJsonString(): string {
  return '{"valid":"value"}';
}
