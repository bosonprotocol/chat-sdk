import { Client, ContentTypeId, Message } from "@xmtp/xmtp-js";
import { Wallet } from "ethers";
import { BosonXmtpClient } from "../../src/index";
import {
  MessageObject,
  ThreadId,
  ThreadObject
} from "../../src/util/definitions";
import { matchThreadIds } from "../../src/util/functions";
import {
  mockMessageObject,
  mockThreadId,
  mockXmtpClient,
  mockXmtpMessage,
  nullAddress
} from "../mocks";

describe("boson-xmtp-client", () => {
  const envName = "test";
  const wallet: Wallet = Wallet.createRandom();
  let walletAddress: string;
  let client: BosonXmtpClient;

  beforeAll(async () => {
    walletAddress = await wallet.getAddress();
    client = await BosonXmtpClient.initialise(wallet, envName);
  });

  test("BosonXmtpClient: Pass on valid construction", async () => {
    const client: Client = await mockXmtpClient(wallet, envName);
    const bosonXmtpClient: BosonXmtpClient = new BosonXmtpClient(
      wallet,
      client,
      envName
    );
    expect(bosonXmtpClient).toBeInstanceOf(BosonXmtpClient);
    expect(bosonXmtpClient.envName).toBe(envName);
  });

  test("BosonXmtpClient initialise(): Pass on valid initialisation", async () => {
    expect(client).toBeInstanceOf(BosonXmtpClient);
    expect(client.envName).toBe(envName);
  });

  test("BosonXmtpClient getThreads(): Expect fail if non-XMTP-initialised 'counterparty'", async () => {
    const counterparties: string[] = [nullAddress()];

    const threads = async () => {
      return await client.getThreads(counterparties);
    };
    await expect(threads).rejects.toThrow(
      `${counterparties[0]} has not initialised their XMTP client`
    );
  });

  test("BosonXmtpClient getThreads(): Expect empty", async () => {
    const counterparties: string[] = [walletAddress];
    const threads: ThreadObject[] = await client.getThreads(counterparties);

    expect(threads).toBeInstanceOf(Array<ThreadObject>);
    expect(threads.length).toBe(0);
  });

  test("BosonXmtpClient getThreads(): Expect threads to be returned", async () => {
    const counterparties: string[] = [walletAddress];
    await client.encodeAndSendMessage(mockMessageObject(), walletAddress);
    await new Promise((r) => setTimeout(r, 1000)); // TODO: work around for XMTP delay
    const threads: ThreadObject[] = await client.getThreads(counterparties);
    expect(threads).toBeInstanceOf(Array<ThreadObject>);
    expect(threads.length).toBeGreaterThan(0);
  });

  test("BosonXmtpClient getThread(): Expect fail if non-XMTP-initialised 'counterparty'", async () => {
    const threadId: ThreadId = mockThreadId();
    const counterparty: string = nullAddress();
    const conversationHistory = async () => {
      return await client.getThread(threadId, counterparty);
    };
    await expect(conversationHistory).rejects.toThrow(
      `${counterparty} has not initialised their XMTP client`
    );
  });

  test("BosonXmtpClient getThread(): Expect fail if thread doesn't exist", async () => {
    const threadId: ThreadId = mockThreadId(true);
    const counterparty: string = walletAddress;
    const conversationHistory = async (): Promise<ThreadObject> => {
      return await client.getThread(threadId, counterparty);
    };
    await expect(conversationHistory).rejects.toThrow(
      `Thread does not exist with threadId: ${threadId}`
    );
  });

  test("BosonXmtpClient getThread(): Expect thread to be returned", async () => {
    const threadId: ThreadId = mockThreadId(true);
    const counterparty: string = walletAddress;
    await client.encodeAndSendMessage(
      mockMessageObject(threadId),
      counterparty
    );
    await new Promise((r) => setTimeout(r, 1000)); // TODO: work around for XMTP delay
    await expect(
      client.getThread(threadId, counterparty)
    ).resolves.not.toThrow();
    await expect(
      client.getThread(threadId, counterparty)
    ).resolves.not.toThrowError(
      `Thread does not exist with threadId: ${threadId}`
    );
    await expect(
      client.getThread(threadId, counterparty)
    ).resolves.not.toThrowError(
      `${counterparty} has not initialised their XMTP client`
    );
    expect(
      matchThreadIds(
        (await client.getThread(threadId, counterparty)).threadId,
        threadId
      )
    ).toBe(true);
  });

  test("BosonXmtpClient sendAndEncodeMessage(): Expect fail on invalid input - 'messageObject' param", async () => {
    const messageObject: MessageObject =
      "NOT A VALID MESSAGE OBJECT" as unknown as MessageObject;
    const recipient: string = walletAddress;
    const sendAndEncode = async () => {
      return await client.encodeAndSendMessage(messageObject, recipient);
    };
    await expect(sendAndEncode).rejects.toThrowError(
      "Invalid input parameters"
    );
  });

  test("BosonXmtpClient sendAndEncodeMessage(): Expect fail on invalid input - 'recipient' param", async () => {
    const messageObject: MessageObject = mockMessageObject();
    const recipient: string = null as unknown as string;
    const sendAndEncode = async () => {
      return await client.encodeAndSendMessage(messageObject, recipient);
    };
    await expect(sendAndEncode).rejects.toThrowError(
      "Invalid input parameters"
    );
  });

  test("BosonXmtpClient sendAndEncodeMessage(): Expect pass", async () => {
    const messageObject: MessageObject = mockMessageObject();
    const recipient: string = walletAddress;
    await expect(
      client.encodeAndSendMessage(messageObject, recipient)
    ).resolves.not.toThrowError("Invalid input parameters");
    await expect(
      client.encodeAndSendMessage(messageObject, recipient)
    ).resolves.not.toThrow();
  });

  test("BosonXmtpClient decodeMessage(): Fail on invalid 'message.contentType.authorityId' param", async () => {
    const message: Message = mockXmtpMessage(envName);
    message.contentType = {
      authorityId: "NOT VALID"
    } as ContentTypeId;

    const decode = () => {
      return client.decodeMessage(message);
    };
    expect(decode()).toBeUndefined();
  });

  test("BosonXmtpClient decodeMessage(): Fail on invalid 'message.content' param", async () => {
    const message: Message = mockXmtpMessage(envName);
    message.content = "NOT VALID JSON";

    const decode = () => {
      return client.decodeMessage(message);
    };
    expect(decode()).toBeUndefined();
  });

  test("BosonXmtpClient decodeMessage(): Fail on invalid messageType (i.e. after parsing 'message.content')", async () => {
    const message: Message = mockXmtpMessage(envName);
    message.content = '{"contentType":"value"}';

    const decode = () => {
      return client.decodeMessage(message);
    };
    expect(decode()).toBeUndefined();
  });

  test("BosonXmtpClient decodeMessage(): Expect pass", async () => {
    const message: Message = mockXmtpMessage(envName);
    message.content = '{"contentType":"STRING"}';

    const decodedMessage: MessageObject = client.decodeMessage(
      message
    ) as MessageObject;
    expect(JSON.stringify(decodedMessage)).toBe(message.content);
  });

  test("BosonXmtpClient monitorThread(): Expect pass", async () => {
    const threadId: ThreadId = mockThreadId();
    const counterparty: string = walletAddress;
    const messageObject: MessageObject = mockMessageObject();
    client.encodeAndSendMessage(messageObject, counterparty);
    for await (const message of client.monitorThread(threadId, counterparty)) {
      expect(matchThreadIds(message.threadId, threadId));
      expect(message.contentType).toBe(messageObject.contentType);
      expect(message.version).toBe(messageObject.version);
      break;
    }
  }, 10000);
});
