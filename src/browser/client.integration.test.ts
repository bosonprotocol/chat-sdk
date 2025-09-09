import type { Client, Conversation } from "@xmtp/browser-sdk";
import { Wallet } from "ethers";
import { beforeAll, describe, expect, it } from "vitest";

import {
  mockMessageObject,
  nullAddress,
  testXmtpClient,
} from "../../tests/mocks.js";
import { MessageType } from "../common/util/v0.0.1/definitions.js";
import { XmtpClient } from "./client.js";

describe("xmtp-client", () => {
  const envName = "testing-0x123";
  const wallet = Wallet.createRandom();
  let walletAddress: string;
  let xmtpClient: XmtpClient;
  beforeAll(async () => {
    walletAddress = await wallet.getAddress();
    xmtpClient = await XmtpClient.initialise(wallet, "dev", envName);
  });

  it("XmtpClient: Pass on valid construction", async () => {
    const client: Client = await testXmtpClient(wallet, envName);
    const xmtpClient: XmtpClient = new XmtpClient(
      wallet,
      client,
      envName,
      "dev",
    );
    expect(xmtpClient).toBeInstanceOf(XmtpClient);
    expect(xmtpClient.envName).toBe(envName);
  });

  it("XmtpClient initialise(): Pass on valid initialisation - 'envName' as non-production", async () => {
    expect(xmtpClient).toBeInstanceOf(XmtpClient);
    expect(xmtpClient.envName).toBe(envName);
  });

  it("XmtpClient initialise(): Pass on valid initialisation - 'envName' as production", async () => {
    const envOverride = "production-0x123";
    const client: XmtpClient = await XmtpClient.initialise(
      wallet,
      "dev",
      envOverride,
    );
    expect(client).toBeInstanceOf(XmtpClient);
    expect(client.envName).toBe(envOverride);
  });

  it("XmtpClient isXmtpEnabled(): Expect true", async () => {
    const isEnabled: boolean = await xmtpClient.isXmtpEnabled();
    expect(isEnabled).toBe(true);
  });

  it("XmtpClient XmtpClient.isXmtpEnabled(): Expect true", async () => {
    const isEnabled: boolean = await XmtpClient.isXmtpEnabled(
      walletAddress.toUpperCase(),
      "dev",
      envName,
    );
    expect(isEnabled).toBe(true);
  });

  it("XmtpClient getConversations(): Expect empty", async () => {
    const conversations: Conversation[] = await xmtpClient.getConversations();
    expect(conversations.length).toBe(0);
  });

  it("XmtpClient getConversations(): Expect conversations to be returned", async () => {
    const messageObject = mockMessageObject(MessageType.String);
    const recipient: string = walletAddress;
    await xmtpClient.sendMessage(messageObject, recipient);
    await new Promise((r) => setTimeout(r, 1000));
    const conversations: Conversation[] = await xmtpClient.getConversations();
    expect(conversations.length).toBeGreaterThan(0);
  });

  it("XmtpClient sendMessage(): Expect fail on invalid input - 'recipient' param", async () => {
    const messageObject = mockMessageObject(MessageType.String);
    const recipient: string = null as unknown as string;

    const send = async () => {
      await xmtpClient.sendMessage(messageObject, recipient);
    };
    await expect(send).rejects.toThrowError(`invalid recipient ${recipient}`);
  });

  it("XmtpClient sendMessage(): Expect fail on non-XMTP-initialised recipient", async () => {
    const messageObject = mockMessageObject(MessageType.String);
    const recipient: string = nullAddress();

    const send = async () => {
      await xmtpClient.sendMessage(messageObject, recipient);
    };
    await expect(send).rejects.toThrowError(
      `${recipient} has not initialised their XMTP client`,
    );
  });

  it("XmtpClient sendMessage(): Expect pass", async () => {
    const messageObject = mockMessageObject(MessageType.String);
    const recipient: string = walletAddress;
    await expect(
      xmtpClient.sendMessage(messageObject, recipient),
    ).resolves.not.toThrow();
  });

  it("XmtpClient getConversation(): Expect fail on non-XMTP-initialised recipient", async () => {
    const recipient: string = nullAddress();

    const conversation = async (): Promise<Conversation> => {
      return await xmtpClient.getConversation(recipient);
    };
    await expect(conversation).rejects.toThrow(
      `${recipient} has not initialised their XMTP client`,
    );
  });

  it("XmtpClient getConversation(): Expect pass", async () => {
    const recipient: string = walletAddress;
    const conversation: Conversation =
      await xmtpClient.getConversation(recipient);
    expect(conversation).toBeTruthy();
  });
});
