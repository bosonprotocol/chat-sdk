import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { RequestOptions } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport";

interface ConnectToServer {
  connectToServer(arg0: {
    env?: Record<string, string>;
    options?: RequestOptions;
  }): Promise<unknown>;
}

export abstract class BaseMCPClient implements ConnectToServer {
  protected mcp: Client;
  protected transport: Transport | null = null;
  protected _isConnected = false;

  constructor() {
    this.mcp = new Client({ name: "mcp-client-cli", version: "1.0.0" });
  }

  get isConnected() {
    return this._isConnected;
  }

  abstract connectToServer(arg0: {
    env?: Record<string, string>;
    options?: RequestOptions;
  }): Promise<unknown>;

  async disconnect() {
    if (this.isConnected && this.transport) {
      await this.transport.close();
      this._isConnected = false;
    }
  }

  async listTools() {
    const toolsResult = await this.mcp.listTools();
    return toolsResult.tools.map((tool) => {
      return {
        name: tool.name,
        description: tool.description,
        input_schema: JSON.stringify(tool.inputSchema),
      };
    });
  }

  async listResources() {
    const resourcesResult = await this.mcp.listResources();
    return resourcesResult.resources.map((resource) => {
      return {
        name: resource.name,
        description: resource.description,
        input_schema: JSON.stringify(resource.inputSchema),
      };
    });
  }

  async listResourceTemplates() {
    const resourceTemplatesResult = await this.mcp.listResourceTemplates();
    return resourceTemplatesResult.resourceTemplates.map((resourceTemplate) => {
      return {
        name: resourceTemplate.name,
        description: resourceTemplate.description,
        input_schema: JSON.stringify(resourceTemplate.inputSchema),
      };
    });
  }
}
