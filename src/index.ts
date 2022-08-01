// DONE: DF - getThread bug - returns messages from multiple threads
// DONE: DF - check sendImage and sendProposal are working as expected
// DONE: DF - getThreads has a logical bug where threads are duplicated for each counterparty thats in the thread
// DONE: DF - implement monitorThread function
// DONE: DF - getThread & getThreads - additional fromTimestamp optional param (use conversations.messages(options)))
// DONE: DF - fix linting & dist/esm+cjs
// TODO: AF - fix jest/config/tsconsig (tests not running due to "js-waku" module not found)
// TODO: DF/AF - unit tests / refactor  (e.g. error handling, input sanistisation, etc.)
// TODO: DF/AF - GH actions / volta
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
  constructor(signer: Signer, client: Client, envName: string) {
    super(signer, client, envName);
  }

  public static async initialise(signer: Signer, envName: string) {
    const client: Client = await Client.create(signer, {
      codecs: [new TextCodec(), new BosonCodec(envName)] // TODO extend with custom codecs for string, image and proposal types
    });

    return new BosonXmtpClient(signer, client, envName);
  }

  /**
   * This returns an array of chat threads relating
   * to Boson Protocol.
   * @param counterparties Array of wallet addresses
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

  public async getThread(
    threadId: ThreadId,
    counterparty: string,
    options?: ListMessagesOptions
  ): Promise<ThreadObject> {
    // TODO sanitise array input to be only valid wallet addresses
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

  public async *monitorThread(
    threadId: ThreadId,
    counterparty: string
  ): AsyncGenerator {
    const conversation: Conversation = await this.startConversation(
      counterparty
    );

    for await (const message of await conversation.streamMessages()) {
      let decodedMessage: MessageObject;
      if (message.senderAddress === counterparty) {
        decodedMessage = this.decodeMessage(message) as MessageObject;
        if (matchThreadIds(decodedMessage.threadId, threadId)) {
          yield decodedMessage;
        }
      }
    }
  }

  // TODO: error handling - split into separate encode and send functions?
  public async encodeAndSendMessage(
    messageObject: MessageObject,
    recipient: string
  ) {
    const jsonString: string = JSON.stringify(messageObject);
    await this.sendMessage(messageObject.contentType, jsonString, recipient);
  }

  // TODO: clean up error handling
  public decodeMessage(message: Message): MessageObject | void {
    if (
      message.contentType?.authorityId !== `bosonprotocol-${this.envName}` ||
      !isJsonString(message.content)
    ) {
      console.log(
        `Unsupported Authority ID: ${message.contentType?.authorityId} or invalid message content format`
      );
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

  // TODO: refactor/optimise
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
