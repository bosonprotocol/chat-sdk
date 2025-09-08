import { BaseMCPClient } from "./base-client";
import { RequestOptions } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export class BosonMCPClient extends BaseMCPClient {
  async connectToServer({
    env,
    options
  }: {
    env: { privateKey?: string };
    options?: RequestOptions;
  }) {
    this._isConnected = false;
    try {
      this.transport = new StdioClientTransport({
        command: "npx",
        args: ["boson-xmtp-mcp-server"],
        env
      });
      await this.mcp.connect(this.transport, options);
      this._isConnected = true;
    } catch (error) {
      console.error("Stdio connection failed", error);
    }
  }
}
