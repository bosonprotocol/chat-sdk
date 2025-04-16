import { object, string, number, mixed, array } from "yup";
import validDataUrl from "valid-data-url";
import {
  MessageData,
  MessageType,
  SupportedFileMimeTypes,
  version
} from "./definitions";

export const validateMessage = (messageData: MessageData["data"]) => {
  const messageDataSchema = object({
    threadId: object({
      exchangeId: string(),
      buyerId: string(),
      sellerId: string()
    }).required(),
    contentType: string().required().oneOf(Object.values(MessageType)),
    version: string().required().oneOf([version]),
    content: mixed().required()
  });
  messageDataSchema.validateSync(messageData, { strict: true });

  // validate content based on contentType
  switch (messageData.contentType) {
    case MessageType.String: {
      object({
        value: string().required()
      }).validateSync(messageData.content, { strict: true });
      break;
    }
    case MessageType.File: {
      object({
        value: object({
          fileName: string().required(),
          fileType: string()
            .required()
            .oneOf(Object.values(SupportedFileMimeTypes)),
          fileSize: number().required().positive().integer(),
          encodedContent: string()
            .required()
            .test(
              "isValidDataUrl",
              "The encoded content of this file is not a valid data url",
              (encodedContent) => {
                return validDataUrl(encodedContent);
              }
            )
            .test(
              "isValidImage",
              "The encoded content of this image is not a valid",
              (encodedContent) => {
                if (!encodedContent) {
                  return false;
                }
                const isImage =
                  encodedContent.substring(0, "data:image/".length) ===
                  "data:image/";
                return isImage;
              }
            )
        })
      }).validateSync(messageData.content, { strict: true });

      break;
    }
    case MessageType.Proposal: {
      object({
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
                        .validateSync(Number(value)) && !value.includes(".")
                    );
                  }
                ),
              signature: string().required()
            })
          )
        })
      }).validateSync(messageData.content, { strict: true });
      break;
    }
  }
};
