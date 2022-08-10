import { ContentTypeId, Message } from "@xmtp/xmtp-js";
import { MessageObject } from "../../../src/util/types";
import {
  decodeMessage,
  filterByAuthorityId
} from "../../../src/util/functions";
import { mockXmtpMessage } from "../../mocks";

describe("functions", () => {
  const envName = "test";

  test("decodeMessage(): Fail on invalid 'message.contentType.authorityId' param", () => {
    const message: Message = mockXmtpMessage(envName);
    message.contentType = {
      authorityId: "NOT VALID"
    } as ContentTypeId;

    const decode = () => {
      return decodeMessage(message, envName);
    };
    expect(decode()).toBeUndefined();
  });

  test("decodeMessage(): Fail on invalid 'message.content' param", async () => {
    const message: Message = mockXmtpMessage(envName);
    message.content = "NOT VALID JSON";

    const decode = () => {
      return decodeMessage(message, envName);
    };
    expect(decode()).toBeUndefined();
  });

  test("decodeMessage(): Fail on invalid contentType (i.e. after parsing 'message.content')", async () => {
    const message: Message = mockXmtpMessage(envName);
    message.content = '{"contentType":"value"}';

    const decode = () => {
      return decodeMessage(message, envName);
    };
    expect(decode()).toBeUndefined();
  });

  test("decodeMessage(): Expect pass", async () => {
    const message: Message = mockXmtpMessage(envName);
    message.content = '{"contentType":"STRING"}';

    const decodedMessage: MessageObject = decodeMessage(
      message,
      envName
    ) as MessageObject;
    expect(JSON.stringify(decodedMessage)).toBe(message.content);
  });

  test("filterByAuthorityId(): Expect pass", () => {
    const messages: Message[] = Array(10).fill(mockXmtpMessage(envName));
    const filteredMessages: Message[] = filterByAuthorityId(messages, envName);

    expect(messages.length === filteredMessages.length).toBe(true);
  });
});
