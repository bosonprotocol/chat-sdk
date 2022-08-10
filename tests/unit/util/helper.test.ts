import { getAuthorityId, matchThreadIds } from "../../../src/util/helper";

import { ThreadId } from "../../../src/util/types";
import { mockThreadId } from "../../mocks";

describe("helper functions", () => {
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

  test("getAuthorityId: Expect pass", () => {
    const envName = "test-local";
    const authorityId: string = getAuthorityId(envName);

    expect(authorityId).toBe(`bosonprotocol-${envName}`);
  });
});
