import {
  Client,
  Conversation,
  DecodedMessage,
  ListMessagesOptions,
  TextCodec
} from "@xmtp/xmtp-js";
import { Signer } from "ethers";
import { XmtpClient, XmtpEnv } from "./xmtp/client";
import { BosonCodec, ContentTypeBoson } from "./xmtp/codec/boson-codec";
import {
  MessageData,
  MessageObject,
  ThreadId,
  ThreadObject,
  domain
} from "./util/v0.0.1/definitions";
import {
  getAuthorityId,
  getConversationId,
  isValidJsonString,
  isValidMessageType,
  matchThreadIds
} from "./util/v0.0.1/functions";
import { validateMessage } from "./util/validators";

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
    const client: Client = await Client.create(signer, {
      env: xmtpEnvName,
      codecs: [new TextCodec(), new BosonCodec(envName)]
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
    // listen to v2 conversation
    const conversation: Conversation = await this.startConversation(
      counterparty,
      getConversationId(threadId, this.envName),
      threadId
    );

    for await (const message of await conversation.streamMessages()) {
      if (message.senderAddress === counterparty) {
        if (stopGenerator.done) {
          return;
        }
        const decodedMessage: MessageObject = (await this.decodeMessage(
          message
        )) as MessageObject;
        if (
          decodedMessage &&
          message.messageVersion === "v1" &&
          matchThreadIds(decodedMessage.threadId, threadId)
        ) {
          if (!message.contentType) {
            throw new Error("Received message does not have contentType");
          }
          if (message.messageVersion === "v1" && !message.recipientAddress) {
            throw new Error("Received message does not have recipientAddress");
          }
          const messageData: MessageData = {
            authorityId: message.contentType.authorityId,
            sender: message.senderAddress,
            recipient: message.recipientAddress as string,
            timestamp: message.sent.getTime(),
            data: decodedMessage
          };
          yield messageData;
        }
        if (decodedMessage && message.messageVersion === "v2") {
          if (!message.contentType) {
            throw new Error("Received message does not have contentType");
          }
          const recipient = await this.signer.getAddress(); // ?? recipientAddress no longer exists for v2 conversations
          const messageData: MessageData = {
            authorityId: message.contentType.authorityId,
            sender: message.senderAddress,
            recipient,
            timestamp: message.sent.getTime(),
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
    recipient: string,
    fallBackDeepLink?: string
  ): Promise<MessageData | undefined> {
    if (
      !(await validateMessage(messageObject, {
        throwError: true
      }))
    ) {
      return;
    }
    const jsonString: string = JSON.stringify(messageObject);
    const message: DecodedMessage = await this.sendMessage(
      messageObject.contentType,
      messageObject.threadId,
      jsonString,
      recipient,
      fallBackDeepLink
    );

    if (!message.senderAddress) {
      throw new Error("Sent message does not have senderAddress");
    }

    return {
      authorityId: getAuthorityId(this.envName),
      timestamp: message.sent.getTime(),
      sender: message.senderAddress,
      recipient,
      data: (await this.decodeMessage(message)) as MessageObject
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
   * @param options - (optional) {@link ListMessagesOptions}
   * @returns Threads - {@link ThreadObject}[]
   */
  private async splitIntoThreads(
    counterparty: string,
    options?: ListMessagesOptions
  ): Promise<ThreadObject[]> {
    let messages: DecodedMessage[] = await this.getLegacyConversationHistory(
      counterparty,
      options
    );
    messages = messages.filter(
      (message) =>
        message.contentType?.authorityId ===
        ContentTypeBoson(this.envName).authorityId
    );
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
          timestamp: message.sent.getTime(),
          sender: message.senderAddress as string,
          recipient: message.recipientAddress as string,
          data: decodedMessage
        };

        // add message to relevant thread
        thread.messages.push(messageWrapper);
      }
    }

    const conversations = await this.getConversations();
    const myAppConversations = conversations.filter(
      (convo) =>
        convo.context?.conversationId &&
        convo.context.conversationId.startsWith(domain)
    );
    for (const convo of myAppConversations) {
      const threadId = convo.context?.metadata as unknown as ThreadId;
      const threadKey = getThreadKey(threadId);
      // if this thread does not already exist in the threads array then add it
      let thread = threads.get(threadKey);
      if (!thread) {
        thread = {
          threadId,
          counterparty: counterparty,
          messages: []
        };
        threads.set(threadKey, thread);
      }

      const v2messages = await convo.messages();
      for (const message of v2messages) {
        const decodedMessage: MessageObject = (await this.decodeMessage(
          message
        )) as MessageObject;
        const messageWrapper: MessageData = {
          authorityId: message.contentType?.authorityId as string,
          timestamp: message.sent.getTime(),
          sender: message.senderAddress as string,
          recipient: convo.clientAddress, // ???
          data: decodedMessage
        };

        // add message to relevant thread
        thread.messages.push(messageWrapper);
      }
    }

    return Array.from(threads.values());
  }
}
