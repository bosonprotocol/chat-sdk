import { ContentTypeId, EncodedContent } from "@xmtp/content-type-primitives";

import { getAuthorityId } from "../../../../src/util/v0.0.1/functions";
import {
  BosonCodec,
  ContentTypeBoson,
  BosonCodecParameters
} from "../../../../src/xmtp/codec/boson-codec";
import { mockEncodedContent, mockMessageObject } from "../../../mocks";
import { describe, it, expect } from "vitest";
import { MessageType } from "../../../../src/util/v0.0.1/definitions";

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
      JSON.stringify(mockMessageObject(MessageType.String))
    );
  });
});
