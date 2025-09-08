// import { ContentTypeId } from "@xmtp/browser-sdk";
import {
  ContentCodec,
  EncodedContent,
  ContentTypeId
} from "@xmtp/content-type-primitives";
import { AuthorityIdEnvName, getAuthorityId } from "../util/v0.0.1/functions";
import { MessageObject } from "../util/v0.0.1/definitions";
import { validateMessage } from "../util/validators";

/**
 * Returns a ContentTypeId which reflects
 * the input value
 * @param envName - environment name (e.g. "production-0x123", "testing-0x123", etc)
 * @returns ContentTypeId
 */
export function ContentTypeBoson(envName: AuthorityIdEnvName): ContentTypeId {
  return new ContentTypeId({
    authorityId: getAuthorityId(envName),
    typeId: "text",
    versionMajor: 1,
    versionMinor: 0
  });
}

type ContentType = MessageObject;
export type BosonCodecParameters = Record<string, string>;
export class BosonCodec
  implements ContentCodec<ContentType, BosonCodecParameters>
{
  envName: AuthorityIdEnvName;

  /**
   * Class constructor
   * @param envName - environment name (e.g. "production-0x123", "testing-0x123", etc)
   */
  constructor(envName: AuthorityIdEnvName) {
    this.envName = envName;
  }
  fallback(content: ContentType): string | undefined {
    const fallBackContent = `BPv2 Message; ${JSON.stringify(content)}`;
    return fallBackContent;
  }

  shouldPush(): boolean {
    return true;
  }

  /**
   * Get the ContentTypeId value from the
   * codec instance
   * @returns ContentTypeId
   */
  get contentType(): ContentTypeId {
    return ContentTypeBoson(this.envName);
  }

  /**
   * Encode input value
   * @param content - value to encode
   * @returns EncodedContent
   */
  encode(content: ContentType): EncodedContent<BosonCodecParameters> {
    return {
      type: ContentTypeBoson(this.envName),
      parameters: {},
      fallback: this.fallback(content),
      content: new TextEncoder().encode(JSON.stringify(content))
    };
  }

  /**
   * Decode input value to MessageObject
   * @param content - encoded content
   * @returns MessageObject
   */
  decode(content: EncodedContent<BosonCodecParameters>): ContentType {
    const string = new TextDecoder().decode(content.content);
    const messageObject = JSON.parse(string);
    validateMessage(messageObject, {
      throwError: true,
      logError: true
    });
    return messageObject;
  }
}
