import { createToolParameters } from "@goat-sdk/core";
import type { XmtpEnv } from "@xmtp/node-sdk";

import {
  getThreadsValidation,
  getThreadValidation,
  initializeClientValidation,
  revokeAllOtherInstallationsValidation,
  revokeInstallationsValidation,
  sendMessageValidation,
  xmtpEnvironmentsValidation,
} from "../validation.js";

// XMTP Environment parameters
export class GetXmtpEnvironmentsParameters extends createToolParameters(
  xmtpEnvironmentsValidation,
) {}

// XMTP Client management parameters
export class InitializeXmtpClientParameters extends createToolParameters(
  initializeClientValidation,
) {}

export class RevokeAllOtherInstallationsParameters extends createToolParameters(
  revokeAllOtherInstallationsValidation,
) {}

export class RevokeInstallationsParameters extends createToolParameters(
  revokeInstallationsValidation,
) {}

// XMTP Thread management parameters
export class GetXmtpThreadsParameters extends createToolParameters(
  getThreadsValidation,
) {}

export class GetXmtpThreadParameters extends createToolParameters(
  getThreadValidation,
) {}

// XMTP Message parameters
export class SendXmtpMessageParameters extends createToolParameters(
  sendMessageValidation,
) {}

// Convenience parameters for specific message types
// These exclude privateKey as it's injected by the service
export class SendStringMessageParameters {
  configId!: string;
  xmtpEnvName!: XmtpEnv;
  recipient!: string;
  threadId!: {
    sellerId: string;
    buyerId: string;
    exchangeId: string;
  };
  message!: string;
  metadata?: Record<string, unknown>;
}

export class SendFileMessageParameters {
  configId!: string;
  xmtpEnvName!: XmtpEnv;
  recipient!: string;
  threadId!: {
    sellerId: string;
    buyerId: string;
    exchangeId: string;
  };
  fileName!: string;
  fileType!: string;
  fileSize!: number;
  encodedContent!: string;
  metadata?: Record<string, unknown>;
}

export class SendProposalMessageParameters {
  configId!: string;
  xmtpEnvName!: XmtpEnv;
  recipient!: string;
  threadId!: {
    sellerId: string;
    buyerId: string;
    exchangeId: string;
  };
  title!: string;
  description!: string;
  disputeContext!: string[];
  proposals!: Array<{
    type: string;
    percentageAmount: string;
    signature: string;
  }>;
  metadata?: Record<string, unknown>;
}

export class SendCounterProposalMessageParameters {
  configId!: string;
  xmtpEnvName!: XmtpEnv;
  recipient!: string;
  threadId!: {
    sellerId: string;
    buyerId: string;
    exchangeId: string;
  };
  title!: string;
  description!: string;
  disputeContext!: string[];
  proposals!: Array<{
    type: string;
    percentageAmount: string;
    signature: string;
  }>;
  metadata?: Record<string, unknown>;
}

export class SendAcceptProposalMessageParameters {
  configId!: string;
  xmtpEnvName!: XmtpEnv;
  recipient!: string;
  threadId!: {
    sellerId: string;
    buyerId: string;
    exchangeId: string;
  };
  title!: string;
  proposal!: {
    type: string;
    percentageAmount: string;
    signature: string;
  };
  icon!: string;
  heading!: string;
  body!: string;
  metadata?: Record<string, unknown>;
}

export class SendEscalateDisputeMessageParameters {
  configId!: string;
  xmtpEnvName!: XmtpEnv;
  recipient!: string;
  threadId!: {
    sellerId: string;
    buyerId: string;
    exchangeId: string;
  };
  title!: string;
  description!: string;
  disputeResolverInfo!: Array<{
    label: string;
    value: string;
  }>;
  icon!: string;
  heading!: string;
  body!: string;
  metadata?: Record<string, unknown>;
}
