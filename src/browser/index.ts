import type {
  Conversation,
  SafeListMessagesOptions,
  XmtpEnv,
} from "@xmtp/browser-sdk";
import { Client } from "@xmtp/browser-sdk";
import { TextCodec } from "@xmtp/content-type-text";
import type { Signer } from "ethers";

import { BosonCodec } from "../common/codec/boson-codec.js";
import type {
  MessageData,
  MessageObject,
  ThreadId,
  ThreadObject,
} from "../common/util/v0.0.1/definitions.js";
import type { AuthorityIdEnvName } from "../common/util/v0.0.1/functions.js";
import {
  authorityIdEnvNameSchema,
  getAuthorityId,
  matchThreadIds,
} from "../common/util/v0.0.1/functions.js";
import type { BosonClient } from "./client.js";
import { XmtpClient } from "./client.js";
import { createEOASigner } from "./helpers/createSigner.js";
import { isBosonMessage } from "./helpers/isBosonMessage.js";

export class BosonXmtpBrowserClient extends XmtpClient {
  /**
   * Class constructor
   * @param signer - wallet to initialise
   * @param client - XMTP client
   * @param envName - environment name (e.g. "production-0x123", "testing-0x123", etc)
   */
  constructor(
    signer: Signer,
    client: BosonClient,
    envName: AuthorityIdEnvName,
    xmtpEnvName: XmtpEnv,
  ) {
    authorityIdEnvNameSchema.parse(envName);
    super(signer, client, envName, xmtpEnvName);
  }

  /**
   * Create a BosonXmtpBrowserClient instance
   * @param signer - wallet to initialise
   * @param envName - environment name (e.g. "production-0x123", "testing-0x123", etc)
   * @returns Class instance - {@link BosonXmtpBrowserClient}
   */
  public static async initialise(
    signer: Signer,
    xmtpEnvName: XmtpEnv,
    envName: AuthorityIdEnvName,
  ): Promise<BosonXmtpBrowserClient> {
    const address = await signer.getAddress();

    const eoaSigner = createEOASigner(address as `0x${string}`, signer);
    const client: BosonClient = await Client.create(eoaSigner, {
      env: xmtpEnvName,
      appVersion: "xmtp.chat/0",
      // codecs: [new TextCodec(), new BosonCodec(envName)],
      codecs: [new TextCodec()],
      loggingLevel: "debug",
    });
    return new BosonXmtpBrowserClient(signer, client, envName, xmtpEnvName);
  }

  /**
   * Get all chat threads between the client
   * and the relevant counter-parties
   * @param counterparties - Array of wallet addresses
   * @param options - (optional) {@link SafeListMessagesOptions}
   * @returns Threads - {@link ThreadObject}[]
   */
  public async getThreads(
    counterparties: string[],
    options?: SafeListMessagesOptions,
  ): Promise<ThreadObject[]> {
    const threads: ThreadObject[] = [];

    for (const counterparty of counterparties) {
      const chatThreads: ThreadObject[] =
        await this.fetchConversationIntoThreads(counterparty, options);
      threads.push(...chatThreads);
    }

    return threads;
  }

  /**
   * Get a specific thread between the client
   * and the relevant counter-party
   * @param threadId - {@link ThreadId}
   * @param counterparty - wallet address
   * @param options - (optional) {@link SafeListMessagesOptions}
   * @returns Thread - {@link ThreadObject}
   */
  public async getThread(
    threadId: ThreadId,
    counterparty: string,
    options?: SafeListMessagesOptions,
  ): Promise<ThreadObject | undefined> {
    const threads: ThreadObject[] = await this.fetchConversationIntoThreads(
      counterparty,
      options,
    );
    const thread = threads.find((thread) =>
      matchThreadIds(thread.threadId, threadId),
    );

    return thread;
  }

  /**
   * This can be called with the for await...of
   * syntax to listen for incoming messages to
   * a specific thread
   * @param threadId - {@link ThreadId}
   * @param counterparty - wallet address
   * @returns AsyncGenerator
   */
  public async *monitorThread(
    threadId: ThreadId,
    counterparty: string,
    stopGenerator: { done: boolean } = { done: false },
  ): AsyncGenerator<MessageData> {
    const conversation: Conversation = await this.getConversation(counterparty);
    const recipient = await this.signer.getAddress();

    for await (const message of await conversation.stream()) {
      if (!message) {
        continue;
      }
      if (stopGenerator.done) {
        return;
      }
      if (!isBosonMessage(message, [this.envName])) {
        throw new Error("Message is not Boson message");
      }
      if (!message.content) {
        throw new Error("Message content is falsy");
      }
      const bosonMessage = message.content;
      if (matchThreadIds(bosonMessage.threadId, threadId)) {
        const messageData: MessageData = {
          authorityId: message.contentType.authorityId,
          sender: message.senderInboxId,
          recipient,
          timestamp: message.sentAtNs,
          data: bosonMessage,
        };
        yield messageData;
      }
    }
  }

  /**
   * Encode input as JSON and send message
   * to the relevant recipient
   * @param messageObject - {@link MessageObject}
   * @param recipient - wallet address
   */
  public async encodeAndSendMessage(
    messageObject: MessageObject,
    recipient: string,
  ): Promise<MessageData | undefined> {
    const messageId = await this.sendMessage(messageObject, recipient);
    const message = await this.client.conversations.getMessageById(messageId);
    if (!message) {
      throw new Error("Message not found");
    }
    if (!isBosonMessage(message, [this.envName])) {
      throw new Error("Message is not Boson message");
    }
    if (!message.content) {
      throw new Error(`Message content is falsy (${message.content})`);
    }
    return {
      authorityId: getAuthorityId(this.envName),
      timestamp: message.sentAtNs,
      sender: message.senderInboxId,
      recipient,
      data: message.content,
    };
  }

  /**
   * This splits a conversation between the
   * client and the relevant counterparty
   * into individual chat threads
   * @param counterparty - wallet address
   * @param options - (optional) {@link SafeListMessagesOptions}
   * @returns Threads - {@link ThreadObject}[]
   */
  private async fetchConversationIntoThreads(
    counterparty: string,
    options?: SafeListMessagesOptions,
  ): Promise<ThreadObject[]> {
    const recipient = await this.signer.getAddress();
    const threads: Map<string, ThreadObject> = new Map<string, ThreadObject>();
    const getThreadKey = (threadId: ThreadId) =>
      `${threadId.sellerId}-${threadId.buyerId}-${threadId.exchangeId}`;

    const conversation = await this.getConversation(counterparty);

    await conversation.sync().catch(console.error);
    const messages = await conversation.messages(options);
    for (const message of messages) {
      if (!message) {
        continue;
      }
      if (!isBosonMessage(message, [this.envName])) {
        continue;
      }
      const bosonMessage = message.content;
      if (!bosonMessage) {
        continue;
      }
      const threadId = bosonMessage.threadId;
      const threadKey = getThreadKey(threadId);
      // if this thread does not already exist in the threads Map then add it
      let thread = threads.get(threadKey);
      if (!thread) {
        thread = {
          threadId,
          counterparty: counterparty,
          messages: [],
        };
        threads.set(threadKey, thread);
      }
      const messageWrapper: MessageData = {
        authorityId: message.contentType?.authorityId as string,
        timestamp: message.sentAtNs,
        sender: message.senderInboxId,
        recipient,
        data: bosonMessage,
      };

      // add message to relevant thread
      thread.messages.push(messageWrapper);
    }

    return Array.from(threads.values());
  }
}
