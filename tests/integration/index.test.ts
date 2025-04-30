import { Client } from "@xmtp/browser-sdk";
import { Wallet } from "ethers";
import { BosonXmtpClient } from "../../src/index";
import {
  MessageData,
  MessageObject,
  MessageType,
  ThreadId,
  ThreadObject
} from "../../src/util/v0.0.1/definitions";
import { matchThreadIds } from "../../src/util/v0.0.1/functions";
import {
  mockMessageObject,
  mockThreadId,
  testXmtpClient,
  nullAddress
} from "../mocks";
import { describe, expect, it, beforeAll } from "vitest";

describe("boson-xmtp-client", () => {
  const envName = "testing-0x";
  let wallet: Wallet;
  let walletAddress: string;
  let client: BosonXmtpClient;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    walletAddress = await wallet.getAddress();
    client = await BosonXmtpClient.initialise(wallet, "dev", envName);
  });

  it("BosonXmtpClient: Pass on valid construction", async () => {
    const client: Client = await testXmtpClient(wallet, envName);
    const bosonXmtpClient: BosonXmtpClient = new BosonXmtpClient(
      wallet,
      client,
      envName,
      "dev"
    );
    expect(bosonXmtpClient.envName).toBe(envName);
  });

  it("BosonXmtpClient initialise(): Pass on valid initialisation", async () => {
    expect(client).toBeInstanceOf(BosonXmtpClient);
    expect(client.envName).toBe(envName);
  });

  it("BosonXmtpClient getThreads(): Expect error if never messaged 'counterparty'", async () => {
    const counterparties: string[] = [nullAddress()];

    const threads = async () => {
      return await client.getThreads(counterparties);
    };
    await expect(threads()).rejects.toThrowError(
      `${counterparties.at(0)} has not initialised their XMTP client`
    );
  });

  it("BosonXmtpClient getThreads(): Expect empty", async () => {
    const counterparties: string[] = [walletAddress];
    const threads: ThreadObject[] = await client.getThreads(counterparties);

    expect(threads).toBeInstanceOf(Array<ThreadObject>);
    expect(threads.length).toBe(0);
  });

  it("BosonXmtpClient getThreads(): Expect threads to be returned", async () => {
    const counterparties: string[] = [walletAddress];
    await client.encodeAndSendMessage(
      mockMessageObject(MessageType.String),
      walletAddress
    );
    await new Promise((r) => setTimeout(r, 1000));
    const threads: ThreadObject[] = await client.getThreads(counterparties);
    expect(threads).toBeInstanceOf(Array<ThreadObject>);
    expect(threads.length).toBe(1);
  });

  it("BosonXmtpClient getThread(): Expect pass if never messaged 'counterparty'", async () => {
    const threadId: ThreadId = mockThreadId();
    const counterparty: string = await Wallet.createRandom().getAddress();
    const conversationHistory = async () => {
      const thread = await client.getThread(threadId, counterparty);
      return thread;
    };
    expect(conversationHistory).not.throws();
  });

  it("BosonXmtpClient getThread(): Expect fail if thread doesn't exist", async () => {
    const threadId: ThreadId = mockThreadId(true);
    const counterparty: string = walletAddress;
    const conversationHistory = await client.getThread(threadId, counterparty);
    expect(conversationHistory).toBeFalsy();
  });

  it("BosonXmtpClient getThread(): Expect thread to be returned", async () => {
    const threadId: ThreadId = mockThreadId(true);
    const counterparty: string = walletAddress;
    await client.encodeAndSendMessage(
      mockMessageObject(MessageType.String, threadId),
      counterparty
    );
    await new Promise((r) => setTimeout(r, 1000));
    const getThread = async () => {
      return client.getThread(threadId, counterparty);
    };
    await expect(getThread()).resolves.not.toThrow();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
    expect(matchThreadIds((await getThread())?.threadId!, threadId)).toBe(true);
  }, 100_000);

  it("BosonXmtpClient sendAndEncodeMessage(): Expect fail on invalid input - 'messageObject' param", async () => {
    const messageObject: MessageObject =
      "NOT A VALID MESSAGE OBJECT" as unknown as MessageObject;
    const recipient: string = walletAddress;
    const sendAndEncode = async () => {
      return await client.encodeAndSendMessage(messageObject, recipient);
    };
    await expect(sendAndEncode).rejects.toThrowError(
      "Message content is falsy (undefined)"
    );
  });

  it("BosonXmtpClient sendAndEncodeMessage(): Expect fail on invalid input - 'recipient' param", async () => {
    const messageObject: MessageObject = mockMessageObject(MessageType.String);
    const recipient: string = null as unknown as string;
    const sendAndEncode = async () => {
      return await client.encodeAndSendMessage(messageObject, recipient);
    };
    await expect(sendAndEncode).rejects.toThrowError(
      `invalid recipient ${recipient}`
    );
  });

  it("BosonXmtpClient sendAndEncodeMessage(): Expect pass on string type", async () => {
    const messageObject: MessageObject = mockMessageObject(MessageType.String);
    const recipient: string = walletAddress;
    const message: MessageData | undefined = await client.encodeAndSendMessage(
      messageObject,
      recipient
    );
    expect(message).toBeTruthy();
    if (message) {
      expect(
        matchThreadIds(message.data.threadId, messageObject.threadId)
      ).toBe(true);
      expect(message.data.contentType).toBe(messageObject.contentType);
    }
  });

  it("BosonXmtpClient sendAndEncodeMessage(): Expect pass on file type", async () => {
    const messageObject: MessageObject = mockMessageObject(MessageType.File);
    const recipient: string = walletAddress;
    const message: MessageData | undefined = await client.encodeAndSendMessage(
      messageObject,
      recipient
    );
    expect(message).toBeTruthy();
    if (message) {
      expect(
        matchThreadIds(message.data.threadId, messageObject.threadId)
      ).toBe(true);
      expect(message.data.contentType).toBe(messageObject.contentType);
    }
  });

  it("BosonXmtpClient monitorThread(): Expect pass", async () => {
    const threadId: ThreadId = mockThreadId();
    const counterparty: string = walletAddress;
    const messageObject: MessageObject = mockMessageObject(MessageType.File);
    setTimeout(async () => {
      await client.encodeAndSendMessage(messageObject, counterparty);
    }, 0);
    for await (const message of client.monitorThread(threadId, counterparty)) {
      expect(matchThreadIds(message.data.threadId, threadId));
      expect(message.data.contentType).toBe(messageObject.contentType);
      expect(message.data.version).toBe(messageObject.version);
      expect(message.sender).toBe(client.inboxId);
      expect(message.recipient).toBe(counterparty);
      break;
    }
  }, 100_000);
});
