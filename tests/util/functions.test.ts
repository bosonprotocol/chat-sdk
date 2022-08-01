import {
  isJsonString,
  isValidMessageType,
  matchThreadIds,
  validThreadId
} from "../../src/util/functions";
import { MessageType, ThreadId } from "../../src/util/definitions";
import { mockThreadId, validJsonString } from "../mocks";

describe("functions", () => {
  test("isJsonString: Fail on invalid input", () => {
    const shouldBeJson: string = "not valid json";
    expect(isJsonString(shouldBeJson)).toBe(false);
  });

  test("isJsonString: Pass on valid input", () => {
    const shouldBeJson: string = validJsonString();
    expect(isJsonString(shouldBeJson)).toBe(true);
  });

  test("isValidMessageType: Fail on invalid input", () => {
    const shouldBeMessageType: MessageType =
      "not a valid message type" as MessageType;
    expect(isValidMessageType(shouldBeMessageType)).toBe(false);
  });

  test("isValidMessageType: Pass on valid types", () => {
    for (const validType of Object.values(MessageType)) {
      expect(isValidMessageType(validType)).toBe(true);
    }
  });

  test("matchThreadId: Fail on invalid param type", () => {
    const notAThreadId: ThreadId =
      "not a valid thread id" as unknown as ThreadId;
    const threadId: ThreadId = mockThreadId();

    expect(matchThreadIds(notAThreadId, threadId)).toBe(false);
  });

  test("matchThreadId: Fail on matching but invalid params", () => {
    const notAThreadId: ThreadId =
      "not a valid thread id" as unknown as ThreadId;

    expect(matchThreadIds(notAThreadId, notAThreadId)).toBe(false);
  });

  test("matchThreadId: Fail on no match", () => {
    const threadId1: ThreadId = mockThreadId();
    const threadId2: ThreadId = mockThreadId();
    threadId1.exchangeId = "0";
    threadId2.exchangeId = "1";

    expect(matchThreadIds(threadId1, threadId2)).toBe(false);
  });

  test("matchThreadId: Pass on match", () => {
    const threadId1: ThreadId = mockThreadId();
    const threadId2: ThreadId = threadId1;

    expect(matchThreadIds(threadId1, threadId2)).toBe(true);
  });

  test("validThreadId: Fail on invalid type", () => {
    const notAThreadId: ThreadId =
      "not a valid thread id" as unknown as ThreadId;

    expect(validThreadId(notAThreadId)).toBe(false);
  });

  test("validThreadId: Pass on match", () => {
    const threadId: ThreadId = mockThreadId();

    expect(validThreadId(threadId)).toBe(true);
  });
});
