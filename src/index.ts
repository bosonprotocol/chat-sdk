// DONE: DF - getThread bug - returns messages from multiple threads
// DONE: DF - check sendImage and sendProposal are working as expected
// DONE: DF - getThreads has a logical bug where threads are duplicated for each counterparty thats in the thread
// DONE: DF - implement monitorThread function
// DONE: DF - getThread & getThreads - additional fromTimestamp optional param (use conversations.messages(options)))
// DONE: DF - fix linting & dist/esm+cjs
// DONE: AF - GH actions
// DONE: DF/AF - ts-doc / volta
// TODO: AF - fix jest/config/tsconfig (tests not running due to "js-waku" module not found)
// TODO: DF/AF - unit tests / refactor  (e.g. error handling, input sanistisation, etc.)
// TODO: DF/AF - optimisations? e.g. implement (optional) staticThreadCheck function to regex check/string compare the encoded JSON content (e.g. chars[1,24] are threadId)
// TODO: AF - integrate into bp280-chat branch (src/lib/modules/chat)

import {
  Client,
  Conversation,
  ListMessagesOptions,
  Message,
  TextCodec
} from "@xmtp/xmtp-js";
import { Signer } from "ethers";
import { XmtpClient } from "./xmtp/client";
import { BosonCodec, ContentTypeBoson } from "./xmtp/codec/boson-codec";
import {
  MessageData,
  MessageObject,
  ThreadId,
  ThreadObject
} from "./util/definitions";
import {
  isJsonString,
  isValidMessageType,
  matchThreadIds
} from "./util/functions";

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
   * @returns BosonXmtpClient {@link BosonXmtpClient}
   */
  public static async initialise(signer: Signer, envName: string): Promise<BosonXmtpClient> {
    const client: Client = await Client.create(signer, {
      codecs: [new TextCodec(), new BosonCodec(envName)] // TODO extend with custom codecs for string, image and proposal types
    });

    return new BosonXmtpClient(signer, client, envName);
  }

  /**
   * Get all chat threads between the client
   * and the relevant counter-parties
   * @param counterparties - Array of wallet addresses
   * @param options - (optional) Further options {@link @xmtp/xmtp-js/Client/ListMessagesOptions#}
   * @returns ThreadObject[] {@link ThreadObject}
   */
  public async getThreads(
    counterparties: string[],
    options?: ListMessagesOptions
  ): Promise<ThreadObject[]> {
    // TODO: sanitise array input to be only valid wallet addresses
    const threads: ThreadObject[] = [];

    for (const counterparty of counterparties) {
      if (await this.isXmtpEnabled(counterparty)) {
        const chatThreads: ThreadObject[] = await this.splitIntoThreads(
          counterparty,
          options
        );
        threads.push(...chatThreads);
      }
    }

    return threads;
  }

  /**
   * Get a specific thread between the client
   * and the relevant counter-party
   * @param threadId - Thread ID {@link ThreadId}
   * @param counterparty - wallet address
   * @param options - (optional) Further options {@link @xmtp/xmtp-js/Client/ListMessagesOptions#}
   * @returns ThreadObject {@link ThreadObject}
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

    if (!thread) {
      throw new Error(`Thread does not exist with threadId: ${threadId}`);
    }

    return thread;
  }

  /**
   * This can be called with the for await...of
   * syntax to listen for incoming messages to
   * a specific thread
   * @param threadId - Thread ID {@link ThreadId}
   * @param counterparty - wallet address
   * @returns AsyncGenerator
   */
  public async *monitorThread(
    threadId: ThreadId,
    counterparty: string
  ): AsyncGenerator {
    const conversation: Conversation = await this.startConversation(
      counterparty
    );

    for await (const message of await conversation.streamMessages()) {
      if (message.senderAddress === counterparty) {
        const decodedMessage: MessageObject = this.decodeMessage(message) as MessageObject;
        if (matchThreadIds(decodedMessage.threadId, threadId)) {
          yield decodedMessage;
        }
      }
    }
  }

  /**
   * Encode input as JSON and send message
   * to the relevant recipient
   * @param messageObject - message object {@link MessageObject}
   * @param recipient - wallet address
   * TODO: should return boolean based on result of this.sendMessage()?
   */
  public async encodeAndSendMessage(
    messageObject: MessageObject,
    recipient: string
  ) {
    const jsonString: string = JSON.stringify(messageObject);
    await this.sendMessage(messageObject.contentType, jsonString, recipient);
  }

  /**
   * Decode and validate message
   * @param message - Message {@link @xmtp/xmtp-js/Message#}
   * @returns MessageObject {@link MessageObject} | void
   * TODO: clean up error handling
   */
  public decodeMessage(message: Message): MessageObject | void {
    if (
      message.contentType?.authorityId !== `bosonprotocol-${this.envName}` ||
      !isJsonString(message.content)
    ) {
      return;
    }

    const messageObject: MessageObject = JSON.parse(message.content);

    if (!isValidMessageType(messageObject.contentType)) {
      // TODO validate JSON structure
      console.log(`Unsupported message type: ${messageObject.contentType}`);
      return;
    }

    return messageObject;
  }

  /**
   * This splits a conversation between the
   * client and the relevant counterparty
   * into individual chat threads
   * @param counterparty - wallet address
   * @param options - (optional) Further options {@link @xmtp/xmtp-js/Client/ListMessagesOptions#}
   * @returns ThreadObject[] {@link ThreadObject}
   * TODO: refactor/optimise
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
