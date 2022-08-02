import { ContentTypeId, EncodedContent } from "@xmtp/xmtp-js";
import {
  BosonCodec,
  ContentTypeBoson,
  Encoding
} from "../../../src/xmtp/codec/boson-codec";
import { validJsonString } from "../../mocks";

describe("boson-codec", () => {
  const envName = "test";
  test("Import enum definitions", () => {
    expect(Encoding).toBeTruthy();
  });

  test("ContentTypeBoson: Pass on valid input", () => {
    const contentType: ContentTypeId = ContentTypeBoson(envName);
    expect(contentType instanceof ContentTypeId).toBe(true);
    expect(contentType.authorityId).toBe(`bosonprotocol-${envName}`);
  });

  test("BosonCodec: Pass on valid construction", () => {
    const bosonCodec: BosonCodec = new BosonCodec(envName);
    expect(bosonCodec instanceof BosonCodec).toBe(true);
    expect(bosonCodec.contentType instanceof ContentTypeId).toBe(true);
    expect(bosonCodec.contentType.authorityId).toBe(`bosonprotocol-${envName}`);
  });

  test("BosonCodec encode(): Pass on valid input", () => {
    const bosonCodec: BosonCodec = new BosonCodec(envName);
    const validContent: string = validJsonString();
    const encodedContent: EncodedContent = bosonCodec.encode(validContent);
    expect(encodedContent.type).toBeInstanceOf(ContentTypeId);
    expect(encodedContent.parameters).not.toBeNull();
    expect(encodedContent.content).not.toBeNull();
  });

  test.skip("BosonCodec decode(): Pass on valid input", () => {
    // TODO: implement
  });
});
