import "reflect-metadata";

import { Tool } from "@goat-sdk/core";
import type { EVMWalletClient } from "@goat-sdk/wallet-evm";
import { z } from "zod";

import type { BosonXmtpMCPClient } from "../../client/boson-client.js";
import type {
  GetXmtpEnvironmentsParameters,
  GetXmtpThreadParameters,
  GetXmtpThreadsParameters,
  InitializeXmtpClientParameters,
  RevokeAllOtherInstallationsParameters,
  RevokeInstallationsParameters,
  SendAcceptProposalMessageParameters,
  SendCounterProposalMessageParameters,
  SendEscalateDisputeMessageParameters,
  SendFileMessageParameters,
  SendProposalMessageParameters,
  SendStringMessageParameters,
  SendXmtpMessageParameters,
} from "./parameters.js";

// Zod validators for MCP response
const mcpResponseSchema = z.object({
  content: z.array(
    z.object({
      type: z.literal("text"),
      text: z.string(),
    }),
  ),
});

const xmtpResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  message: z.string().optional(),
  error: z.string().optional(),
});

export type ReturnTypeMcp = z.infer<typeof mcpResponseSchema>;
export type XmtpResponse = z.infer<typeof xmtpResponseSchema>;

export class BosonXmtpPluginService {
  constructor(
    private mcpClient: BosonXmtpMCPClient,
    private privateKey: string,
  ) {}

  private async connectIfNeeded() {
    if (!this.mcpClient.isConnected) {
      await this.mcpClient.connectToServer({
        env: { privateKey: this.privateKey },
      });
    }
  }

  /**
   * Parse MCP response and return structured data
   * @param mcpResponse - The response from MCP client
   * @returns Parsed response data
   */
  private parseResponse(mcpResponse: ReturnTypeMcp): XmtpResponse {
    // Validate MCP response structure
    const validatedResponse = mcpResponseSchema.parse(mcpResponse);

    // Extract text from content array
    const textResponse = validatedResponse.content[0]?.text;
    if (!textResponse) {
      throw new Error("No text content found in MCP response");
    }

    // Parse JSON response
    const parsedResponse: unknown = JSON.parse(textResponse);
    return xmtpResponseSchema.parse(parsedResponse);
  }

  @Tool({
    name: "get_xmtp_environments",
    description: "Get the list of supported XMTP environments",
  })
  async getXmtpEnvironments(
    walletClient: EVMWalletClient,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _parameters: GetXmtpEnvironmentsParameters = {},
  ) {
    try {
      await this.connectIfNeeded();
      const mcpResponse = await this.mcpClient.getXmtpEnvironments();
      const response = this.parseResponse(mcpResponse as ReturnTypeMcp);

      return {
        success: true,
        data: response.data,
        message: response.message || "Successfully retrieved XMTP environments",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  @Tool({
    name: "initialize_xmtp_client",
    description:
      "Initialize an XMTP client for a specific signer and environment",
  })
  async initializeXmtpClient(
    walletClient: EVMWalletClient,
    parameters: InitializeXmtpClientParameters,
  ) {
    try {
      await this.connectIfNeeded();
      const mcpResponse = await this.mcpClient.initializeXmtpClient({
        ...parameters,
        privateKey: this.privateKey,
      });
      const response = this.parseResponse(mcpResponse as ReturnTypeMcp);

      return {
        success: true,
        data: response.data,
        message: response.message || "Successfully initialized XMTP client",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  @Tool({
    name: "revoke_all_other_installations",
    description:
      "Revoke all other XMTP installations for the client except the current one",
  })
  async revokeAllOtherInstallations(
    walletClient: EVMWalletClient,
    parameters: RevokeAllOtherInstallationsParameters,
  ) {
    try {
      await this.connectIfNeeded();
      const mcpResponse = await this.mcpClient.revokeAllOtherInstallations({
        ...parameters,
        privateKey: this.privateKey,
      });
      const response = this.parseResponse(mcpResponse as ReturnTypeMcp);

      return {
        success: true,
        data: response.data,
        message: response.message || "Successfully revoked other installations",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  @Tool({
    name: "revoke_installations",
    description: "Revoke installations for the given inbox IDs",
  })
  async revokeInstallations(
    walletClient: EVMWalletClient,
    parameters: RevokeInstallationsParameters,
  ) {
    try {
      await this.connectIfNeeded();
      const mcpResponse = await this.mcpClient.revokeInstallations({
        ...parameters,
        privateKey: this.privateKey,
      });
      const response = this.parseResponse(mcpResponse as ReturnTypeMcp);

      return {
        success: true,
        data: response.data,
        message: response.message || "Successfully revoked installations",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  @Tool({
    name: "get_xmtp_threads",
    description:
      "Get all chat threads between the client and specified counter-parties",
  })
  async getXmtpThreads(
    walletClient: EVMWalletClient,
    parameters: GetXmtpThreadsParameters,
  ) {
    try {
      await this.connectIfNeeded();
      const mcpResponse = await this.mcpClient.getXmtpThreads({
        ...parameters,
        privateKey: this.privateKey,
      });
      const response = this.parseResponse(mcpResponse as ReturnTypeMcp);

      return {
        success: true,
        data: response.data,
        message: response.message || "Successfully retrieved XMTP threads",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  @Tool({
    name: "get_xmtp_thread",
    description: "Get a specific thread between the client and a counter-party",
  })
  async getXmtpThread(
    walletClient: EVMWalletClient,
    parameters: GetXmtpThreadParameters,
  ) {
    try {
      await this.connectIfNeeded();
      const mcpResponse = await this.mcpClient.getXmtpThread({
        ...parameters,
        privateKey: this.privateKey,
      });
      const response = this.parseResponse(mcpResponse as ReturnTypeMcp);

      return {
        success: true,
        data: response.data,
        message: response.message || "Successfully retrieved XMTP thread",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  @Tool({
    name: "send_xmtp_message",
    description: "Send a message to a recipient via XMTP",
  })
  async sendXmtpMessage(
    walletClient: EVMWalletClient,
    parameters: SendXmtpMessageParameters,
  ) {
    try {
      await this.connectIfNeeded();
      const mcpResponse = await this.mcpClient.sendXmtpMessage({
        ...parameters,
        privateKey: this.privateKey,
      });
      const response = this.parseResponse(mcpResponse as ReturnTypeMcp);

      return {
        success: true,
        data: response.data,
        message: response.message || "Successfully sent XMTP message",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  @Tool({
    name: "send_string_message",
    description: "Send a simple string message via XMTP",
  })
  async sendStringMessage(
    walletClient: EVMWalletClient,
    parameters: SendStringMessageParameters,
  ) {
    try {
      await this.connectIfNeeded();
      const mcpResponse = await this.mcpClient.sendStringMessage({
        ...parameters,
        privateKey: this.privateKey,
      });
      const response = this.parseResponse(mcpResponse as ReturnTypeMcp);

      return {
        success: true,
        data: response.data,
        message: response.message || "Successfully sent string message",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  @Tool({
    name: "send_file_message",
    description: "Send a file message via XMTP",
  })
  async sendFileMessage(
    walletClient: EVMWalletClient,
    parameters: SendFileMessageParameters,
  ) {
    try {
      await this.connectIfNeeded();
      const mcpResponse = await this.mcpClient.sendFileMessage({
        ...parameters,
        privateKey: this.privateKey,
      });
      const response = this.parseResponse(mcpResponse as ReturnTypeMcp);

      return {
        success: true,
        data: response.data,
        message: response.message || "Successfully sent file message",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  @Tool({
    name: "send_proposal_message",
    description: "Send a proposal message via XMTP",
  })
  async sendProposalMessage(
    walletClient: EVMWalletClient,
    parameters: SendProposalMessageParameters,
  ) {
    try {
      await this.connectIfNeeded();
      const mcpResponse = await this.mcpClient.sendProposalMessage({
        ...parameters,
        privateKey: this.privateKey,
      });
      const response = this.parseResponse(mcpResponse as ReturnTypeMcp);

      return {
        success: true,
        data: response.data,
        message: response.message || "Successfully sent proposal message",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  @Tool({
    name: "send_counter_proposal_message",
    description: "Send a counter-proposal message via XMTP",
  })
  async sendCounterProposalMessage(
    walletClient: EVMWalletClient,
    parameters: SendCounterProposalMessageParameters,
  ) {
    try {
      await this.connectIfNeeded();
      const mcpResponse = await this.mcpClient.sendCounterProposalMessage({
        ...parameters,
        privateKey: this.privateKey,
      });
      const response = this.parseResponse(mcpResponse as ReturnTypeMcp);

      return {
        success: true,
        data: response.data,
        message:
          response.message || "Successfully sent counter-proposal message",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  @Tool({
    name: "send_accept_proposal_message",
    description: "Send an accept proposal message via XMTP",
  })
  async sendAcceptProposalMessage(
    walletClient: EVMWalletClient,
    parameters: SendAcceptProposalMessageParameters,
  ) {
    try {
      await this.connectIfNeeded();
      const mcpResponse = await this.mcpClient.sendAcceptProposalMessage({
        ...parameters,
        privateKey: this.privateKey,
      });
      const response = this.parseResponse(mcpResponse as ReturnTypeMcp);

      return {
        success: true,
        data: response.data,
        message:
          response.message || "Successfully sent accept proposal message",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  @Tool({
    name: "send_escalate_dispute_message",
    description: "Send an escalate dispute message via XMTP",
  })
  async sendEscalateDisputeMessage(
    walletClient: EVMWalletClient,
    parameters: SendEscalateDisputeMessageParameters,
  ) {
    try {
      await this.connectIfNeeded();
      const mcpResponse = await this.mcpClient.sendEscalateDisputeMessage({
        ...parameters,
        privateKey: this.privateKey,
      });
      const response = this.parseResponse(mcpResponse as ReturnTypeMcp);

      return {
        success: true,
        data: response.data,
        message:
          response.message || "Successfully sent escalate dispute message",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
