import { DecodedMessage } from "@xmtp/browser-sdk";
import { getAuthorityId } from "../../util/v0.0.1/functions";
import { MessageObject } from "../../util/v0.0.1/definitions";

export function isBosonMessage(
  message: DecodedMessage<unknown>,
  getAuthorityIdParams: Parameters<typeof getAuthorityId>
): message is DecodedMessage<MessageObject> {
  return (
    message.contentType.authorityId === getAuthorityId(...getAuthorityIdParams)
  );
}
