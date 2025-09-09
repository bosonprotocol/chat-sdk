import type { Client } from "@xmtp/browser-sdk";
import { Wallet } from "ethers";
import { BosonXmtpBrowserClient } from "../../src/browser/index.js";
import type {
  MessageData,
  MessageObject,
  ThreadId,
  ThreadObject,
} from "../../src/common/util/v0.0.1/definitions.js";
import { MessageType } from "../../src/common/util/v0.0.1/definitions.js";
import { matchThreadIds } from "../../src/common/util/v0.0.1/functions.js";
import {
  mockMessageObject,
  mockThreadId,
  testXmtpClient,
  nullAddress,
} from "../mocks.js";
import { describe, expect, it, beforeAll } from "vitest";

describe.skip("boson-xmtp-client", () => {
  const envName = "testing-0x";
  let wallet: Wallet;
  let walletAddress: string;
  let client: BosonXmtpBrowserClient;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    walletAddress = await wallet.getAddress();
    client = await BosonXmtpBrowserClient.initialise(wallet, "dev", envName);
  });

  it("BosonXmtpBrowserClient: Pass on valid construction", async () => {
    const client: Client = await testXmtpClient(wallet, envName);
    const bosonXmtpClient: BosonXmtpBrowserClient = new BosonXmtpBrowserClient(
      wallet,
      client,
      envName,
      "dev",
    );
    expect(bosonXmtpClient.envName).toBe(envName);
  });

  it("BosonXmtpBrowserClient initialise(): Pass on valid initialisation", async () => {
    expect(client).toBeInstanceOf(BosonXmtpBrowserClient);
    expect(client.envName).toBe(envName);
  });

  it("BosonXmtpBrowserClient getThreads(): Expect pass if never messaged 'counterparty'", async () => {
    const counterparties: string[] = [nullAddress()];

    const threads = async () => {
      return await client.getThreads(counterparties);
    };
    await expect(threads()).resolves.toHaveLength(0);
  });

  it("BosonXmtpBrowserClient getThreads(): Expect empty", async () => {
    const counterparties: string[] = [walletAddress];
    const threads: ThreadObject[] = await client.getThreads(counterparties);

    expect(threads).toBeInstanceOf(Array<ThreadObject>);
    expect(threads.length).toBe(0);
  });

  it("BosonXmtpBrowserClient getThreads(): Expect threads to be returned", async () => {
    const counterparties: string[] = [walletAddress];
    await client.encodeAndSendMessage(
      mockMessageObject(MessageType.String),
      walletAddress,
    );
    await new Promise((r) => setTimeout(r, 1000));
    const threads: ThreadObject[] = await client.getThreads(counterparties);
    expect(threads).toBeInstanceOf(Array<ThreadObject>);
    expect(threads.length).toBe(1);
  });

  it("BosonXmtpBrowserClient getThread(): Expect pass if never messaged 'counterparty'", async () => {
    const threadId: ThreadId = mockThreadId();
    const counterparty: string = await Wallet.createRandom().getAddress();
    const conversationHistory = async () => {
      const thread = await client.getThread(threadId, counterparty);
      return thread;
    };
    expect(conversationHistory).not.throws();
  });

  it("BosonXmtpBrowserClient getThread(): Expect fail if thread doesn't exist", async () => {
    const threadId: ThreadId = mockThreadId(true);
    const counterparty: string = walletAddress;
    const conversationHistory = await client.getThread(threadId, counterparty);
    expect(conversationHistory).toBeFalsy();
  });

  it("BosonXmtpBrowserClient getThread(): Expect thread to be returned", async () => {
    const threadId: ThreadId = mockThreadId(true);
    const counterparty: string = walletAddress;
    await client.encodeAndSendMessage(
      mockMessageObject(MessageType.String, threadId),
      counterparty,
    );
    await new Promise((r) => setTimeout(r, 1000));
    const getThread = async () => {
      return client.getThread(threadId, counterparty);
    };
    await expect(getThread()).resolves.not.toThrow();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
    expect(matchThreadIds((await getThread())?.threadId!, threadId)).toBe(true);
  }, 100_000);

  it("BosonXmtpBrowserClient sendAndEncodeMessage(): Expect fail on invalid input - 'messageObject' param", async () => {
    const messageObject: MessageObject =
      "NOT A VALID MESSAGE OBJECT" as unknown as MessageObject;
    const recipient: string = walletAddress;
    const sendAndEncode = async () => {
      return await client.encodeAndSendMessage(messageObject, recipient);
    };
    await expect(sendAndEncode).rejects.toThrowError(
      "Message content is falsy (undefined)",
    );
  });

  it("BosonXmtpBrowserClient sendAndEncodeMessage(): Expect fail on invalid input - 'recipient' param", async () => {
    const messageObject: MessageObject = mockMessageObject(MessageType.String);
    const recipient: string = null as unknown as string;
    const sendAndEncode = async () => {
      return await client.encodeAndSendMessage(messageObject, recipient);
    };
    await expect(sendAndEncode).rejects.toThrowError(
      `invalid recipient ${recipient}`,
    );
  });

  it("BosonXmtpBrowserClient sendAndEncodeMessage(): Expect pass on string type", async () => {
    const messageObject: MessageObject = mockMessageObject(MessageType.String);
    const recipient: string = walletAddress;
    const message: MessageData | undefined = await client.encodeAndSendMessage(
      messageObject,
      recipient,
    );
    expect(message).toBeTruthy();
    if (message) {
      expect(
        matchThreadIds(message.data.threadId, messageObject.threadId),
      ).toBe(true);
      expect(message.data.contentType).toBe(messageObject.contentType);
    }
  });

  it("BosonXmtpBrowserClient sendAndEncodeMessage(): Expect pass on file type", async () => {
    const messageObject: MessageObject = mockMessageObject(MessageType.File);
    const recipient: string = walletAddress;
    const message: MessageData | undefined = await client.encodeAndSendMessage(
      messageObject,
      recipient,
    );
    expect(message).toBeTruthy();
    if (message) {
      expect(
        matchThreadIds(message.data.threadId, messageObject.threadId),
      ).toBe(true);
      expect(message.data.contentType).toBe(messageObject.contentType);
    }
  });

  it("BosonXmtpBrowserClient monitorThread(): Expect pass", async () => {
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
