import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { RequestOptions } from "@modelcontextprotocol/sdk/shared/protocol.js";

import { BosonXmtpMCPClient } from "./boson-client.js";

export class BosonXmtpMCPClientHttp extends BosonXmtpMCPClient {
  constructor(private url: string | URL) {
    super();
  }
  async connectToServer({ options }: { options?: RequestOptions }) {
    this._isConnected = false;
    try {
      this.transport = new StreamableHTTPClientTransport(new URL(this.url), {
        reconnectionOptions: {
          maxReconnectionDelay: process.env.CI ? 120_000 : 60_000,
          initialReconnectionDelay: process.env.CI ? 5_000 : 1_000,
          maxRetries: process.env.CI ? 5 : 2,
          reconnectionDelayGrowFactor: 1.5,
        },
      });
      await this.mcp.connect(this.transport, options);
      this._isConnected = true;
    } catch (error) {
      console.error("Streamable HTTP connection failed", error);
    }
  }
}
