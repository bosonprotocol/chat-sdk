import { ContentTypeId, EncodedContent } from "@xmtp/content-type-primitives";

import { getAuthorityId } from "../../../../src/util/v0.0.1/functions";
import {
  BosonCodec,
  ContentTypeBoson,
  Encoding,
  Parameters
} from "../../../../src/xmtp/codec/boson-codec";
import { mockEncodedContent, mockJsonString } from "../../../mocks";

describe("boson-codec", () => {
  const envName = "test";
  test("Import enum definitions", () => {
    expect(Encoding).toBeTruthy();
  });

  test("ContentTypeBoson: Pass on valid input", () => {
    const contentType: ContentTypeId = ContentTypeBoson(envName);
    expect(contentType instanceof ContentTypeId).toBe(true);
    expect(contentType.authorityId).toBe(getAuthorityId(envName));
  });

  test("BosonCodec: Pass on valid construction", () => {
    const bosonCodec: BosonCodec = new BosonCodec(envName);
    expect(bosonCodec instanceof BosonCodec).toBe(true);
    expect(bosonCodec.contentType instanceof ContentTypeId).toBe(true);
    expect(bosonCodec.contentType.authorityId).toBe(getAuthorityId(envName));
  });

  test("BosonCodec encode(): Pass on valid input", () => {
    const encodedContent: EncodedContent<Parameters> =
      mockEncodedContent(envName);
    expect(encodedContent.type).toBeInstanceOf(ContentTypeId);
    expect(encodedContent.parameters).not.toBeNull();
    expect(encodedContent.content).not.toBeNull();
  });

  test("BosonCodec decode(): Fail on invalid 'content.parameters.encoding' prop value", () => {
    const encodedContent: EncodedContent<Parameters> =
      mockEncodedContent(envName);
    encodedContent.parameters.encoding = "NOT-UTF-8";
    const bosonCodec: BosonCodec = new BosonCodec(envName);
    const decode = () => {
      return bosonCodec.decode(encodedContent);
    };
    expect(decode).toThrowError(
      `Unrecognised encoding: ${encodedContent.parameters.encoding}`
    );
  });

  test("BosonCodec decode(): Pass on valid input", () => {
    const encodedContent: EncodedContent<Parameters> =
      mockEncodedContent(envName);
    const bosonCodec: BosonCodec = new BosonCodec(envName);
    const decodedMessage = bosonCodec.decode(encodedContent);
    expect(decodedMessage).toMatch(mockJsonString());
  });
});
