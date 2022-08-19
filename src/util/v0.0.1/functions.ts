import { Message } from "@xmtp/xmtp-js";
import { MessageData, MessageObject, ThreadObject } from "./types";
import { ContentTypeBoson } from "../../xmtp/codec/boson-codec";
import { getAuthorityId, matchThreadIds } from "../helper";
import { isValidJsonString, isValidMessageType } from "../validity";

/**
 * Decode and validate message
 * TODO: clean up error handling
 * @param message - {@link Message}
 * @param envName - environment name (e.g. "production", "test", etc)
 * @returns Decoded message - {@link MessageObject}
 */
export function decodeMessage(
  message: Message,
  envName: string
): MessageObject | void {
  if (
    message.contentType?.authorityId === getAuthorityId(envName) &&
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
 * Filter messages by authority ID
 * @param messages - array of messages
 * @param envName - environment name (e.g. "production", "test", etc)
 * @returns Messages - {@link Message}[]
 */
export function filterByAuthorityId(
  messages: Message[],
  envName: string
): Message[] {
  return messages.filter(
    (message) =>
      message.contentType?.authorityId === ContentTypeBoson(envName).authorityId
  );
}

/**
 * This splits a conversation between the
 * client and the relevant counterparty
 * into individual chat threads
 * TODO: refactor/optimise
 * @param messages - array of messages
 * @param counterparty - wallet address
 * @param envName - environment name (e.g. "production", "test", etc)
 * @returns Threads - {@link ThreadObject}[]
 */
export async function splitConversation(
  messages: Message[],
  counterparty: string,
  envName: string
): Promise<ThreadObject[]> {
  const threads: ThreadObject[] = [];

  for (const message of messages) {
    const decodedMessage: MessageObject = decodeMessage(
      message,
      envName
    ) as MessageObject;

    if (decodedMessage && isValidMessageType(decodedMessage.contentType)) {
      const arrayIndex: number = threads.findIndex((thread) =>
        matchThreadIds(thread.threadId, decodedMessage.threadId)
      );

      // if this thread does not already exist in the threads array then add it
      if (arrayIndex === -1) {
        threads.push({
          threadId: decodedMessage.threadId,
          counterparty: counterparty,
          messages: []
        });
      } else {
        const messageWrapper: MessageData = {
          authorityId: message.contentType?.authorityId as string,
          timestamp: message.header.timestamp,
          sender: message.senderAddress as string,
          recipient: message.recipientAddress as string,
          data: decodedMessage
        };
        threads[arrayIndex].messages.push(messageWrapper);
      }
    }
  }

  return threads;
}

/**
 * Create a worker thread instance
 * @param filePath - file path
 * @param messages - array of messages
 * @param counterparty - wallet address
 * @param envName - environment name (e.g. "production", "test", etc)
 * @returns Threads - {@link ThreadObject}[]
 */
export function createWorker(
  filePath: string,
  messages: Message[],
  counterparty: string,
  envName: string
): Promise<ThreadObject[]> {
  return new Promise((resolve, reject) => {
    const worker = new window.Worker(filePath);
    worker.postMessage({
      messages,
      counterparty,
      envName
    });
    worker.addEventListener("message", (e) => {
      const data = e.data as ThreadObject[];
      resolve(data);
    });
    worker.addEventListener("error", (err) => {
      reject(`Error: ${err}`);
    });
  });
}
