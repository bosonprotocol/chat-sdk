import type { EncodedContent } from "@xmtp/content-type-primitives";
import { ContentTypeId } from "@xmtp/content-type-primitives";

import { getAuthorityId } from "../util/v0.0.1/functions.js";
import type { BosonCodecParameters } from "./boson-codec.js";
import { BosonCodec, ContentTypeBoson } from "./boson-codec.js";
import { mockEncodedContent, mockMessageObject } from "../../../tests/mocks.js";
import { describe, it, expect } from "vitest";
import { MessageType } from "../util/v0.0.1/definitions.js";

describe("boson-codec", () => {
  const envName = "testing-0x123";

  it("ContentTypeBoson: Pass on valid input", () => {
    const contentType: ContentTypeId = ContentTypeBoson(envName);
    expect(contentType instanceof ContentTypeId).toBe(true);
    expect(contentType.authorityId).toBe(getAuthorityId(envName));
  });

  it("BosonCodec: Pass on valid construction", () => {
    const bosonCodec: BosonCodec = new BosonCodec(envName);
    expect(bosonCodec instanceof BosonCodec).toBe(true);
    expect(bosonCodec.contentType instanceof ContentTypeId).toBe(true);
    expect(bosonCodec.contentType.authorityId).toBe(getAuthorityId(envName));
  });

  it("BosonCodec encode(): Pass on valid input", () => {
    const encodedContent: EncodedContent<BosonCodecParameters> =
      mockEncodedContent(envName);
    expect(encodedContent.type).toBeInstanceOf(ContentTypeId);
    expect(encodedContent.parameters).not.toBeNull();
    expect(encodedContent.content).not.toBeNull();
  });

  it("BosonCodec decode(): Pass on valid input", () => {
    const encodedContent: EncodedContent<BosonCodecParameters> =
      mockEncodedContent(envName);
    const bosonCodec: BosonCodec = new BosonCodec(envName);
    const decodedMessage = bosonCodec.decode(encodedContent);
    expect(JSON.stringify(decodedMessage)).toMatch(
      JSON.stringify(mockMessageObject(MessageType.String)),
    );
  });
});
