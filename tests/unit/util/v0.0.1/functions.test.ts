import {
  getAuthorityId,
  isValidThreadId,
  matchThreadIds,
} from "../../../../src/common/util/v0.0.1/functions.js";
import type { ThreadId } from "../../../../src/common/util/v0.0.1/definitions.js";
import { mockThreadId } from "../../../mocks.js";
import { it, expect, describe } from "vitest";

describe("functions", () => {
  it("matchThreadId: Fail on invalid param type", () => {
    const notAThreadId: ThreadId =
      "not a valid thread id" as unknown as ThreadId;
    const threadId: ThreadId = mockThreadId();

    expect(matchThreadIds(notAThreadId, threadId)).toBe(false);
  });

  it("matchThreadId: Fail on matching but invalid params", () => {
    const notAThreadId: ThreadId =
      "not a valid thread id" as unknown as ThreadId;

    expect(matchThreadIds(notAThreadId, notAThreadId)).toBe(false);
  });

  it("matchThreadId: Fail on no match", () => {
    const threadId1: ThreadId = mockThreadId();
    const threadId2: ThreadId = mockThreadId();
    threadId1.exchangeId = "0";
    threadId2.exchangeId = "1";

    expect(matchThreadIds(threadId1, threadId2)).toBe(false);
  });

  it("matchThreadId: Pass on match", () => {
    const threadId1: ThreadId = mockThreadId();
    const threadId2: ThreadId = threadId1;

    expect(matchThreadIds(threadId1, threadId2)).toBe(true);
  });

  it("validThreadId: Fail on invalid type", () => {
    const notAThreadId: ThreadId =
      "not a valid thread id" as unknown as ThreadId;

    expect(isValidThreadId(notAThreadId)).toBe(false);
  });

  it("validThreadId: Pass on match", () => {
    const threadId: ThreadId = mockThreadId();

    expect(isValidThreadId(threadId)).toBe(true);
  });

  it("getAuthorityId: Expect pass", () => {
    const envName = "testing-0x123";
    const authorityId: string = getAuthorityId(envName);

    expect(authorityId).toBe(`bosonprotocol-${envName}`);
  });
});
