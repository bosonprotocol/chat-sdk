import { ZodError } from "zod";

import { log } from "./logger.js";
import type { ReturnTypeMcp } from "./mcpTypes.js";

/**
 * Extracts error message from unknown error type
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof ZodError) {
    const errorMessages = error.errors.map((err) => {
      const path = err.path.length > 0 ? `${err.path.join(".")}: ` : "";
      return `${path}${err.message}`;
    });
    return errorMessages.join(", ");
  }
  if (error instanceof Error) {
    // Handle Yup ValidationError from Boson Protocol SDK
    if (error.name === "ValidationError" && "errors" in error) {
      const yupErrors = error.errors as string[];
      return yupErrors.join(", ");
    }
    return error.message;
  }
  if (error && typeof error === "object") {
    try {
      return JSON.stringify(error);
    } catch {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      return String(error);
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  return String(error);
}

/**
 * Extracts comprehensive error details for debugging
 */
export function extractErrorDetails(error: unknown): {
  message: string;
  details: unknown;
} {
  let errorMessage = "Unknown error";
  let errorDetails: null | Record<string, unknown> | object = null;

  if (error instanceof ZodError) {
    const errorMessages = error.errors.map((err) => {
      const path = err.path.length > 0 ? `${err.path.join(".")}: ` : "";
      return `${path}${err.message}`;
    });
    errorMessage = errorMessages.join(", ");
    errorDetails = {
      name: error.name,
      validationErrors: error.errors,
    };
  } else if (error instanceof Error) {
    // Handle Yup ValidationError from Boson Protocol SDK
    if (error.name === "ValidationError" && "errors" in error) {
      const yupErrors = error.errors as string[];
      errorMessage = yupErrors.join(", ");
      errorDetails = {
        name: error.name,
        validationErrors: error.errors,
      };
    } else {
      errorMessage = error.message;
      errorDetails = {
        name: error.name,
        stack: error.stack,
      };
    }
  } else if (error && typeof error === "object") {
    try {
      errorMessage = JSON.stringify(error);
      errorDetails = error;
    } catch {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      errorMessage = String(error);
    }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    errorMessage = String(error);
  }

  return { message: errorMessage, details: errorDetails };
}

/**
 * Creates standardized error response for MCP tools
 */
export function createErrorResponse(
  error: unknown,
  operationMessage: string,
): ReturnTypeMcp {
  const { message: errorMessage, details: errorDetails } =
    extractErrorDetails(error);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            success: false,
            error: errorMessage,
            errorDetails,
            message: operationMessage,
          },
          null,
          2,
        ),
      },
    ],
  };
}

/**
 * Logs error and throws formatted error for simple error handling
 */
export function logAndThrowError(error: unknown, operationName: string): never {
  log(`Error ${operationName}:`, error);
  throw new Error(`Failed to ${operationName}: ${formatErrorMessage(error)}`);
}

/**
 * Logs error and rethrows original error for simple error handling
 */
export function logAndRethrowError(
  error: unknown,
  operationName: string,
): never {
  log(`Error ${operationName}:`, error);
  throw error;
}

/**
 * Logs error and returns standardized error response for MCP tools
 */
export function logAndReturnError(
  error: unknown,
  logMessage: string,
  operationMessage: string,
): ReturnTypeMcp {
  log(logMessage, error);
  return createErrorResponse(error, operationMessage);
}
