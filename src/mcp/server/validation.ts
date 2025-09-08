import { ethers } from "ethers";
import { z } from "zod";
import {
  MessageType,
  SupportedFileMimeTypes,
} from "../../common/util/v0.0.1/definitions.js";
import { xmtpEnvSchema } from "../../common/const.js";
import { configIdValidation } from "./configValidation.js";

const ethereumAddressValidation = z
  .string()
  .refine((value) => ethers.utils.isAddress(value), {
    message: "Must be a valid Ethereum address",
  });

const privateKey = z
  .string()
  .refine((value) => /^[a-fA-F0-9]{64}$/.test(value));

// Base schemas for XMTP types

export const threadIdSchema = z.object({
  sellerId: z.string(),
  buyerId: z.string(),
  exchangeId: z.string(),
});

export const stringContentTypeSchema = z.object({
  value: z.string(),
});

export const fileContentTypeSchema = z.object({
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

export const proposalContentTypeSchema = z.object({
  value: z.object({
    title: z.string(),
    description: z.string(),
    disputeContext: z.array(z.string()),
    proposals: z.array(proposalItemSchema),
  }),
});

export const stringIconContentSchema = z.object({
  value: z.object({
    icon: z.string(),
    heading: z.string(),
    body: z.string(),
    type: z.string(),
  }),
});

export const acceptProposalContentSchema = z.object({
  value: z.object({
    title: z.string(),
    proposal: proposalItemSchema,
    icon: z.string(),
    heading: z.string(),
    body: z.string(),
  }),
});

export const escalateDisputeContentSchema = z.object({
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

export const messageObjectSchema = z.discriminatedUnion("contentType", [
  z.object({
    threadId: threadIdSchema,
    contentType: z.literal(MessageType.String),
    version: z.enum(["0.0.1"]),
    timestamp: z.number().optional(),
    content: stringContentTypeSchema,
    metadata: z.record(z.any()).optional(),
  }),
  z.object({
    threadId: threadIdSchema,
    contentType: z.literal(MessageType.File),
    version: z.enum(["0.0.1"]),
    timestamp: z.number().optional(),
    content: fileContentTypeSchema,
    metadata: z.record(z.any()).optional(),
  }),
  z.object({
    threadId: threadIdSchema,
    contentType: z.literal(MessageType.Proposal),
    version: z.enum(["0.0.1"]),
    timestamp: z.number().optional(),
    content: proposalContentTypeSchema,
    metadata: z.record(z.any()).optional(),
  }),
  z.object({
    threadId: threadIdSchema,
    contentType: z.literal(MessageType.EscalateDispute),
    version: z.enum(["0.0.1"]),
    timestamp: z.number().optional(),
    content: escalateDisputeContentSchema,
    metadata: z.record(z.any()).optional(),
  }),
  z.object({
    threadId: threadIdSchema,
    contentType: z.literal(MessageType.AcceptProposal),
    version: z.enum(["0.0.1"]),
    timestamp: z.number().optional(),
    content: acceptProposalContentSchema,
    metadata: z.record(z.any()).optional(),
  }),
  z.object({
    threadId: threadIdSchema,
    contentType: z.literal(MessageType.CounterProposal),
    version: z.enum(["0.0.1"]),
    timestamp: z.number().optional(),
    content: proposalContentTypeSchema, // same as proposal
    metadata: z.record(z.any()).optional(),
  }),
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

export const xmtpEnvironmentsValidation = z.object({});

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
