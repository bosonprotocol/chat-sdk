import type { MessageData } from "./v0.0.1/definitions.js";
import { validateMessage as validateV001 } from "./v0.0.1/validators.js";

type Options = Partial<{ logError: boolean; throwError: boolean }>;

export const validateMessage = (
  messageData: MessageData["data"],
  { logError, throwError }: Options = {} as Options,
): boolean => {
  try {
    switch (messageData?.version) {
      case "0.0.1": {
        validateV001(messageData);
        break;
      }
      default:
        throw new Error(`Unsupported message version=${messageData?.version}`);
    }
  } catch (error) {
    if (logError) {
      console.error(error);
    }
    if (throwError) {
      throw error;
    }
    return false;
  }

  return true;
};
