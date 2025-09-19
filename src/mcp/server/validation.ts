import { ethers } from "ethers";
import { z } from "zod";

import { xmtpEnvSchema } from "../../common/const.js";
import {
  MessageType,
  SupportedFileMimeTypes,
} from "../../common/util/v0.0.1/definitions.js";
import { configIdValidation } from "./configValidation.js";

export const ethereumAddressValidation = z
  .string()
  .refine((value) => ethers.utils.isAddress(value), {
    message: "Must be a valid Ethereum address",
  });

const privateKey = z
  .string()
  .transform((value) => (value.startsWith("0x") ? value.slice(2) : value))
  .refine((value) => /^[a-fA-F0-9]{64}$/.test(value));

// Base schemas for XMTP types

export const threadIdSchema = z.object({
  sellerId: z.string(),
  buyerId: z.string(),
  exchangeId: z.string(),
});

export const stringMessageSchema = z.object({
  value: z.string(),
});

export const fileMessageSchema = z.object({
  value: z.object({
    fileName: z.string(),
    fileType: z.enum(
      Object.values(SupportedFileMimeTypes) as [string, ...string[]],
    ),
    fileSize: z.number().positive().int(),
    encodedContent: z.string().refine(
      (val) => {
        // Basic data URL validation
        return val.startsWith("data:") && val.includes(",");
      },
      { message: "Must be a valid data URL" },
    ),
  }),
});

export const proposalItemSchema = z.object({
  type: z.string(),
  percentageAmount: z.string().refine(
    (val) => {
      const num = Number(val);
      return (
        !isNaN(num) && num > 0 && Number.isInteger(num) && !val.includes(".")
      );
    },
    { message: "Must be a positive integer without decimal point" },
  ),
  signature: z.string(),
});

export const proposalMessageSchema = z.object({
  value: z.object({
    title: z.string(),
    description: z.string(),
    disputeContext: z.array(z.string()),
    proposals: z.array(proposalItemSchema),
  }),
});

export const stringIconMessageSchema = z.object({
  value: z.object({
    icon: z.string(),
    heading: z.string(),
    body: z.string(),
    type: z.string(),
  }),
});

export const acceptProposalMessageSchema = z.object({
  value: z.object({
    title: z.string(),
    proposal: proposalItemSchema,
    icon: z.string(),
    heading: z.string(),
    body: z.string(),
  }),
});

export const escalateDisputeMessageSchema = z.object({
  value: z.object({
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
  }),
});

const commonContentTypeSchema = z.object({
  threadId: threadIdSchema,
  version: z.enum(["0.0.1"]),
  timestamp: z.number().optional(),
  metadata: z.record(z.any()).optional(),
});

export const stringContentTypeSchema = z.object({
  contentType: z.literal(MessageType.String),
  content: stringMessageSchema,
  ...commonContentTypeSchema.shape,
});
export const fileContentTypeSchema = z.object({
  contentType: z.literal(MessageType.File),
  content: fileMessageSchema,
  ...commonContentTypeSchema.shape,
});
export const proposalContentTypeSchema = z.object({
  contentType: z.literal(MessageType.Proposal),
  content: proposalMessageSchema,
  ...commonContentTypeSchema.shape,
});
export const escalateDisputeContentTypeSchema = z.object({
  contentType: z.literal(MessageType.EscalateDispute),
  content: escalateDisputeMessageSchema,
  ...commonContentTypeSchema.shape,
});
export const acceptProposalContentTypeSchema = z.object({
  contentType: z.literal(MessageType.AcceptProposal),
  content: acceptProposalMessageSchema,
  ...commonContentTypeSchema.shape,
});
export const counterProposalContentTypeSchema = z.object({
  contentType: z.literal(MessageType.CounterProposal),
  content: proposalMessageSchema, // same as proposal
  ...commonContentTypeSchema.shape,
});
export const messageObjectSchema = z.discriminatedUnion("contentType", [
  stringContentTypeSchema,
  fileContentTypeSchema,
  proposalContentTypeSchema,
  escalateDisputeContentTypeSchema,
  acceptProposalContentTypeSchema,
  counterProposalContentTypeSchema,
]);

export const listMessagesOptionsSchema = z
  .object({
    contentTypes: z.array(z.number()).optional(),
    deliveryStatus: z.number().optional(),
    direction: z.number().optional(),
    limit: z.number().optional(),
    sentAfterNs: z.number().optional(),
    sentBeforeNs: z.number().optional(),
  })
  .optional();

// Tool validation schemas
export const commonToolSchema = z.object({
  privateKey: privateKey,
  configId: configIdValidation,
  xmtpEnvName: xmtpEnvSchema,
});

export type CreateClientTypes = z.infer<typeof commonToolSchema>;

export const xmtpEnvironmentsValidation = z.object({
  return: z.boolean(), // not used, but we have to add some parameter here, it can be set to any boolean
});

export const initializeClientValidation = z.object(commonToolSchema.shape);

export const revokeAllOtherInstallationsValidation = z.object(
  commonToolSchema.shape,
);

export const revokeInstallationsValidation = z.object({
  ...commonToolSchema.pick({ xmtpEnvName: true, privateKey: true }).shape,
  inboxIds: z.array(z.string()),
});

export const getThreadsValidation = z.object({
  ...commonToolSchema.shape,
  counterparties: z.array(ethereumAddressValidation),
  options: listMessagesOptionsSchema,
});

export const getThreadValidation = z.object({
  ...commonToolSchema.shape,
  threadId: threadIdSchema,
  counterparty: ethereumAddressValidation,
  options: listMessagesOptionsSchema,
});

export const sendMessageValidation = z.object({
  ...commonToolSchema.shape,
  messageObject: messageObjectSchema,
  recipient: ethereumAddressValidation,
});

// Resource validation schemas
export const getThreadsResourceValidation = z.object({
  ...commonToolSchema.shape,
  counterparties: z.array(ethereumAddressValidation),
  options: listMessagesOptionsSchema,
});

export const getThreadResourceValidation = z.object({
  ...commonToolSchema.shape,
  threadId: threadIdSchema,
  counterparty: ethereumAddressValidation,
  options: listMessagesOptionsSchema,
});
