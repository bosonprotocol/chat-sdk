import { Client, EncodedContent, Message, TextCodec } from "@xmtp/xmtp-js";
import { Signer } from "ethers";
import { MessageObject, MessageType, ThreadId } from "../src/util/definitions";
import { BosonCodec } from "../src/xmtp/codec/boson-codec";

export function mockThreadId(random = false): ThreadId {
  return {
    exchangeId: random ? randomId() : "1",
    buyerId: random ? randomId() : "1",
    sellerId: random ? randomId() : "1"
  };
}

function randomId(): string {
  return Math.floor(Math.random() * 100).toString();
}

export function mockJsonString(): string {
  return '{"valid":"value"}';
}

export function mockEncodedContent(envName: string): EncodedContent {
  const bosonCodec: BosonCodec = new BosonCodec(envName);
  const validContent: string = mockJsonString();
  return bosonCodec.encode(validContent);
}

// Not really a mock
export async function mockXmtpClient(
  signer: Signer,
  envName: string
): Promise<Client> {
  return await Client.create(signer, {
    env: envName === "production" ? "production" : "dev",
    codecs: [new TextCodec(), new BosonCodec(envName)]
  });
}

export function nullAddress(): string {
  return "0x0000000000000000000000000000000000000000";
}

export function mockMessageObject(threadId?: ThreadId): MessageObject {
  return {
    threadId: threadId ? threadId : mockThreadId(),
    contentType: MessageType.String,
    version: "1",
    content: {
      value: mockJsonString()
    }
  };
}

export function mockXmtpMessage(envName: string): Message {
  return {
    contentType: {
      authorityId: `bosonprotocol-${envName}`
    },
    content: mockJsonString()
  } as Message;
}
