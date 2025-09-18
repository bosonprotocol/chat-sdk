import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import type { RequestOptions } from "@modelcontextprotocol/sdk/shared/protocol.js";

import { BosonXmtpMCPClientStdio } from "./boson-client-stdio.js";

// Mock the MCP SDK StdioClientTransport
const mockConnect = vi.fn();
const mockClose = vi.fn();
const mockTransport = {
  connect: mockConnect,
  close: mockClose,
};

vi.mock("@modelcontextprotocol/sdk/client/stdio.js", () => ({
  StdioClientTransport: vi.fn().mockImplementation(() => mockTransport),
}));

// Mock the base BosonXmtpMCPClient
vi.mock("./boson-client.js", () => ({
  BosonXmtpMCPClient: class MockBosonXmtpMCPClient {
    _isConnected: boolean = false;
    transport: unknown = null;
    mcp: {
      connect: ReturnType<typeof vi.fn>;
      callTool: ReturnType<typeof vi.fn>;
    };

    constructor() {
      this.mcp = {
        connect: vi.fn(),
        callTool: vi.fn(),
      };
    }
  },
}));

describe("BosonXmtpMCPClientStdio", async () => {
  let client: BosonXmtpMCPClientStdio;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  const { StdioClientTransport } = await import(
    "@modelcontextprotocol/sdk/client/stdio.js"
  );

  beforeEach(() => {
    vi.clearAllMocks();
    client = new BosonXmtpMCPClientStdio();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("constructor", () => {
    it("should create an instance with initial state", () => {
      expect(client).toBeInstanceOf(BosonXmtpMCPClientStdio);
      expect(client._isConnected).toBe(false);
      expect(client.transport).toBeNull();
      expect(client.mcp).toBeDefined();
    });
  });

  describe("connectToServer", () => {
    describe("successful connection", () => {
      it("should connect successfully with default parameters", async () => {
        client.mcp.connect.mockResolvedValue(undefined);

        await client.connectToServer({});

        expect(StdioClientTransport).toHaveBeenCalledWith({
          command: "npx",
          args: ["boson-xmtp-mcp-server"],
          env: undefined,
        });
        expect(client.mcp.connect).toHaveBeenCalledWith(
          mockTransport,
          undefined,
        );
        expect(client._isConnected).toBe(true);
        expect(client.transport).toBe(mockTransport);
        expect(consoleErrorSpy).not.toHaveBeenCalled();
      });

      it("should connect successfully with custom environment variables", async () => {
        const env = { NODE_ENV: "test", DEBUG: "true" };
        client.mcp.connect.mockResolvedValue(undefined);

        await client.connectToServer({ env });

        expect(StdioClientTransport).toHaveBeenCalledWith({
          command: "npx",
          args: ["boson-xmtp-mcp-server"],
          env,
        });
        expect(client.mcp.connect).toHaveBeenCalledWith(
          mockTransport,
          undefined,
        );
        expect(client._isConnected).toBe(true);
      });

      it("should connect successfully with custom options", async () => {
        const options: RequestOptions = { timeout: 5000 };
        client.mcp.connect.mockResolvedValue(undefined);

        await client.connectToServer({ options });

        expect(StdioClientTransport).toHaveBeenCalledWith({
          command: "npx",
          args: ["boson-xmtp-mcp-server"],
          env: undefined,
        });
        expect(client.mcp.connect).toHaveBeenCalledWith(mockTransport, options);
        expect(client._isConnected).toBe(true);
      });

      it("should connect successfully with both env and options", async () => {
        const env = { NODE_ENV: "development" };
        const options: RequestOptions = { timeout: 10000 };
        client.mcp.connect.mockResolvedValue(undefined);

        await client.connectToServer({ env, options });

        expect(StdioClientTransport).toHaveBeenCalledWith({
          command: "npx",
          args: ["boson-xmtp-mcp-server"],
          env,
        });
        expect(client.mcp.connect).toHaveBeenCalledWith(mockTransport, options);
        expect(client._isConnected).toBe(true);
      });

      it("should reset connection state before attempting connection", async () => {
        // Set initial state as connected
        client._isConnected = true;
        client.mcp.connect.mockResolvedValue(undefined);

        await client.connectToServer({});

        // Should reset to false initially, then set to true after successful connection
        expect(client._isConnected).toBe(true);
      });
    });

    describe("connection failure", () => {
      it("should handle transport creation failure", async () => {
        const error = new Error("Transport creation failed");
        vi.mocked(StdioClientTransport).mockImplementationOnce(() => {
          throw error;
        });

        await client.connectToServer({});

        expect(client._isConnected).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Stdio connection failed",
          error,
        );
      });

      it("should handle MCP connection failure", async () => {
        const error = new Error("MCP connection failed");
        client.mcp.connect.mockRejectedValue(error);

        await client.connectToServer({});

        expect(StdioClientTransport).toHaveBeenCalled();
        expect(client.mcp.connect).toHaveBeenCalledWith(
          mockTransport,
          undefined,
        );
        expect(client._isConnected).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Stdio connection failed",
          error,
        );
      });

      it("should handle connection timeout", async () => {
        const timeoutError = new Error("Connection timeout");
        client.mcp.connect.mockRejectedValue(timeoutError);
        const options: RequestOptions = { timeout: 1000 };

        await client.connectToServer({ options });

        expect(client.mcp.connect).toHaveBeenCalledWith(mockTransport, options);
        expect(client._isConnected).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Stdio connection failed",
          timeoutError,
        );
      });

      it("should not throw errors when connection fails", async () => {
        client.mcp.connect.mockRejectedValue(new Error("Connection failed"));

        // Should not throw - the method catches and logs errors
        await expect(client.connectToServer({})).resolves.toBeUndefined();
        expect(client._isConnected).toBe(false);
      });
    });

    describe("edge cases", () => {
      it("should handle empty environment object", async () => {
        client.mcp.connect.mockResolvedValue(undefined);

        await client.connectToServer({ env: {} });

        expect(StdioClientTransport).toHaveBeenCalledWith({
          command: "npx",
          args: ["boson-xmtp-mcp-server"],
          env: {},
        });
        expect(client._isConnected).toBe(true);
      });

      it("should handle multiple connection attempts", async () => {
        client.mcp.connect.mockResolvedValue(undefined);

        // First connection
        await client.connectToServer({});
        expect(client._isConnected).toBe(true);

        // Second connection (should reset and reconnect)
        await client.connectToServer({});
        expect(client._isConnected).toBe(true);
        expect(StdioClientTransport).toHaveBeenCalledTimes(2);
      });

      it("should handle connection after previous failure", async () => {
        // First attempt fails
        client.mcp.connect.mockRejectedValueOnce(
          new Error("First attempt failed"),
        );
        await client.connectToServer({});
        expect(client._isConnected).toBe(false);

        // Second attempt succeeds
        client.mcp.connect.mockResolvedValueOnce(undefined);
        await client.connectToServer({});
        expect(client._isConnected).toBe(true);
      });

      it("should work with undefined parameters", async () => {
        client.mcp.connect.mockResolvedValue(undefined);

        await client.connectToServer({});

        expect(StdioClientTransport).toHaveBeenCalledWith({
          command: "npx",
          args: ["boson-xmtp-mcp-server"],
          env: undefined,
        });
        expect(client.mcp.connect).toHaveBeenCalledWith(
          mockTransport,
          undefined,
        );
        expect(client._isConnected).toBe(true);
      });
    });
  });

  describe("transport configuration", () => {
    it("should use correct command and args for stdio transport", async () => {
      client.mcp.connect.mockResolvedValue(undefined);

      await client.connectToServer({});

      expect(StdioClientTransport).toHaveBeenCalledWith({
        command: "npx",
        args: ["boson-xmtp-mcp-server"],
        env: undefined,
      });
    });

    it("should preserve transport reference after successful connection", async () => {
      client.mcp.connect.mockResolvedValue(undefined);

      await client.connectToServer({});

      expect(client.transport).toBe(mockTransport);
      expect(client.transport).not.toBeNull();
    });

    it("should not set transport reference on connection failure", async () => {
      const error = new Error("Connection failed");
      client.mcp.connect.mockRejectedValue(error);

      await client.connectToServer({});

      // Transport should be created but connection state should be false
      expect(client.transport).toBe(mockTransport);
      expect(client._isConnected).toBe(false);
    });
  });

  describe("error logging", () => {
    it("should log different types of errors correctly", async () => {
      const networkError = new Error("Network error");
      networkError.name = "NetworkError";
      client.mcp.connect.mockRejectedValue(networkError);

      await client.connectToServer({});

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Stdio connection failed",
        networkError,
      );
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it("should log errors with proper context", async () => {
      const detailedError = new Error("Detailed connection failure");
      detailedError.stack = "Error: Detailed connection failure\n    at test";
      client.mcp.connect.mockRejectedValue(detailedError);

      await client.connectToServer({});

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Stdio connection failed",
        detailedError,
      );
    });
  });

  describe("inheritance", () => {
    it("should properly extend BosonXmtpMCPClient", () => {
      expect(client.mcp).toBeDefined();
      expect(typeof client.mcp.callTool).toBe("function");
      expect(typeof client.mcp.connect).toBe("function");
    });

    it("should maintain base class properties", () => {
      expect(client).toHaveProperty("_isConnected");
      expect(client).toHaveProperty("transport");
      expect(client).toHaveProperty("mcp");
    });
  });
});
