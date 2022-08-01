import { ContentTypeId, ContentCodec, EncodedContent } from "@xmtp/xmtp-js";
import { TextDecoder, TextEncoder } from "util";

export const ContentTypeBoson = (envName: string): ContentTypeId =>
  new ContentTypeId({
    authorityId: `bosonprotocol-${envName}`,
    typeId: "text",
    versionMajor: 1,
    versionMinor: 0
  });

export enum Encoding {
  utf8 = "UTF-8"
}

export class BosonCodec implements ContentCodec<string> {
  envName: string;

  constructor(envName: string) {
    this.envName = envName;
  }

  get contentType(): ContentTypeId {
    return ContentTypeBoson(this.envName);
  }

  encode(content: string): EncodedContent {
    return {
      type: ContentTypeBoson(this.envName),
      parameters: {
        encoding: Encoding.utf8
      },
      content: new TextEncoder().encode(content)
    };
  }

  decode(content: EncodedContent): string {
    const encoding = content.parameters.encoding;
    if (encoding && encoding !== Encoding.utf8) {
      throw new Error(`Unrecognised encoding: ${encoding}`);
    }
    return new TextDecoder().decode(content.content);
  }
}
