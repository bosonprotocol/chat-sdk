// import { ContentTypeId } from "@xmtp/browser-sdk";
import {
  ContentCodec,
  EncodedContent,
  ContentTypeId
} from "@xmtp/content-type-primitives";
import { getAuthorityId } from "../../util/v0.0.1/functions";
import { MessageObject } from "../../util/v0.0.1/definitions";

/**
 * Returns a ContentTypeId which reflects
 * the input value
 * @param envName - environment name (e.g. "production", "test", etc)
 * @returns ContentTypeId
 */
export function ContentTypeBoson(envName: string): ContentTypeId {
  return new ContentTypeId({
    authorityId:
      "bosonprotocol-testing-0x7de418a7ce94debd057c34ebac232e7027634ade", //getAuthorityId(envName),
    typeId: "text",
    versionMajor: 1,
    versionMinor: 0
  });
}

export enum Encoding {
  utf8 = "UTF-8"
}
type ContentType = MessageObject;
export type Parameters = Record<string, string>;
export class BosonCodec implements ContentCodec<ContentType, Parameters> {
  envName: string;

  /**
   * Class constructor
   * @param envName - environment name (e.g. "production", "test", etc)
   */
  constructor(envName: string) {
    this.envName = envName;
  }
  fallback(content: ContentType): string | undefined {
    const fallBackContent = `BPv2 Message; ${content}`;
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
  encode(content: ContentType): EncodedContent<Parameters> {
    return {
      type: ContentTypeBoson(this.envName),
      parameters: {
        encoding: Encoding.utf8
      },
      fallback: this.fallback(content),
      // TODO: original implementation is like this but I dont know why this was working (previous type of ContentType was string but I think that's wrong)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      content: new TextEncoder().encode(content)
    };
  }

  /**
   * Decode input value to string
   * @param content - encoded content
   * @returns string
   */
  decode(content: EncodedContent<Parameters>): ContentType {
    console.log("boson decodec decode", content);
    const encoding = content.parameters.encoding;
    if (encoding && encoding !== Encoding.utf8) {
      throw new Error(`Unrecognised encoding: ${encoding}`);
    }
    // TODO: the decoding is done outside, which IMO is wrong, via decodeMessage
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return new TextDecoder().decode(content.content);
  }
}
