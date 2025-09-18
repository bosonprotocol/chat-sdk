import type { Conversation, Identifier, XmtpEnv } from "@xmtp/browser-sdk";
import { Client } from "@xmtp/browser-sdk";
import { TextCodec } from "@xmtp/content-type-text";
import type { Signer } from "ethers";
import { Wallet } from "ethers";

import { BosonCodec, ContentTypeBoson } from "../common/codec/boson-codec.js";
import type { MessageObject } from "../common/util/v0.0.1/definitions.js";
import type { AuthorityIdEnvName } from "../common/util/v0.0.1/functions.js";
import { createEOASigner } from "./helpers/createSigner.js";

export class XmtpClient {
  get inboxId(): string | undefined {
    return this.client.inboxId?.toLowerCase();
  }
  signer: Signer;
  client: Client;
  envName: AuthorityIdEnvName;
  xmtpEnvName: XmtpEnv;

  /**
   * Class constructor
   * @param signer - wallet to initialise
   * @param client - XMTP client
   * @param envName - environment name (e.g. "production-0x123", "testing-0x123", etc)
   */
  constructor(
    signer: Signer,
    client: Client,
    envName: AuthorityIdEnvName,
    xmtpEnvName: XmtpEnv,
  ) {
    this.signer = signer;
    this.client = client;
    this.envName = envName;
    this.xmtpEnvName = xmtpEnvName;
  }

  /**
   * Create an XmtpClient instance
   * @param signer - wallet to initialise
   * @param envName - environment name (e.g. "production-0x123", "testing-0x123", etc)
   * @returns Class instance - {@link XmtpClient}
   */
  public static async initialise(
    signer: Signer,
    xmtpEnvName: XmtpEnv,
    envName: AuthorityIdEnvName,
  ): Promise<XmtpClient> {
    const address = await signer.getAddress();
    const eoaSigner = createEOASigner(address as `0x${string}`, signer);
    const client: Client = await Client.create(eoaSigner, {
      env: xmtpEnvName,
      codecs: [new TextCodec(), new BosonCodec(envName)],
    });
    return new XmtpClient(signer, client, envName, xmtpEnvName);
  }

  /**
   * Check if input corresponds to a known
   * XMTP key bundle (i.e. exists already)
   * @param address - wallet address
   * @param envName - environment name (e.g. "production-0x123", "testing-0x123", etc)
   * @returns boolean
   */
  public static async isXmtpEnabled(
    address: string,
    xmtpEnvName: XmtpEnv,
    envName: AuthorityIdEnvName,
  ): Promise<boolean> {
    const lowerCaseAddress = address.toLowerCase();
    const wallet: Wallet = Wallet.createRandom();
    const bosonXmtp = await XmtpClient.initialise(wallet, xmtpEnvName, envName);
    const identifier = {
      identifier: lowerCaseAddress,
      identifierKind: "Ethereum",
    } as const;
    return (
      (await bosonXmtp.client.canMessage([identifier])).get(lowerCaseAddress) ??
      false
    );
  }

  /**
   * Check if current client corresponds to a known
   * XMTP key bundle (i.e. exists already)
   * @param address - wallet address
   * @param envName - environment name (e.g. "production-0x123", "testing-0x123", etc)
   * @returns boolean
   */
  public async isXmtpEnabled(): Promise<boolean> {
    return (await this.client.isRegistered()) && this.client.isReady; // TODO: not sure if both are necessary
  }

  public async checkXmtpEnabled(address: string): Promise<boolean> {
    const canMessageToIdsMap = await this.client.canMessage([
      { identifier: address.toLowerCase(), identifierKind: "Ethereum" },
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
   * Revoke all other installations other than the current one
   * @returns void
   */
  public async revokeAllOtherInstallations(): Promise<void> {
    return this.client.revokeAllOtherInstallations();
  }

  /**
   * Open a conversation with the relevant
   * counter-party
   * @param counterparty - wallet address
   * @returns Conversation - {@link Conversation}
   */
  public async getConversation(
    counterparty: string,
  ): Promise<Awaited<ReturnType<Client["conversations"]["listDms"]>>[0]> {
    if (!(await this.checkXmtpEnabled(counterparty))) {
      throw new Error(`${counterparty} has not initialised their XMTP client`);
    }
    const identifier = {
      identifier: counterparty.toLowerCase(),
      identifierKind: "Ethereum",
    } as Identifier;

    const inboxId = await this.client.findInboxIdByIdentifier(identifier);

    if (!inboxId) {
      return await this.client.conversations.newDmWithIdentifier(identifier);
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
   * @param messageInJson - JSON-encoded message content
   * @param recipient - wallet address
   */
  public async sendMessage(
    messageObject: MessageObject,
    recipient: string,
  ): Promise<ReturnType<Awaited<Conversation["send"]>>> {
    if (!recipient) {
      throw new Error(`invalid recipient ${recipient}`);
    }
    const conversation = await this.getConversation(recipient);

    return await conversation.send(
      messageObject,
      ContentTypeBoson(this.envName),
    );
  }
}
