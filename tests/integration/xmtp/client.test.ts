import { Client, Conversation, DecodedMessage } from "@xmtp/xmtp-js";
import { Wallet } from "ethers";
import { MessageType } from "../../../src/util/v0.0.1/definitions";
import { XmtpClient } from "../../../src/xmtp/client";
import { mockJsonString, testXmtpClient, nullAddress } from "../../mocks";

jest.setTimeout(10000);

describe("xmtp-client", () => {
  const envName = "test";
  const wallet = Wallet.createRandom();
  let walletAddress: string;
  let xmtpClient: XmtpClient;
  const threadId = {
    sellerId: "sellerId",
    buyerId: "buyerId",
    exchangeId: "exchangeId"
  };

  beforeAll(async () => {
    walletAddress = await wallet.getAddress();
    xmtpClient = await XmtpClient.initialise(wallet, "dev", envName);
  });

  test("XmtpClient: Pass on valid construction", async () => {
    const client: Client = await testXmtpClient(wallet, envName);
    const xmtpClient: XmtpClient = new XmtpClient(
      wallet,
      client,
      envName,
      "dev"
    );
    expect(xmtpClient).toBeInstanceOf(XmtpClient);
    expect(xmtpClient.envName).toBe(envName);
  });

  test("XmtpClient initialise(): Pass on valid initialisation - 'envName' as non-production", async () => {
    expect(xmtpClient).toBeInstanceOf(XmtpClient);
    expect(xmtpClient.envName).toBe(envName);
  });

  test("XmtpClient initialise(): Pass on valid initialisation - 'envName' as production", async () => {
    const envOverride = "production";
    const client: XmtpClient = await XmtpClient.initialise(
      wallet,
      "dev",
      envOverride
    );
    expect(client).toBeInstanceOf(XmtpClient);
    expect(client.envName).toBe(envOverride);
  });

  test("XmtpClient isXmtpEnabled(): Expect true", async () => {
    const address: string = walletAddress;
    const isEnabled: boolean = await XmtpClient.isXmtpEnabled(
      address,
      "dev",
      envName
    );
    expect(isEnabled).toBe(true);
  });

  test("XmtpClient isXmtpEnabled(): Expect false", async () => {
    const address: string = nullAddress();
    const isEnabled: boolean = await XmtpClient.isXmtpEnabled(
      address,
      "dev",
      envName
    );
    expect(isEnabled).toBe(false);
  });

  test("XmtpClient getConversations(): Expect empty", async () => {
    const conversations: Conversation[] = await xmtpClient.getConversations();
    expect(conversations.length).toBe(0);
  });

  test("XmtpClient getConversations(): Expect conversations to be returned", async () => {
    const messageContent: string = mockJsonString();
    const recipient: string = walletAddress;
    await xmtpClient.sendMessage(
      MessageType.String,
      threadId,
      messageContent,
      recipient
    );
    await new Promise((r) => setTimeout(r, 1000)); // TODO: work around for below comment...
    const conversations: Conversation[] = await xmtpClient.getConversations(); // TODO: fix - sometimes returns nothing? even though prev step is messageSend
    expect(conversations.length).toBeGreaterThan(0);
  });

  test("XmtpClient getLegacyConversationHistory(): Expect fail if non-XMTP-initialised 'counterparty'", async () => {
    const recipient: string = nullAddress();
    const conversationHistory = async () => {
      return await xmtpClient.getLegacyConversationHistory(recipient);
    };
    await expect(conversationHistory).rejects.toThrow(
      `${recipient} has not initialised their XMTP client`
    );
  });

  test("XmtpClient getLegacyConversationHistory(): Expect conversation to be returned", async () => {
    const recipient: string = walletAddress;

    const conversationHistory: DecodedMessage[] =
      await xmtpClient.getLegacyConversationHistory(recipient);
    expect(conversationHistory).toBeInstanceOf(Array<DecodedMessage>);
  });

  test("XmtpClient sendMessage(): Expect fail on invalid input - 'messageType' param", async () => {
    const messageType: MessageType = "Not A VALID MESSAGE TYPE" as MessageType;
    const messageContent: string = mockJsonString();
    const recipient: string = walletAddress;

    const send = async () => {
      await xmtpClient.sendMessage(
        messageType,
        threadId,
        messageContent,
        recipient
      );
    };
    await expect(send).rejects.toThrowError("Invalid input parameters");
  });

  test("XmtpClient sendMessage(): Expect fail on invalid input - 'messageContent' param", async () => {
    const messageContent = "NOT VALID JSON";
    const recipient: string = walletAddress;

    const send = async () => {
      await xmtpClient.sendMessage(
        MessageType.String,
        threadId,
        messageContent,
        recipient
      );
    };
    await expect(send).rejects.toThrowError("Invalid input parameters");
  });

  test("XmtpClient sendMessage(): Expect fail on invalid input - 'recipient' param", async () => {
    const messageContent: string = mockJsonString();
    const recipient: string = null as unknown as string;

    const send = async () => {
      await xmtpClient.sendMessage(
        MessageType.String,
        threadId,
        messageContent,
        recipient
      );
    };
    await expect(send).rejects.toThrowError(
      `${recipient} has not initialised their XMTP client`
    );
  });

  test("XmtpClient sendMessage(): Expect fail on non-XMTP-initialised recipient", async () => {
    const messageContent: string = mockJsonString();
    const recipient: string = nullAddress();

    const send = async () => {
      await xmtpClient.sendMessage(
        MessageType.String,
        threadId,
        messageContent,
        recipient
      );
    };
    await expect(send).rejects.toThrowError(
      `${recipient} has not initialised their XMTP client`
    );
  });

  test("XmtpClient sendMessage(): Expect pass - with 'fallBackDeepLink' param", async () => {
    const fallBackDeepLink = "https://mock.com/example";
    const messageContent: string = mockJsonString();
    const recipient: string = walletAddress;
    await expect(
      xmtpClient.sendMessage(
        MessageType.String,
        threadId,
        messageContent,
        recipient,
        fallBackDeepLink
      )
    ).resolves.not.toThrow();
  });

  test("XmtpClient sendMessage(): Expect pass - without 'fallBackDeepLink' param", async () => {
    const messageContent: string = mockJsonString();
    const recipient: string = walletAddress;
    await expect(
      xmtpClient.sendMessage(
        MessageType.String,
        threadId,
        messageContent,
        recipient
      )
    ).resolves.not.toThrow();
  });

  test("XmtpClient startConversation(): Expect fail on non-XMTP-initialised recipient", async () => {
    const recipient: string = nullAddress();

    const conversation = async (): Promise<Conversation> => {
      return await xmtpClient.startConversation(recipient, "", threadId);
    };
    await expect(conversation).rejects.toThrow(
      `${recipient} has not initialised their XMTP client`
    );
  });

  test("XmtpClient startConversation(): Expect pass", async () => {
    const recipient: string = walletAddress;
    const conversation: Conversation = await xmtpClient.startConversation(
      recipient,
      "",
      threadId
    );
    expect(conversation).toBeTruthy();
  });
});
