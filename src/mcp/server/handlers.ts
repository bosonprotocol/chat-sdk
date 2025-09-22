import type { ListMessagesOptions } from "@xmtp/node-sdk";
import type { Wallet } from "ethers";
import type { z } from "zod";

import { createEOASigner } from "../../node/helpers/createSigner.js";
import { BosonXmtpNodeClient } from "../../node/index.js";
import { logAndThrowError } from "./errorHandling.js";
import { stringifyWithBigInt } from "./jsonUtils.js";
import { log } from "./logger.js";
import type {
  getThreadsValidation,
  getThreadValidation,
  revokeInstallationsValidation,
  sendMessageValidation,
} from "./validation.js";

export function createInitializeClientHandler(
  getClient?: () => Promise<BosonXmtpNodeClient>,
) {
  return async function initializeClient(): Promise<string> {
    try {
      log("Initializing XMTP client");

      if (!getClient) {
        return logAndThrowError(
          new Error("Client getter not provided"),
          "initializeClient",
        );
      }

      const client = await getClient();
      const inboxId = client.inboxId;

      return stringifyWithBigInt({
        success: true,
        data: {
          inboxId,
        },
      });
    } catch (error) {
      logAndThrowError(error, "initialize XMTP client");
    }
  };
}
export function revokeAllOtherInstallationsHandler(
  getClient?: () => Promise<BosonXmtpNodeClient>,
) {
  return async function revokeAllOtherInstallations(): Promise<string> {
    try {
      log("Revoking all other installations");

      if (!getClient) {
        return logAndThrowError(
          new Error("Client getter not provided"),
          "revokeAllOtherInstallations",
        );
      }

      const client = await getClient();
      await client.revokeAllOtherInstallations();

      return stringifyWithBigInt({
        success: true,
      });
    } catch (error) {
      logAndThrowError(error, "initialize XMTP client");
    }
  };
}
export function revokeInstallationsHandler(
  _getClient: (() => Promise<BosonXmtpNodeClient>) | undefined,
  getWallet: (() => Wallet) | undefined,
) {
  return async function revokeInstallations(
    params: z.infer<typeof revokeInstallationsValidation>,
  ): Promise<string> {
    try {
      log("Revoking installations for inbox IDs:", params.inboxIds);
      if (!getWallet) {
        return logAndThrowError(
          new Error("Wallet getter not provided"),
          "revokeInstallations",
        );
      }
      const wallet = getWallet();
      await BosonXmtpNodeClient.revokeInstallations({
        inboxIds: params.inboxIds,
        signer: createEOASigner(
          (await wallet.getAddress()) as `0x${string}`,
          wallet,
        ),
        xmtpEnvName: params.xmtpEnvName,
      });

      return stringifyWithBigInt({
        success: true,
      });
    } catch (error) {
      logAndThrowError(error, "initialize XMTP client");
    }
  };
}

export function createGetThreadsHandler(
  getClient?: () => Promise<BosonXmtpNodeClient>,
) {
  return async function getThreads(
    params: z.infer<typeof getThreadsValidation>,
  ): Promise<string> {
    try {
      log("Getting XMTP threads:", stringifyWithBigInt(params));

      if (!getClient) {
        return logAndThrowError(
          new Error("Client getter not provided"),
          "getThreads",
        );
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
          count: threads.length,
        },
      });
    } catch (error) {
      logAndThrowError(error, "get XMTP threads");
    }
  };
}

export function createGetThreadHandler(
  getClient?: () => Promise<BosonXmtpNodeClient>,
) {
  return async function getThread(
    params: z.infer<typeof getThreadValidation>,
  ): Promise<string> {
    try {
      log("Getting XMTP thread:", stringifyWithBigInt(params));

      if (!getClient) {
        return logAndThrowError(
          new Error("Client getter not provided"),
          "getThread",
        );
      }

      const client = await getClient();
      const { threadId, counterparty, options } = params;

      // Convert options to ListMessagesOptions if provided
      const listMessagesOptions: ListMessagesOptions | undefined = options;

      const thread = await client.getThread(
        threadId,
        counterparty,
        listMessagesOptions,
      );

      if (!thread) {
        return logAndThrowError(new Error("Thread not found"), "getThread");
      }

      return stringifyWithBigInt({
        success: true,
        data: thread,
      });
    } catch (error) {
      logAndThrowError(error, "get XMTP thread");
    }
  };
}

export function createSendMessageHandler(
  getClient?: () => Promise<BosonXmtpNodeClient>,
) {
  return async function sendMessage(
    params: z.infer<typeof sendMessageValidation>,
  ): Promise<string> {
    try {
      log("Sending XMTP message:", stringifyWithBigInt(params));

      if (!getClient) {
        return logAndThrowError(
          new Error("Client getter not provided"),
          "sendMessage",
        );
      }

      const client = await getClient();
      const { messageObject, recipient } = params;

      const messageData = await client.encodeAndSendMessage(
        // TODO: types inferred from zod are more specific than the method signature so the type should actually be updated from the zod schema
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messageObject as any,
        recipient,
      );

      if (!messageData) {
        return logAndThrowError(
          new Error("Failed to send message"),
          "sendMessage",
        );
      }

      return stringifyWithBigInt({
        success: true,
        data: messageData,
      });
    } catch (error) {
      logAndThrowError(error, "send XMTP message");
    }
  };
}
