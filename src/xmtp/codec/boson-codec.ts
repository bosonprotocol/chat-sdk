import { ContentTypeId, ContentCodec, EncodedContent } from "@xmtp/xmtp-js";
import { TextDecoder, TextEncoder } from "util";

/**
 * Returns a ContentTypeId which includes the
 * input value
 * @param envName - environment name (e.g. "production", "test", etc)
 * @returns ContentTypeId
 */
export function ContentTypeBoson(envName: string): ContentTypeId {
  return new ContentTypeId({
    authorityId: `bosonprotocol-${envName}`,
    typeId: "text",
    versionMajor: 1,
    versionMinor: 0
  });
}

export enum Encoding {
  utf8 = "UTF-8"
}

export class BosonCodec implements ContentCodec<string> {
  envName: string;

  /**
   * Class constructor
   * @param envName - environment name (e.g. "production", "test", etc)
   */
  constructor(envName: string) {
    this.envName = envName;
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
  encode(content: string): EncodedContent {
    return {
      type: ContentTypeBoson(this.envName),
      parameters: {
        encoding: Encoding.utf8
      },
      content: new TextEncoder().encode(content)
    };
  }

  /**
   * Decode input value to string
   * @param content - encoded content
   * @returns string
   */
  decode(content: EncodedContent): string {
    const encoding = content.parameters.encoding;
    if (encoding && encoding !== Encoding.utf8) {
      throw new Error(`Unrecognised encoding: ${encoding}`);
    }
    return new TextDecoder().decode(content.content);
  }
}
