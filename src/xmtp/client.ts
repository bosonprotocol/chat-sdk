import { Signer, Wallet } from "ethers";
import {
  Client,
  Conversation,
  DecodedMessage,
  ListMessagesOptions,
  SendOptions,
  TextCodec
} from "@xmtp/xmtp-js";
import { MessageType, ThreadId } from "../util/v0.0.1/definitions";
import { BosonCodec, ContentTypeBoson } from "./codec/boson-codec";
import {
  getConversationId,
  isValidJsonString,
  isValidMessageType
} from "../util/v0.0.1/functions";
import {
  ConversationV1,
  ConversationV2
} from "@xmtp/xmtp-js/dist/types/src/conversations";

export type XmtpEnv = "production" | "dev";

export class XmtpClient {
  signer: Signer;
  client: Client;
  envName: string;
  xmtpEnvName: XmtpEnv;

  /**
   * Class constructor
   * @param signer - wallet to initialise
   * @param client - XMTP client
   * @param envName - environment name (e.g. "production", "test", etc)
   */
  constructor(
    signer: Signer,
    client: Client,
    envName: string,
    xmtpEnvName: XmtpEnv
  ) {
    this.signer = signer;
    this.client = client;
    this.envName = envName;
    this.xmtpEnvName = xmtpEnvName;
  }

  /**
   * Create an XmtpClient instance
   * @param signer - wallet to initialise
   * @param envName - environment name (e.g. "production", "test", etc)
   * @returns Class instance - {@link XmtpClient}
   */
  public static async initialise(
    signer: Signer,
    xmtpEnvName: XmtpEnv,
    envName: string
  ): Promise<XmtpClient> {
    console.log("New XMTP version");
    const client: Client = await Client.create(signer, {
      env: xmtpEnvName,
      codecs: [new TextCodec(), new BosonCodec(envName)]
    });

    return new XmtpClient(signer, client, envName, xmtpEnvName);
  }

  /**
   * Check if input corresponds to a known
   * XMTP key bundle (i.e. exists already)
   * @param address - wallet address
   * @param envName - environment name (e.g. "production", "test", etc)
   * @returns boolean
   */
  public static async isXmtpEnabled(
    address: string,
    xmtpEnvName: XmtpEnv,
    envName: string
  ): Promise<boolean> {
    const wallet: Wallet = Wallet.createRandom();
    const bosonXmtp = await XmtpClient.initialise(wallet, xmtpEnvName, envName);
    return await bosonXmtp.client.canMessage(address);
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
  public async getLegacyConversationHistory(
    counterparty: string,
    options?: ListMessagesOptions
  ): Promise<DecodedMessage[]> {
    const conversation: Conversation = await this.getLegacyConversation(
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
  public async startConversation(
    counterparty: string,
    conversationId: string,
    metadata: ThreadId
  ): Promise<ConversationV2> {
    if (
      !(await XmtpClient.isXmtpEnabled(
        counterparty,
        this.xmtpEnvName,
        this.envName
      ))
    ) {
      throw new Error(`${counterparty} has not initialised their XMTP client`);
    }
    // create a V2 Conversation, by specifying a conversationId
    return (await this.client.conversations.newConversation(counterparty, {
      conversationId,
      metadata: metadata as unknown as { [key: string]: string }
    })) as ConversationV2;
  }

  public async getLegacyConversation(
    counterparty: string
  ): Promise<ConversationV1> {
    if (
      !(await XmtpClient.isXmtpEnabled(
        counterparty,
        this.xmtpEnvName,
        this.envName
      ))
    ) {
      throw new Error(`${counterparty} has not initialised their XMTP client`);
    }
    return (await this.client.conversations.newConversation(
      counterparty
    )) as ConversationV1;
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
    threadId: ThreadId,
    messageContent: string,
    recipient: string,
    fallBackDeepLink?: string
  ): Promise<DecodedMessage> {
    if (
      !isValidJsonString(messageContent) ||
      !isValidMessageType(messageType)
    ) {
      throw new Error(`Invalid input parameters`);
    }

    const fallBackContent: string = fallBackDeepLink
      ? `BPv2 Message - To see the full message go to: ${fallBackDeepLink}`
      : `BPv2 Message; ${messageContent}`;
    const messageEncoding: SendOptions = {
      contentType: ContentTypeBoson(this.envName),
      contentFallback: fallBackContent
    };

    // send the message through a V2 Conversation
    const conversation: Conversation = await this.startConversation(
      recipient,
      getConversationId(threadId, this.envName),
      threadId
    );

    return await conversation.send(messageContent, messageEncoding);
  }
}
