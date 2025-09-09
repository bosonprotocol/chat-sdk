import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { RequestOptions } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type { XmtpEnv } from "@xmtp/node-sdk";
import type { z } from "zod";

import { MessageType } from "../../common/util/v0.0.1/definitions.js";
import type {
  getThreadsValidation,
  getThreadValidation,
  initializeClientValidation,
  messageObjectSchema,
  revokeAllOtherInstallationsValidation,
  revokeInstallationsValidation,
  sendMessageValidation,
  threadIdSchema,
} from "../server/validation.js";
import { BaseMCPClient } from "./base-client.js";

export class BosonXmtpMCPClient extends BaseMCPClient {
  async connectToServer({
    env,
    options,
  }: {
    env: { privateKey?: string };
    options?: RequestOptions;
  }) {
    this._isConnected = false;
    try {
      this.transport = new StdioClientTransport({
        command: "npx",
        args: ["boson-xmtp-mcp-server"],
        env,
      });
      await this.mcp.connect(this.transport, options);
      this._isConnected = true;
    } catch (error) {
      console.error("Stdio connection failed", error);
    }
  }

  /**
   * Get the list of supported XMTP environments
   */
  async getXmtpEnvironments() {
    return this.mcp.callTool({
      name: "get_xmtp_environments",
      arguments: {},
    });
  }

  /**
   * Initialize an XMTP client for a specific signer and environment
   */
  async initializeXmtpClient(
    params: z.infer<typeof initializeClientValidation>,
  ) {
    return this.mcp.callTool({
      name: "initialize_xmtp_client",
      arguments: params,
    });
  }

  /**
   * Revoke all other XMTP installations for the client except the current one
   */
  async revokeAllOtherInstallations(
    params: z.infer<typeof revokeAllOtherInstallationsValidation>,
  ) {
    return this.mcp.callTool({
      name: "revoke_all_other_installations",
      arguments: params,
    });
  }

  /**
   * Revoke installations for the given inbox IDs
   */
  async revokeInstallations(
    params: z.infer<typeof revokeInstallationsValidation>,
  ) {
    return this.mcp.callTool({
      name: "revoke_installations",
      arguments: params,
    });
  }

  /**
   * Get all chat threads between the client and specified counter-parties
   */
  async getXmtpThreads(params: z.infer<typeof getThreadsValidation>) {
    return this.mcp.callTool({
      name: "get_xmtp_threads",
      arguments: params,
    });
  }

  /**
   * Get a specific thread between the client and a counter-party
   */
  async getXmtpThread(params: z.infer<typeof getThreadValidation>) {
    return this.mcp.callTool({
      name: "get_xmtp_thread",
      arguments: params,
    });
  }

  /**
   * Send a message to a recipient via XMTP
   */
  async sendXmtpMessage(params: z.infer<typeof sendMessageValidation>) {
    return this.mcp.callTool({
      name: "send_xmtp_message",
      arguments: params,
    });
  }

  // Convenience methods for creating different message types

  /**
   * Send a simple string message via XMTP
   */
  async sendStringMessage({
    privateKey,
    configId,
    xmtpEnvName,
    recipient,
    threadId,
    message,
    metadata,
  }: {
    privateKey: string;
    configId: string;
    xmtpEnvName: XmtpEnv;
    recipient: string;
    threadId: z.infer<typeof threadIdSchema>;
    message: string;
    metadata?: Record<string, unknown>;
  }) {
    const messageObject: z.infer<typeof messageObjectSchema> = {
      threadId,
      contentType: MessageType.String,
      version: "0.0.1" as const,
      content: { value: message },
      ...(metadata && { metadata }),
    };

    return this.sendXmtpMessage({
      privateKey,
      configId,
      xmtpEnvName,
      recipient,
      messageObject,
    });
  }

  /**
   * Send a file message via XMTP
   */
  async sendFileMessage({
    privateKey,
    configId,
    xmtpEnvName,
    recipient,
    threadId,
    fileName,
    fileType,
    fileSize,
    encodedContent,
    metadata,
  }: {
    privateKey: string;
    configId: string;
    xmtpEnvName: XmtpEnv;
    recipient: string;
    threadId: z.infer<typeof threadIdSchema>;
    fileName: string;
    fileType: string;
    fileSize: number;
    encodedContent: string;
    metadata?: Record<string, unknown>;
  }) {
    const messageObject: z.infer<typeof messageObjectSchema> = {
      threadId,
      contentType: MessageType.File,
      version: "0.0.1" as const,
      content: {
        value: {
          fileName,
          fileType,
          fileSize,
          encodedContent,
        },
      },
      ...(metadata && { metadata }),
    };

    return this.sendXmtpMessage({
      privateKey,
      configId,
      xmtpEnvName,
      recipient,
      messageObject,
    });
  }

  /**
   * Send a proposal message via XMTP
   */
  async sendProposalMessage({
    privateKey,
    configId,
    xmtpEnvName,
    recipient,
    threadId,
    title,
    description,
    disputeContext,
    proposals,
    metadata,
  }: {
    privateKey: string;
    configId: string;
    xmtpEnvName: XmtpEnv;
    recipient: string;
    threadId: z.infer<typeof threadIdSchema>;
    title: string;
    description: string;
    disputeContext: string[];
    proposals: Array<{
      type: string;
      percentageAmount: string;
      signature: string;
    }>;
    metadata?: Record<string, unknown>;
  }) {
    const messageObject: z.infer<typeof messageObjectSchema> = {
      threadId,
      contentType: MessageType.Proposal,
      version: "0.0.1" as const,
      content: {
        value: {
          title,
          description,
          disputeContext,
          proposals,
        },
      },
      ...(metadata && { metadata }),
    };

    return this.sendXmtpMessage({
      privateKey,
      configId,
      xmtpEnvName,
      recipient,
      messageObject,
    });
  }

  /**
   * Send a counter-proposal message via XMTP
   */
  async sendCounterProposalMessage({
    privateKey,
    configId,
    xmtpEnvName,
    recipient,
    threadId,
    title,
    description,
    disputeContext,
    proposals,
    metadata,
  }: {
    privateKey: string;
    configId: string;
    xmtpEnvName: XmtpEnv;
    recipient: string;
    threadId: z.infer<typeof threadIdSchema>;
    title: string;
    description: string;
    disputeContext: string[];
    proposals: Array<{
      type: string;
      percentageAmount: string;
      signature: string;
    }>;
    metadata?: Record<string, unknown>;
  }) {
    const messageObject: z.infer<typeof messageObjectSchema> = {
      threadId,
      contentType: MessageType.CounterProposal,
      version: "0.0.1" as const,
      content: {
        value: {
          title,
          description,
          disputeContext,
          proposals,
        },
      },
      ...(metadata && { metadata }),
    };

    return this.sendXmtpMessage({
      privateKey,
      configId,
      xmtpEnvName,
      recipient,
      messageObject,
    });
  }

  /**
   * Send an accept proposal message via XMTP
   */
  async sendAcceptProposalMessage({
    privateKey,
    configId,
    xmtpEnvName,
    recipient,
    threadId,
    title,
    proposal,
    icon,
    heading,
    body,
    metadata,
  }: {
    privateKey: string;
    configId: string;
    xmtpEnvName: XmtpEnv;
    recipient: string;
    threadId: z.infer<typeof threadIdSchema>;
    title: string;
    proposal: {
      type: string;
      percentageAmount: string;
      signature: string;
    };
    icon: string;
    heading: string;
    body: string;
    metadata?: Record<string, unknown>;
  }) {
    const messageObject: z.infer<typeof messageObjectSchema> = {
      threadId,
      contentType: MessageType.AcceptProposal,
      version: "0.0.1" as const,
      content: {
        value: {
          title,
          proposal,
          icon,
          heading,
          body,
        },
      },
      ...(metadata && { metadata }),
    };

    return this.sendXmtpMessage({
      privateKey,
      configId,
      xmtpEnvName,
      recipient,
      messageObject,
    });
  }

  /**
   * Send an escalate dispute message via XMTP
   */
  async sendEscalateDisputeMessage({
    privateKey,
    configId,
    xmtpEnvName,
    recipient,
    threadId,
    title,
    description,
    disputeResolverInfo,
    icon,
    heading,
    body,
    metadata,
  }: {
    privateKey: string;
    configId: string;
    xmtpEnvName: XmtpEnv;
    recipient: string;
    threadId: z.infer<typeof threadIdSchema>;
    title: string;
    description: string;
    disputeResolverInfo: Array<{
      label: string;
      value: string;
    }>;
    icon: string;
    heading: string;
    body: string;
    metadata?: Record<string, unknown>;
  }) {
    const messageObject: z.infer<typeof messageObjectSchema> = {
      threadId,
      contentType: MessageType.EscalateDispute,
      version: "0.0.1" as const,
      content: {
        value: {
          title,
          description,
          disputeResolverInfo,
          icon,
          heading,
          body,
        },
      },
      ...(metadata && { metadata }),
    };

    return this.sendXmtpMessage({
      privateKey,
      configId,
      xmtpEnvName,
      recipient,
      messageObject,
    });
  }
}
