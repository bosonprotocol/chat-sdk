import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { RequestOptions } from "@modelcontextprotocol/sdk/shared/protocol.js";

import { BosonXmtpMCPClient } from "./boson-client.js";

export class BosonXmtpMCPClientStdio extends BosonXmtpMCPClient {
  async connectToServer({
    env,
    options,
  }: {
    env?: Record<string, string>;
    options?: RequestOptions;
  }) {
    this._isConnected = false;
    try {
      this.transport = new StdioClientTransport({
        command: "npx",
        args: ["boson-xmtp-mcp-server"],
        env,
      });
      await this.mcp.connect(this.transport, options);
      this._isConnected = true;
    } catch (error) {
      console.error("Stdio connection failed", error);
    }
  }
}
