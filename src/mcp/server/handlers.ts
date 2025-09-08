import { z } from "zod";
import { ListMessagesOptions } from "@xmtp/node-sdk";

import {
  getThreadsValidation,
  getThreadValidation,
  sendMessageValidation
} from "./validation.js";
import { formatErrorMessage } from "./errorHandling.js";
import { BosonXmtpClient } from "../../node/index.js";
import { log } from "./logger.js";
import { stringifyWithBigInt } from "./jsonUtils.js";

function logAndThrowError(error: unknown, operation: string): never {
  const errorMessage = formatErrorMessage(error);
  log(`Error in ${operation}:`, errorMessage);
  throw new Error(`${operation} failed: ${errorMessage}`);
}

export function createInitializeClientHandler(
  getClient?: () => Promise<BosonXmtpClient>
) {
  return async function initializeClient(): Promise<string> {
    try {
      log("Initializing XMTP client:");

      if (!getClient) {
        throw new Error("Client getter not provided");
      }

      const client = await getClient();
      const inboxId = client.inboxId;

      return stringifyWithBigInt({
        success: true,
        data: {
          inboxId
        }
      });
    } catch (error) {
      logAndThrowError(error, "initialize XMTP client");
    }
  };
}

export function createGetThreadsHandler(
  getClient?: () => Promise<BosonXmtpClient>
) {
  return async function getThreads(
    params: z.infer<typeof getThreadsValidation>
  ): Promise<string> {
    try {
      log("Getting XMTP threads:", stringifyWithBigInt(params));

      if (!getClient) {
        throw new Error("Client getter not provided");
      }

      const client = await getClient();
      const { counterparties, options } = params;

      // Convert options to ListMessagesOptions if provided
      const safeOptions: ListMessagesOptions | undefined = options;

      const threads = await client.getThreads(counterparties, safeOptions);

      return stringifyWithBigInt({
        success: true,
        data: {
          threads,
          count: threads.length
        }
      });
    } catch (error) {
      logAndThrowError(error, "get XMTP threads");
    }
  };
}

export function createGetThreadHandler(
  getClient?: () => Promise<BosonXmtpClient>
) {
  return async function getThread(
    params: z.infer<typeof getThreadValidation>
  ): Promise<string> {
    try {
      log("Getting XMTP thread:", stringifyWithBigInt(params));

      if (!getClient) {
        throw new Error("Client getter not provided");
      }

      const client = await getClient();
      const { threadId, counterparty, options } = params;

      // Convert options to ListMessagesOptions if provided
      const listMessagesOptions: ListMessagesOptions | undefined = options;

      const thread = await client.getThread(
        threadId,
        counterparty,
        listMessagesOptions
      );

      if (!thread) {
        return stringifyWithBigInt({
          success: false,
          error: "Thread not found",
          data: null
        });
      }

      return stringifyWithBigInt({
        success: true,
        data: thread
      });
    } catch (error) {
      logAndThrowError(error, "get XMTP thread");
    }
  };
}

export function createSendMessageHandler(
  getClient?: () => Promise<BosonXmtpClient>
) {
  return async function sendMessage(
    params: z.infer<typeof sendMessageValidation>
  ): Promise<string> {
    try {
      log("Sending XMTP message:", stringifyWithBigInt(params));

      if (!getClient) {
        throw new Error("Client getter not provided");
      }

      const client = await getClient();
      const { messageObject, recipient } = params;

      const messageData = await client.encodeAndSendMessage(
        // TODO: types inferred from zod are more specific than the method signature so the type should actually be updated from the zod schema
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messageObject as any,
        recipient
      );

      if (!messageData) {
        return stringifyWithBigInt({
          success: false,
          error: "Failed to send message",
          data: null
        });
      }

      return stringifyWithBigInt({
        success: true,
        data: messageData
      });
    } catch (error) {
      logAndThrowError(error, "send XMTP message");
    }
  };
}
