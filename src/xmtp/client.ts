import { Signer } from "ethers";
import {
  Client,
  ContentTypeId,
  Conversation,
  ListMessagesOptions,
  Message,
  SendOptions,
  TextCodec
} from "@xmtp/xmtp-js";
import { MessageType } from "../util/definitions";
import { BosonCodec, ContentTypeBoson } from "./codec/boson-codec";
import { isValidMessageType } from "../util/functions";

export class XmtpClient {
  signer: Signer;
  client: Client;
  envName: string;

  constructor(signer: Signer, client: Client, envName: string) {
    this.signer = signer;
    this.client = client;
    this.envName = envName;
  }

  public static async initialise(signer: Signer, envName: string) {
    const client = await Client.create(signer, {
      env: envName === "production" ? "production" : "dev",
      codecs: [new TextCodec(), new BosonCodec(envName)]
    });

    return new XmtpClient(signer, client, envName);
  }

  public async isXmtpEnabled(recipient: string): Promise<boolean> {
    return await this.client.canMessage(recipient);
  }

  public async startConversation(recipient: string): Promise<Conversation> {
    if (!(await this.isXmtpEnabled(recipient))) {
      throw new Error(`${recipient} has not initialised their XMTP client`);
    }
    return await this.client.conversations.newConversation(recipient);
  }

  public async getConversations(): Promise<Conversation[]> {
    return await this.client.conversations.list();
  }

  public async getConversationHistory(
    recipient: string,
    options?: ListMessagesOptions
  ): Promise<Message[]> {
    const conversation: Conversation = await this.startConversation(recipient);

    return await conversation.messages(options);
  }

  private static getEncoding(
    messageType: MessageType,
    envName: string
  ): SendOptions {
    if (!isValidMessageType(messageType)) {
      throw new Error(`Unsupported message type: ${messageType}`);
    }

    const contentFallback = "BPv2 Message"; // TODO: Interpolate deeplink to chat thread in UI
    const contentType: ContentTypeId = ContentTypeBoson(envName);

    return {
      contentType,
      contentFallback
    };
  }

  public async sendMessage(
    messageType: MessageType,
    messageContent: string,
    recipient: string
  ) {
    if (!messageContent || !messageType) {
      throw new Error(
        `Missing parameter(s)\n\tMessage Text: ${messageContent}\n\tMessage Type: ${messageType}`
      );
    }

    const conversation: Conversation = await this.startConversation(recipient);
    const messageEncoding: SendOptions = XmtpClient.getEncoding(
      messageType,
      this.envName
    );

    await conversation.send(messageContent, messageEncoding);
  }

  // TODO: remove - example use only
  public async monitorConversation(recipient: string) {
    const conversation: Conversation = await this.startConversation(recipient);

    for await (const message of await conversation.streamMessages()) {
      if (message.senderAddress === this.client.address) {
        continue;
      }

      console.log(
        `[NEW MESSAGE]\n\tFrom: ${message.senderAddress}]\n\tBody: ${message.content}`
      );
      await this.sendMessage(MessageType.String, "pong", recipient);
    }
  }
}
