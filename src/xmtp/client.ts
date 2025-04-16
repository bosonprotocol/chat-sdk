import { Signer, Wallet } from "ethers";
import {
  Client,
  Conversation,
  DecodedMessage,
  Dm,
  Identifier,
  SafeListMessagesOptions
} from "@xmtp/browser-sdk";
import { TextCodec } from "@xmtp/content-type-text";

import {
  JSONString,
  MessageObject,
  MessageType,
  ThreadId
} from "../util/v0.0.1/definitions";
import { BosonCodec, ContentTypeBoson } from "./codec/boson-codec";
import {
  isValidJsonString,
  isValidMessageType
} from "../util/v0.0.1/functions";
import { createEOASigner } from "./helpers/createSigner";

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
    const address = await signer.getAddress();
    const eoaSigner = createEOASigner(address as `0x${string}`, signer);
    const client: Client = await Client.create(eoaSigner, {
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
    return (
      (
        await bosonXmtp.client.canMessage([
          {
            identifier: address,
            identifierKind: "Ethereum"
          }
        ])
      ).get(address) ?? false
    );
  }

  public async checkXmtpEnabled(address: string): Promise<boolean> {
    const canMessageToIdsMap = await this.client.canMessage([
      { identifier: address.toLowerCase(), identifierKind: "Ethereum" }
    ]);
    return canMessageToIdsMap.get(address.toLowerCase()) ?? false;
  }

  /**
   * Get the list of conversations for this
   * client instance
   * @returns Conversations - {@link Conversation}[]
   */
  public async getConversations(): Promise<Conversation[]> {
    return await this.client.conversations.listDms();
  }

  /**
   * Open a conversation with the relevant
   * counter-party
   * @param counterparty - wallet address
   * @returns Conversation - {@link Conversation}
   */
  public async getConversation(
    counterparty: string
  ): Promise<Awaited<ReturnType<Client["conversations"]["listDms"]>>[0]> {
    if (!(await this.checkXmtpEnabled(counterparty))) {
      throw new Error(`${counterparty} has not initialised their XMTP client`);
    }
    const identifier = {
      identifier: counterparty.toLowerCase(),
      identifierKind: "Ethereum"
    } as Identifier;
    console.log(
      "client registered",
      await this.client.isRegistered(),
      "client ready",
      this.client.isReady
    );
    const inboxId = await this.client.findInboxIdByIdentifier(identifier);
    const existingConversations = await this.client.conversations.listDms();
    console.log(
      "inboxId of indentifier",
      inboxId,
      identifier,
      "existingConversations",
      existingConversations
    );

    if (!inboxId) {
      return await this.client.conversations.newDmWithIdentifier(identifier);
    }
    for (const dmOrGroup of existingConversations) {
      console.log("dmOrGroup", dmOrGroup, dmOrGroup.id);
      if (dmOrGroup instanceof Dm) {
        const dm = dmOrGroup;
        if ((await dm.peerInboxId()) === inboxId) {
          console.log("found dm of counterparty using list()", dm);
          break;
        }
      }
    }
    const dm = await this.client.conversations.getDmByInboxId(inboxId);
    if (!dm) {
      return await this.client.conversations.newDmWithIdentifier(identifier);
    }
    return dm;
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
    messageInJson: JSONString<MessageObject> | string,
    recipient: string
  ): Promise<ReturnType<Awaited<Conversation["send"]>>> {
    if (!isValidJsonString(messageInJson) || !isValidMessageType(messageType)) {
      throw new Error(`Invalid input parameters`);
    }

    const conversation = await this.getConversation(recipient);

    return await conversation.send(
      messageInJson,
      ContentTypeBoson(this.envName)
    );
  }
}
