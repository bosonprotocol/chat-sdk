import {
  Client,
  Conversation,
  ListMessagesOptions,
  Message,
  TextCodec
} from "@xmtp/xmtp-js";
import { Signer, Wallet } from "ethers";
import { XmtpClient } from "./xmtp/client";
import { BosonCodec, ContentTypeBoson } from "./xmtp/codec/boson-codec";
import {
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

export class BosonXmtpClient extends XmtpClient {
  /**
   * Class constructor
   * @param signer - wallet to initialise
   * @param client - XMTP client
   * @param envName - environment name (e.g. "production", "test", etc)
   */
  constructor(signer: Signer, client: Client, envName: string) {
    super(signer, client, envName);
  }

  /**
   * Create a BosonXmtpClient instance
   * @param signer - wallet to initialise
   * @param envName - environment name (e.g. "production", "test", etc)
   * @returns Class instance - {@link BosonXmtpClient}
   */
  public static async initialise(
    signer: Signer,
    envName: string
  ): Promise<BosonXmtpClient> {
    const client: Client = await Client.create(signer, {
      codecs: [new TextCodec(), new BosonCodec(envName)]
    });

    return new BosonXmtpClient(signer, client, envName);
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
    counterparty: string
  ): AsyncGenerator<MessageData> {
    const conversation: Conversation = await this.startConversation(
      counterparty
    );

    for await (const message of await conversation.streamMessages()) {
      if (message.senderAddress === counterparty) {
        const decodedMessage: MessageObject = this.decodeMessage(
          message
        ) as MessageObject;
        if (matchThreadIds(decodedMessage.threadId, threadId)) {
          const messageData: MessageData = {
            authorityId: message.contentType.authorityId,
            sender: message.senderAddress,
            recipient: message.recipientAddress,
            timestamp: message.header.timestamp,
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
  ): Promise<MessageData> {
    if (
      !(await validateMessage(messageObject, {
        throwError: true
      }))
    ) {
      return;
    }
    const jsonString: string = JSON.stringify(messageObject);
    const message: Message = await this.sendMessage(
      messageObject.contentType,
      jsonString,
      recipient,
      fallBackDeepLink
    );

    return {
      authorityId: getAuthorityId(this.envName),
      timestamp: message.header.timestamp,
      sender: message.senderAddress,
      recipient: message.recipientAddress,
      data: this.decodeMessage(message) as MessageObject
    };
  }

  /**
   * Decode and validate message
   * TODO: clean up error handling
   * @param message - {@link Message}
   * @returns Decoded message - {@link MessageObject}
   */
  public decodeMessage(message: Message): MessageObject | void {
    if (
      message.contentType?.authorityId === getAuthorityId(this.envName) &&
      isValidJsonString(message.content)
    ) {
      const messageObject: MessageObject = JSON.parse(message.content);

      if (isValidMessageType(messageObject.contentType)) {
        // TODO: validate JSON structure
        return messageObject;
      }
    }
  }

  /**
   * This splits a conversation between the
   * client and the relevant counterparty
   * into individual chat threads
   * TODO: refactor/optimise
   * @param counterparty - wallet address
   * @param options - (optional) {@link ListMessagesOptions}
   * @returns Threads - {@link ThreadObject}[]
   */
  private async splitIntoThreads(
    counterparty: string,
    options?: ListMessagesOptions
  ): Promise<ThreadObject[]> {
    let messages: Message[] = await this.getConversationHistory(
      counterparty,
      options
    );
    messages = messages.filter(
      (message) =>
        message.contentType?.authorityId ===
        ContentTypeBoson(this.envName).authorityId
    );
    const threads: ThreadObject[] = [];

    for (const message of messages) {
      const decodedMessage: MessageObject = this.decodeMessage(
        message
      ) as MessageObject;

      if (decodedMessage && isValidMessageType(decodedMessage.contentType)) {
        // if this thread does not already exist in the threads array then add it
        if (
          threads.filter((thread) =>
            matchThreadIds(thread.threadId, decodedMessage.threadId)
          ).length < 1
        ) {
          threads.push({
            threadId: decodedMessage.threadId,
            counterparty: counterparty,
            messages: []
          });
        }

        const messageWrapper: MessageData = {
          authorityId: message.contentType?.authorityId as string,
          timestamp: message.header.timestamp,
          sender: message.senderAddress as string,
          recipient: message.recipientAddress as string,
          data: decodedMessage
        };

        // add message to relevant thread - TODO: refactor(?)
        for (let i = 0; i < threads.length; i++) {
          if (
            matchThreadIds(threads[i].threadId, messageWrapper.data.threadId)
          ) {
            threads[i].messages.push(messageWrapper);
          }
        }
      }
    }

    return threads;
  }
}
