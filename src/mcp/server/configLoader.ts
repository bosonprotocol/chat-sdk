import { readFileSync } from "fs";
import { resolve } from "path";

import { log } from "./logger.js";

// Parse command line arguments
export function parseArgs() {
  const args = process.argv.slice(2);
  const result: { config?: string; server?: string; http?: boolean } = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--mcp-config":
        result.config = args[++i];
        break;
      case "--server":
        result.server = args[++i];
        break;
      case "--http":
        result.http = true;
        break;
    }
  }

  return result;
}

// Load environment variables from config
export function loadConfigEnv(configPath?: string, serverName?: string) {
  if (!configPath || !serverName) return;

  try {
    const configContent = readFileSync(resolve(configPath), "utf-8");
    const config = JSON.parse(configContent);
    const serverConfig = config.mcpServers?.[serverName];
    if (!serverConfig) {
      log(
        `Warning: No configuration found for server ${serverName} in ${configPath}`
      );
      return;
    }
    log(
      `All mcpServers ${JSON.stringify(
        config.mcpServers
      )} using serverName=${serverName} and configPath=${configPath}`
    );
    if (serverConfig.env) {
      Object.entries(serverConfig.env).forEach(([key, value]) => {
        if (typeof value === "string") {
          process.env[key] = value;
        }
      });
      log(
        `Loaded environment variables from ${configPath} for server ${serverName}`
      );
    }
  } catch (error) {
    log(`Warning: Could not load config from ${configPath}:`, error);
  }
}
