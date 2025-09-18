import type { ConfigId } from "@bosonprotocol/common";
import { getConfigFromConfigId } from "@bosonprotocol/common";
import { z } from "zod";

// Default config IDs for testing/fallback
const DEFAULT_CONFIG_IDS = [
  "local-31337-0",
  "testing-80002-0",
  "testing-84532-0",
  "testing-11155111-0",
  "testing-11155420-0",
  "testing-421614-0",
  "staging-80002-0",
  "staging-84532-0",
  "staging-11155111-0",
  "staging-11155420-0",
  "staging-421614-0",
  "production-137-0",
  "production-42161-0",
  "production-8453-0",
  "production-10-0",
  "production-1-0",
] as const satisfies ConfigId[];

function getConfigIdsFromEnv(): ConfigId[] {
  const configIdsEnv = process.env.CONFIG_IDS;

  // Use default config IDs in test environment or when CONFIG_IDS is not set
  if (!configIdsEnv) {
    console.warn(
      "CONFIG_IDS not set in environment variables. Using default config IDs.",
    );
    return DEFAULT_CONFIG_IDS as ConfigId[];
  }

  const configIds = configIdsEnv.split(",").map((id) => id.trim());

  // Validate each config ID using bosonprotocol core-sdk
  for (const configId of configIds) {
    try {
      getConfigFromConfigId(configId as ConfigId);
    } catch (error) {
      throw new Error(
        `Invalid config ID: ${configId}. Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  return configIds as ConfigId[];
}

let _supportedConfigIds: ConfigId[] | null = null;

export const getSupportedConfigIds = (): ConfigId[] => {
  if (_supportedConfigIds === null) {
    _supportedConfigIds = getConfigIdsFromEnv();
  }
  return _supportedConfigIds;
};

export const supportedConfigIds = getSupportedConfigIds();

export const supportedChainIds: number[] = Array.from(
  new Set(
    supportedConfigIds
      .map((configId) => {
        const config = getConfigFromConfigId(configId);
        return config.chainId;
      })
      .filter((chainId) => chainId !== null),
  ),
);

// Config IDs from @bosonprotocol/common
export const configIdValidation = z.string().refine(
  (value) => getSupportedConfigIds().includes(value as ConfigId),
  (value) => ({
    message: `Invalid config ID: ${value}. Supported config IDs: ${getSupportedConfigIds().join(", ")}`,
  }),
);
