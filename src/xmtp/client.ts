import { Signer } from "ethers";
import {
  Client,
  Conversation,
  ListMessagesOptions,
  Message,
  SendOptions,
  TextCodec
} from "@xmtp/xmtp-js";
import { MessageType } from "../util/definitions";
import { BosonCodec, ContentTypeBoson } from "./codec/boson-codec";
import { isValidJsonString, isValidMessageType } from "../util/functions";

export class XmtpClient {
  signer: Signer;
  client: Client;
  envName: string;

  /**
   * Class constructor
   * @param signer - wallet to initialise
   * @param client - XMTP client
   * @param envName - environment name (e.g. "production", "test", etc)
   */
  constructor(signer: Signer, client: Client, envName: string) {
    this.signer = signer;
    this.client = client;
    this.envName = envName;
  }

  /**
   * Create an XmtpClient instance
   * @param signer - wallet to initialise
   * @param envName - environment name (e.g. "production", "test", etc)
   * @returns Class instance - {@link XmtpClient}
   */
  public static async initialise(
    signer: Signer,
    envName: string
  ): Promise<XmtpClient> {
    const client: Client = await Client.create(signer, {
      env: envName === "production" ? "production" : "dev",
      codecs: [new TextCodec(), new BosonCodec(envName)]
    });

    return new XmtpClient(signer, client, envName);
  }

  /**
   * Check if input corresponds to a known
   * XMTP key bundle (i.e. exists already)
   * @param address - wallet address
   * @returns boolean
   */
  public async isXmtpEnabled(address: string): Promise<boolean> {
    return await this.client.canMessage(address);
  }

  /**
   * Get the list of conversations for this
   * client instance
   * @returns Conversations - {@link Conversation}[]
   */
  public async getConversations(): Promise<Conversation[]> {
    return await this.client.conversations.list();
  }

  /**
   * Get all messages between client and
   * the relevant counter-party
   * @param counterparty - wallet address
   * @param options - (optional) {@link ListMessagesOptions}
   * @returns Messages - {@link Message}[]
   */
  public async getConversationHistory(
    counterparty: string,
    options?: ListMessagesOptions
  ): Promise<Message[]> {
    const conversation: Conversation = await this.startConversation(
      counterparty
    );

    return await conversation.messages(options);
  }

  /**
   * Open a conversation with the relevant
   * counter-party
   * @param counterparty - wallet address
   * @returns Conversation - {@link Conversation}
   */
  public async startConversation(counterparty: string): Promise<Conversation> {
    if (!(await this.isXmtpEnabled(counterparty))) {
      throw new Error(`${counterparty} has not initialised their XMTP client`);
    }
    return await this.client.conversations.newConversation(counterparty);
  }

  /**
   * Send a message to the given recipient.
   * @param messageType - {@link MessageType}
   * @param messageContent - JSON-encoded message content
   * @param recipient - wallet address
   * @param fallBackDeepLink - (optional) URL to client where full message can be read
   */
  public async sendMessage(
    messageType: MessageType,
    messageContent: string,
    recipient: string,
    fallBackDeepLink?: string
  ): Promise<Message> {
    if (
      !isValidJsonString(messageContent) ||
      !isValidMessageType(messageType)
    ) {
      throw new Error(`Invalid input parameters`);
    }

    const fallBackContent: string = fallBackDeepLink
      ? `BPv2 Message - To see the full message go to: ${fallBackDeepLink}`
      : `BPv2 Message`;
    const messageEncoding: SendOptions = {
      contentType: ContentTypeBoson(this.envName),
      contentFallback: fallBackContent
    };

    const conversation: Conversation = await this.startConversation(recipient);

    return await conversation.send(messageContent, messageEncoding);
  }
}
