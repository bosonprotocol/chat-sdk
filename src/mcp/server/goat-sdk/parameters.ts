import { createToolParameters } from "@goat-sdk/core";
import { z } from "zod";

import {
  commonToolSchema,
  ethereumAddressValidation,
  getThreadsValidation,
  getThreadValidation,
  initializeClientValidation,
  proposalItemSchema,
  revokeAllOtherInstallationsValidation,
  revokeInstallationsValidation,
  sendMessageValidation,
  threadIdSchema,
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

// Create validation schemas that match the convenience method parameters
const baseMessageToolSchema = commonToolSchema.extend({
  recipient: ethereumAddressValidation,
  threadId: threadIdSchema,
  metadata: z.record(z.any()).optional(),
});

const sendStringMessageValidation = baseMessageToolSchema.extend({
  message: z.string(),
});

const sendFileMessageValidation = baseMessageToolSchema.extend({
  fileName: z.string(),
  fileType: z.string(),
  fileSize: z.number().positive().int(),
  encodedContent: z
    .string()
    .refine((val) => val.startsWith("data:") && val.includes(","), {
      message: "Must be a valid data URL",
    }),
});

const sendProposalMessageValidation = baseMessageToolSchema.extend({
  title: z.string(),
  description: z.string(),
  disputeContext: z.array(z.string()),
  proposals: z.array(proposalItemSchema),
});

const sendCounterProposalMessageValidation = baseMessageToolSchema.extend({
  title: z.string(),
  description: z.string(),
  disputeContext: z.array(z.string()),
  proposals: z.array(proposalItemSchema),
});

const sendAcceptProposalMessageValidation = baseMessageToolSchema.extend({
  title: z.string(),
  proposal: proposalItemSchema,
  icon: z.string(),
  heading: z.string(),
  body: z.string(),
});

const sendEscalateDisputeMessageValidation = baseMessageToolSchema.extend({
  title: z.string(),
  description: z.string(),
  disputeResolverInfo: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
    }),
  ),
  icon: z.string(),
  heading: z.string(),
  body: z.string(),
});

// Convenience parameters for specific message types using createToolParameters
export class SendStringMessageParameters extends createToolParameters(
  sendStringMessageValidation,
) {}

export class SendFileMessageParameters extends createToolParameters(
  sendFileMessageValidation,
) {}

export class SendProposalMessageParameters extends createToolParameters(
  sendProposalMessageValidation,
) {}

export class SendCounterProposalMessageParameters extends createToolParameters(
  sendCounterProposalMessageValidation,
) {}

export class SendAcceptProposalMessageParameters extends createToolParameters(
  sendAcceptProposalMessageValidation,
) {}

export class SendEscalateDisputeMessageParameters extends createToolParameters(
  sendEscalateDisputeMessageValidation,
) {}
