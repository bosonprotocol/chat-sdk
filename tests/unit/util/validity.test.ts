import { MessageType, ThreadId } from "../../../src/util/v0.0.1/types";
import {
  isValidJsonString,
  isValidMessageType,
  isValidThreadId
} from "../../../src/util/validity";
import { mockJsonString, mockThreadId } from "../../mocks";

describe("helper functions", () => {
  test("isValidJsonString(): Fail on invalid input", () => {
    const shouldBeJson = "not valid json";
    expect(isValidJsonString(shouldBeJson)).toBe(false);
  });

  test("isValidJsonString(): Pass on valid input", () => {
    const shouldBeJson: string = mockJsonString();
    expect(isValidJsonString(shouldBeJson)).toBe(true);
  });

  test("isValidMessageType(): Fail on invalid input", () => {
    const shouldBeMessageType: MessageType =
      "not a valid message type" as MessageType;
    expect(isValidMessageType(shouldBeMessageType)).toBe(false);
  });

  test("isValidMessageType(): Pass on valid types", () => {
    for (const validType of Object.values(MessageType)) {
      expect(isValidMessageType(validType)).toBe(true);
    }
  });

  test("isValidThreadId(): Fail on invalid type", () => {
    const notAThreadId: ThreadId =
      "not a valid thread id" as unknown as ThreadId;

    expect(isValidThreadId(notAThreadId)).toBe(false);
  });

  test("isValidThreadId(): Pass on match", () => {
    const threadId: ThreadId = mockThreadId();

    expect(isValidThreadId(threadId)).toBe(true);
  });
});
