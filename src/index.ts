import {
  Client,
  Conversation,
  ListMessagesOptions,
  Message,
  TextCodec
} from "@xmtp/xmtp-js";
import { Signer } from "ethers";
import { XmtpClient } from "./xmtp/client";
import { BosonCodec } from "./xmtp/codec/boson-codec";
import {
  MessageData,
  MessageObject,
  ThreadId,
  ThreadObject
} from "./util/v0.0.1/types";
import {
  createWorker,
  decodeMessage,
  filterByAuthorityId,
  splitConversation
} from "./util/v0.0.1/functions";
import { getAuthorityId, matchThreadIds } from "./util/helper";
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
      let messages: Message[] = await this.getConversationHistory(
        counterparty,
        options
      );
      messages = filterByAuthorityId(messages, this.envName);
      const chatThreads: ThreadObject[] = await splitConversation(
        messages,
        counterparty,
        this.envName
      );
      threads.push(...chatThreads);
    }

    return threads;
  }

  /**
   * Parallelised implementation of getThreads
   * which makes use of worker threads
   * @param counterparties - Array of wallet addresses
   * @param options - (optional) {@link ListMessagesOptions}
   * @returns Threads - {@link ThreadObject}[]
   */
  public async getThreadsParallel(
    counterparties: string[],
    options?: ListMessagesOptions
  ): Promise<ThreadObject[]> {
    const threads: ThreadObject[] = [];

    const workerPromises: Promise<ThreadObject[]>[] = [];
    for (const counterparty of counterparties) {
      let messages: Message[] = await this.getConversationHistory(
        counterparty,
        options
      );
      messages = filterByAuthorityId(messages, this.envName);
      workerPromises.push(
        createWorker(
          "./dist/cjs/workers/split-conversation-worker.js",
          messages,
          counterparty,
          this.envName
        )
      );
    }

    const threadResults: ThreadObject[][] = await Promise.all(workerPromises);
    for (const threadResult of threadResults) {
      threads.push(...threadResult);
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
    let messages: Message[] = await this.getConversationHistory(
      counterparty,
      options
    );
    messages = filterByAuthorityId(messages, this.envName);
    const threads: ThreadObject[] = await splitConversation(
      messages,
      counterparty,
      this.envName
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
        const decodedMessage: MessageObject = decodeMessage(
          message,
          this.envName
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
      data: decodeMessage(message, this.envName) as MessageObject
    };
  }
}
