import type { DecodedMessage } from "@xmtp/node-sdk";

import type { MessageObject } from "../../common/util/v0.0.1/definitions.js";
import { getAuthorityId } from "../../common/util/v0.0.1/functions.js";

export function isBosonMessage(
  message: DecodedMessage<unknown>,
  getAuthorityIdParams: Parameters<typeof getAuthorityId>,
): message is DecodedMessage<MessageObject> {
  return (
    message.contentType?.authorityId === getAuthorityId(...getAuthorityIdParams)
  );
}
