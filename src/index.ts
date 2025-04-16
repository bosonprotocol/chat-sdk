import {
  Client,
  Conversation,
  DecodedMessage,
  ListMessagesOptions,
  SafeListMessagesOptions
} from "@xmtp/browser-sdk";
import { Signer } from "ethers";
import { XmtpClient, XmtpEnv } from "./xmtp/client";
import { BosonCodec, ContentTypeBoson } from "./xmtp/codec/boson-codec";
import {
  JSONString,
  MessageData,
  MessageObject,
  ThreadId,
  ThreadObject
} from "./util/v0.0.1/definitions";
import {
  getAuthorityId,
  isValidJsonString,
  isValidMessageType,
  matchThreadIds
} from "./util/v0.0.1/functions";
import { validateMessage } from "./util/validators";
import { createEOASigner } from "./xmtp/helpers/createSigner";

export class BosonXmtpClient extends XmtpClient {
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
    super(signer, client, envName, xmtpEnvName);
  }

  /**
   * Create a BosonXmtpClient instance
   * @param signer - wallet to initialise
   * @param envName - environment name (e.g. "production", "test", etc)
   * @returns Class instance - {@link BosonXmtpClient}
   */
  public static async initialise(
    signer: Signer,
    xmtpEnvName: XmtpEnv,
    envName: string
  ): Promise<BosonXmtpClient> {
    console.log("BosonXmtpClient initialise", { signer, xmtpEnvName, envName });
    const address = await signer.getAddress();
    console.log("BosonXmtpClient initialise", {
      signer,
      xmtpEnvName,
      envName,
      address
    });

    const eoaSigner = createEOASigner(address as `0x${string}`, signer);
    console.log("BosonXmtpClient initialise", {
      signer,
      xmtpEnvName,
      envName,
      address,
      eoaSigner
    });
    const client: Client = await Client.create(eoaSigner, {
      env: xmtpEnvName,
      codecs: [new BosonCodec(envName)]
    });
    console.log("BosonXmtpClient initialise", {
      signer,
      xmtpEnvName,
      envName,
      address,
      eoaSigner,
      client
    });
    return new BosonXmtpClient(signer, client, envName, xmtpEnvName);
  }

  /**
   * Get all chat threads between the client
   * and the relevant counter-parties
   * @param counterparties - Array of wallet addresses
   * @param options - (optional) {@link ListMessagesOptions}
   * @returns Threads - {@link ThreadObject}[]
   */
  public async getThreads(
    counterparties: string[],
    options?: ListMessagesOptions
  ): Promise<ThreadObject[]> {
    const threads: ThreadObject[] = [];

    for (const counterparty of counterparties) {
      const chatThreads: ThreadObject[] = await this.splitIntoThreads(
        counterparty,
        options
      );
      threads.push(...chatThreads);
    }

    return threads;
  }

  /**
   * Get a specific thread between the client
   * and the relevant counter-party
   * @param threadId - {@link ThreadId}
   * @param counterparty - wallet address
   * @param options - (optional) {@link ListMessagesOptions}
   * @returns Thread - {@link ThreadObject}
   */
  public async getThread(
    threadId: ThreadId,
    counterparty: string,
    options?: ListMessagesOptions
  ): Promise<ThreadObject> {
    const threads: ThreadObject[] = await this.splitIntoThreads(
      counterparty,
      options
    );
    const thread: ThreadObject = threads.filter((thread) =>
      matchThreadIds(thread.threadId, threadId)
    )[0];

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
    stopGenerator: { done: boolean } = { done: false }
  ): AsyncGenerator<MessageData> {
    const conversation: Conversation = await this.startConversation(
      counterparty
      // getConversationId(threadId, this.envName),
      // threadId
    );

    for await (const message of await conversation.stream()) {
      if (!message) {
        continue;
      }
      if (
        this.client.inboxId &&
        this.client.inboxId === message.senderInboxId
      ) {
        if (stopGenerator.done) {
          return;
        }
        const decodedMessage: MessageObject = (await this.decodeMessage(
          message
        )) as MessageObject;
        if (
          decodedMessage &&
          matchThreadIds(decodedMessage.threadId, threadId)
        ) {
          if (!message.contentType) {
            throw new Error("Received message does not have contentType");
          }
          const recipient = await this.signer.getAddress();
          const messageData: MessageData = {
            authorityId: message.contentType.authorityId,
            sender: message.senderInboxId,
            recipient,
            timestamp: message.sentAtNs,
            data: decodedMessage
          };
          yield messageData;
        }
      }
    }
  }

  /**
   * Encode input as JSON and send message
   * to the relevant recipient
   * @param messageObject - {@link MessageObject}
   * @param recipient - wallet address
   * @param fallBackDeepLink - (optional) URL to client where full message can be read
   */
  public async encodeAndSendMessage(
    messageObject: MessageObject,
    recipient: string
  ): Promise<MessageData | undefined> {
    if (
      !(await validateMessage(messageObject, {
        throwError: true
      }))
    ) {
      return;
    }
    const jsonString = JSON.stringify(
      messageObject
    ) as JSONString<MessageObject>;
    const messageId = await this.sendMessage(
      messageObject.contentType,
      messageObject.threadId,
      jsonString,
      recipient
    );
    const decodedMessage = await this.client.conversations.getMessageById(
      messageId
    );
    if (!decodedMessage) {
      throw new Error("Message not found");
    }

    return {
      authorityId: getAuthorityId(this.envName),
      timestamp: decodedMessage.sentAtNs,
      sender: decodedMessage.senderInboxId,
      recipient,
      data: (await this.decodeMessage(decodedMessage)) as MessageObject
    };
  }

  /**
   * Decode and validate message
   * @param message - {@link DecodedMessage}
   * @returns Decoded message - {@link MessageObject}
   */
  public async decodeMessage(
    message: DecodedMessage
  ): Promise<MessageObject | undefined> {
    if (
      message.contentType?.authorityId === getAuthorityId(this.envName) &&
      isValidJsonString(message.content)
    ) {
      const messageObject: MessageObject = JSON.parse(message.content);

      if (
        isValidMessageType(messageObject.contentType) &&
        (await validateMessage(messageObject, {
          throwError: false
        }))
      ) {
        return messageObject;
      }
    }
    return undefined;
  }

  /**
   * This splits a conversation between the
   * client and the relevant counterparty
   * into individual chat threads
   * @param counterparty - wallet address
   * @param options - (optional) {@link SafeListMessagesOptions}
   * @returns Threads - {@link ThreadObject}[]
   */
  private async splitIntoThreads(
    counterparty: string,
    options?: SafeListMessagesOptions
  ): Promise<ThreadObject[]> {
    const recipient = await this.signer.getAddress();
    let messages: DecodedMessage[] = await this.getLegacyConversationHistory(
      counterparty,
      options
    );
    console.log("splitIntoThreads", {
      counterparty,
      messages,
      authorityId: ContentTypeBoson(this.envName).authorityId
    });
    messages = messages.filter(
      (message) =>
        message.contentType?.authorityId ===
        ContentTypeBoson(this.envName).authorityId
    );
    console.log("splitIntoThreads after message filter only boson", {
      counterparty,
      messages,
      authorityId: ContentTypeBoson(this.envName).authorityId
    });
    const threads: Map<string, ThreadObject> = new Map<string, ThreadObject>();
    const getThreadKey = (threadId: ThreadId) =>
      `${threadId.sellerId}-${threadId.buyerId}-${threadId.exchangeId}`;

    for (const message of messages) {
      const decodedMessage: MessageObject = (await this.decodeMessage(
        message
      )) as MessageObject;

      if (decodedMessage && isValidMessageType(decodedMessage.contentType)) {
        const threadKey = getThreadKey(decodedMessage.threadId);
        // if this thread does not already exist in the threads array then add it
        let thread = threads.get(threadKey);
        if (!thread) {
          thread = {
            threadId: decodedMessage.threadId,
            counterparty: counterparty,
            messages: []
          };
          threads.set(threadKey, thread);
        }
        const messageWrapper: MessageData = {
          authorityId: message.contentType?.authorityId as string,
          timestamp: message.sentAtNs,
          sender: message.senderInboxId,
          recipient: recipient,
          data: decodedMessage
        };

        // add message to relevant thread
        thread.messages.push(messageWrapper);
      }
    }

    const conversations = await this.getConversations();
    for (const convo of conversations) {
      const convoMessages = await convo.messages();
      for (const message of convoMessages) {
        const decodedMessage = await this.decodeMessage(message);
        if (!decodedMessage) {
          continue;
        }
        const threadId = decodedMessage.threadId;
        const threadKey = getThreadKey(threadId);
        // if this thread does not already exist in the threads Map then add it
        let thread = threads.get(threadKey);
        if (!thread) {
          thread = {
            threadId,
            counterparty: counterparty,
            messages: []
          };
          threads.set(threadKey, thread);
        }
        const messageWrapper: MessageData = {
          authorityId: message.contentType?.authorityId as string,
          timestamp: message.sentAtNs,
          sender: message.senderInboxId,
          recipient,
          data: decodedMessage
        };

        // add message to relevant thread
        thread.messages.push(messageWrapper);
      }
    }

    return Array.from(threads.values());
  }
}
