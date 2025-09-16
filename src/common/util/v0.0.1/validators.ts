import validDataUrl from "valid-data-url";
import { array, mixed, number, object, string } from "yup";

import type { MessageData } from "./definitions.js";
import { MessageType, SupportedFileMimeTypes, version } from "./definitions.js";

const stringContentTypeSchema = object({
  value: string().required(),
});

const fileContentTypeSchema = object({
  value: object({
    fileName: string().required(),
    fileType: string().required().oneOf(Object.values(SupportedFileMimeTypes)),
    fileSize: number().required().positive().integer(),
    encodedContent: string()
      .required()
      .test(
        "isValidDataUrl",
        "The encoded content of this file is not a valid data url",
        (encodedContent) => {
          return validDataUrl(encodedContent);
        },
      ),
  }),
});

const proposalContentTypeSchema = object({
  value: object({
    title: string().required(),
    description: string().required(),
    disputeContext: array().of(string()).required(),
    proposals: array(
      object({
        type: string().required(),
        percentageAmount: string()
          .required()
          .test(
            "isAPositiveInteger",
            "Percentage amount should be a positive integer, without even a dot",
            (value) => {
              if (!value) {
                return false;
              }
              return (
                !!number()
                  .required()
                  .positive()
                  .integer()
                  .isValidSync(Number(value)) && !value.includes(".")
              );
            },
          ),
        signature: string().required(),
      }),
    ),
  }),
});

export const validateMessage = (messageData: MessageData["data"]) => {
  const messageDataSchema = object({
    threadId: object({
      exchangeId: string(),
      buyerId: string(),
      sellerId: string(),
    }).required(),
    contentType: string().required().oneOf(Object.values(MessageType)),
    version: string().required().oneOf([version]),
    content: mixed().required(),
  });
  messageDataSchema.validateSync(messageData, { strict: true });

  // validate content based on contentType
  switch (messageData.contentType) {
    case MessageType.String: {
      stringContentTypeSchema.validateSync(messageData.content, {
        strict: true,
      });
      break;
    }
    case MessageType.File: {
      fileContentTypeSchema.validateSync(messageData.content, { strict: true });
      break;
    }
    case MessageType.Proposal: {
      proposalContentTypeSchema.validateSync(messageData.content, {
        strict: true,
      });
      break;
    }
    // TODO: missing other content types
  }
};
