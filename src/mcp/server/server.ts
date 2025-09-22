#!/usr/bin/env node
import { randomUUID } from "node:crypto";

import type { ConfigId } from "@bosonprotocol/common";
import { getConfigFromConfigId } from "@bosonprotocol/common";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import type { XmtpEnv } from "@xmtp/node-sdk";
import type { Wallet } from "ethers";
import { ethers } from "ethers";
import type { NextFunction, Request, Response } from "express";

import { supportedXmtpEnvs } from "../../common/const.js";
import type { AuthorityIdEnvName } from "../../common/util/v0.0.1/functions.js";
import { BosonXmtpNodeClient } from "../../node/index.js";
import { loadConfigEnv, parseArgs } from "./configLoader.js";
// Import handlers
import {
  createGetThreadHandler,
  createGetThreadsHandler,
  createInitializeClientHandler,
  createSendMessageHandler,
  revokeAllOtherInstallationsHandler,
  revokeInstallationsHandler,
} from "./handlers.js";
import { log } from "./logger.js";
import type { ReturnTypeMcp } from "./mcpTypes.js";
// Import validations
import type { CreateClientTypes } from "./validation.js";
import {
  getThreadsValidation,
  getThreadValidation,
  initializeClientValidation,
  revokeAllOtherInstallationsValidation,
  revokeInstallationsValidation,
  sendMessageValidation,
  xmtpEnvironmentsValidation,
} from "./validation.js";

class XmtpMCPServer {
  private clients: Map<string, BosonXmtpNodeClient> = new Map();

  constructor() {
    // Error handling will be set up per server instance
  }

  private getClientKey(
    signerAddress: string,
    envName: AuthorityIdEnvName,
    xmtpEnvName: XmtpEnv,
  ): string {
    return `${signerAddress}-${envName}-${xmtpEnvName}`;
  }

  private async getOrCreateClient(
    privateKey: string,
    envName: AuthorityIdEnvName,
    xmtpEnvName: XmtpEnv,
  ): Promise<BosonXmtpNodeClient> {
    const provider = new ethers.providers.JsonRpcProvider();
    const wallet = new ethers.Wallet(privateKey, provider);
    const signerAddress = await wallet.getAddress();
    const clientKey = this.getClientKey(signerAddress, envName, xmtpEnvName);

    if (!this.clients.has(clientKey)) {
      const client = await BosonXmtpNodeClient.initialise(
        wallet,
        xmtpEnvName,
        envName,
      );

      this.clients.set(clientKey, client);
    }

    return this.clients.get(clientKey) as BosonXmtpNodeClient;
  }

  private createHandler<T>(
    handlerFactory: (
      clientGetter: (() => Promise<BosonXmtpNodeClient>) | undefined,
      signerGetter?: () => Wallet,
    ) => (args: T) => Promise<string>,
    {
      requiresClient,
      requiresSigner,
    }: { requiresClient: boolean; requiresSigner: boolean },
  ) {
    return async (args: T & Partial<CreateClientTypes>): Promise<string> => {
      if (requiresClient && !requiresSigner) {
        const { configId, privateKey, xmtpEnvName } = args;
        if (!privateKey || !configId || !xmtpEnvName) {
          throw new Error( // we dont want to expose privateKey in error
            `privateKey, configId (${configId}), and xmtpEnvName (${xmtpEnvName}) are required`,
          );
        }
        const config = getConfigFromConfigId(configId as ConfigId);
        const envName: AuthorityIdEnvName =
          `${config.envName}-${config.contracts.protocolDiamond}` as AuthorityIdEnvName;
        const clientGetter = () =>
          this.getOrCreateClient(privateKey, envName, xmtpEnvName);

        const handler = handlerFactory(clientGetter);
        return await handler(args);
      } else if (!requiresClient && requiresSigner) {
        const { privateKey } = args;
        if (!privateKey) {
          throw new Error( // we dont want to expose privateKey in error
            `privateKey is required`,
          );
        }
        const provider = new ethers.providers.JsonRpcProvider();
        const wallet = new ethers.Wallet(privateKey, provider);
        const signerGetter = () => {
          return wallet;
        };

        const handler = handlerFactory(undefined, signerGetter);
        return await handler(args);
      } else {
        throw new Error("Handler must require either client or signer");
      }
    };
  }

  private createToolHandler<T>(
    handlerFactory: (
      clientGetter: (() => Promise<BosonXmtpNodeClient>) | undefined,
      signerGetter?: () => Wallet,
    ) => (args: T) => Promise<string>,
    requirements: { requiresClient: boolean; requiresSigner: boolean },
  ) {
    return async (
      args: T & Partial<CreateClientTypes>,
    ): Promise<ReturnTypeMcp> => {
      const result = await this.createHandler(
        handlerFactory,
        requirements,
      )(args);
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    };
  }

  private createServerInstance(): McpServer {
    const server = new McpServer(
      {
        name: "xmtp-boson-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          completions: {},
        },
      },
    );

    this.setupToolHandlers(server);
    this.setupErrorHandling(server);
    return server;
  }

  private setupErrorHandling(server: McpServer): void {
    process.on("SIGINT", async () => {
      try {
        await server.close();
      } catch (error) {
        console.error("Error closing server:", error);
      }
      process.exit(0);
    });
  }

  private setupToolHandlers(server: McpServer): void {
    server.tool(
      "get_xmtp_environments",
      "Get the list of supported XMTP environments",
      xmtpEnvironmentsValidation.shape,
      () => {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                data: { environments: supportedXmtpEnvs },
              }),
            },
          ],
        };
      },
    );

    server.tool(
      "initialize_xmtp_client",
      "Initialize an XMTP client for a specific signer and environment",
      initializeClientValidation.shape,
      (args) => {
        const validatedArgs = initializeClientValidation.parse(args);
        return this.createToolHandler(createInitializeClientHandler, {
          requiresClient: true,
          requiresSigner: false,
        })(validatedArgs);
      },
    );

    server.tool(
      "revoke_all_other_installations",
      "Revoke all other XMTP installations for the client except the current one",
      revokeAllOtherInstallationsValidation.shape,
      (args) => {
        const validatedArgs = revokeAllOtherInstallationsValidation.parse(args);
        return this.createToolHandler(revokeAllOtherInstallationsHandler, {
          requiresClient: true,
          requiresSigner: false,
        })(validatedArgs);
      },
    );

    server.tool(
      "revoke_installations",
      "Revoke installations for the given inbox IDs",
      revokeInstallationsValidation.shape,
      (args) => {
        const validatedArgs = revokeInstallationsValidation.parse(args);
        return this.createToolHandler(revokeInstallationsHandler, {
          requiresClient: false,
          requiresSigner: true,
        })(validatedArgs);
      },
    );

    server.tool(
      "get_xmtp_threads",
      "Get all chat threads between the client and specified counter-parties",
      getThreadsValidation.shape,
      (args) => {
        const validatedArgs = getThreadsValidation.parse(args);
        return this.createToolHandler(createGetThreadsHandler, {
          requiresClient: true,
          requiresSigner: false,
        })(validatedArgs);
      },
    );

    server.tool(
      "get_xmtp_thread",
      "Get a specific thread between the client and a counter-party",
      getThreadValidation.shape,
      (args) => {
        const validatedArgs = getThreadValidation.parse(args);
        return this.createToolHandler(createGetThreadHandler, {
          requiresClient: true,
          requiresSigner: false,
        })(validatedArgs);
      },
    );

    server.tool(
      "send_xmtp_message",
      "Send a message to a recipient via XMTP",
      sendMessageValidation.shape,
      (args) => {
        const validatedArgs = sendMessageValidation.parse(args);
        return this.createToolHandler(createSendMessageHandler, {
          requiresClient: true,
          requiresSigner: false,
        })(validatedArgs);
      },
    );
  }

  private async startStdio() {
    const server = this.createServerInstance();
    log("Environment variables", process.env);
    const transport = new StdioServerTransport();
    await server.connect(transport);
    log("XMTP Boson MCP server running on stdio");
  }

  private async startHttp(
    port = process.env.PORT ? Number(process.env.PORT) : 3001,
  ) {
    try {
      const { default: express } = await import("express");
      const app = express();
      app.use(express.json());
      log("Environment variables", process.env);

      // Get allowed hosts from environment variable
      const allowedHosts = process.env.ALLOWED_HOSTS?.split(",").map((h) =>
        h.trim(),
      ) || ["127.0.0.1", "localhost"];

      // Security middleware - Origin and Host header validation
      app.use((req: Request, res: Response, next: NextFunction): void => {
        // Validate Host header to prevent DNS rebinding attacks
        const host = req.headers.host;
        if (host) {
          const isHostAllowed = allowedHosts.some(
            (allowedHost) =>
              host === allowedHost || host.startsWith(`${allowedHost}:`),
          );
          if (!isHostAllowed) {
            res.status(400).json({ error: "Invalid Host header" });
            return;
          }
        }

        // Validate Origin header - allow configured hosts with current port
        const origin = req.headers.origin;
        const allowedOrigins = allowedHosts.flatMap((host) => [
          `http://${host}:${port}`,
          `https://${host}:${port}`,
        ]);

        if (origin && !allowedOrigins.includes(origin)) {
          res.status(403).json({ error: "Origin not allowed" });
          return;
        }

        // Set CORS headers for allowed origins
        if (!origin || allowedOrigins.includes(origin)) {
          res.header(
            "Access-Control-Allow-Origin",
            origin || `http://${allowedHosts[0]}:${port}`,
          );
          res.header(
            "Access-Control-Allow-Methods",
            "GET, POST, PUT, DELETE, OPTIONS",
          );
          res.header(
            "Access-Control-Allow-Headers",
            "Origin, X-Requested-With, Content-Type, Accept, Authorization",
          );
        }

        if (req.method === "OPTIONS") {
          res.sendStatus(200);
          return;
        } else {
          next();
        }
      });

      // Root endpoint
      app.get("/", (_, res) => {
        res.json({
          name: "XMTP Boson MCP Server",
          version: "1.0.0",
          description: "MCP Server for XMTP Boson Protocol operations",
          endpoints: {
            health: "/health",
            mcp: "/mcp",
          },
          status: "running",
          transport: "Streamable HTTP",
        });
      });

      // Health check endpoint
      app.get("/health", (_, res) => {
        res.json({
          status: "ok",
          timestamp: new Date().toISOString(),
          server: "XMTP Boson MCP Server",
          activeClients: this.clients.size,
        });
      });

      // Map to store transports by session ID
      const transports: { [sessionId: string]: StreamableHTTPServerTransport } =
        {};

      app.post("/mcp", async (req, res) => {
        const sessionId = req.headers["mcp-session-id"] as string | undefined;
        let transport: StreamableHTTPServerTransport;

        if (sessionId && transports[sessionId]) {
          transport = transports[sessionId];
        } else if (!sessionId && isInitializeRequest(req.body)) {
          const server = this.createServerInstance();
          transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (sessionId) => {
              transports[sessionId] = transport;
            },
          });

          transport.onclose = () => {
            log("transport has been closed");
            if (transport.sessionId) {
              delete transports[transport.sessionId];
            }
          };

          await server.connect(transport);
        } else {
          res.status(400).json({
            jsonrpc: "2.0",
            error: {
              code: -32000,
              message: "Bad Request: No valid session ID provided",
            },
            id: null,
          });
          return;
        }

        await transport.handleRequest(req, res, req.body);
      });

      app.get("/mcp", async (req, res) => {
        const sessionId = req.headers["mcp-session-id"] as string | undefined;
        if (!sessionId || !transports[sessionId]) {
          res.status(400).send("Invalid or missing session ID");
          return;
        }

        const transport = transports[sessionId];
        await transport.handleRequest(req, res);
      });

      app.delete("/mcp", async (req, res) => {
        const sessionId = req.headers["mcp-session-id"] as string | undefined;
        if (!sessionId || !transports[sessionId]) {
          res.status(400).send("Invalid or missing session ID");
          return;
        }

        const transport = transports[sessionId];
        await transport.handleRequest(req, res);
      });

      // Catch-all for unknown routes
      app.use((req, res) => {
        res.status(404).json({
          error: "Not Found",
          message: `The requested endpoint ${req.originalUrl} was not found`,
          availableEndpoints: {
            root: "/",
            health: "/health",
            mcp: "/mcp",
          },
        });
      });

      const bindAddress = process.env.BIND_ADDRESS || "127.0.0.1";

      app.listen(port, bindAddress, (error) => {
        if (error) {
          log(`Error starting server: ${error.message}`);
          return;
        }
        log(`XMTP Boson MCP Server running on http://${bindAddress}:${port}`);
        log(`Web interface: http://${bindAddress}:${port}`);
        log(`MCP endpoint: http://${bindAddress}:${port}/mcp`);
        log(`Health check: http://${bindAddress}:${port}/health`);
      });
    } catch (error) {
      log(`Error starting HTTP server: ${error}`);
      throw error;
    }
  }

  async run(): Promise<void> {
    const args = parseArgs();
    loadConfigEnv(args.config, args.server);
    const useHttp = args.http || process.env.MCP_TRANSPORT === "http";

    if (useHttp) {
      await this.startHttp();
    } else {
      await this.startStdio();
    }
  }
}

export { XmtpMCPServer };

if (process.env.NODE_ENV !== "test" && process.env.VITEST !== "true") {
  const server = new XmtpMCPServer();
  server.run().catch(log);
}
