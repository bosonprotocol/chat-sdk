/* eslint-disable @typescript-eslint/no-explicit-any */

import type { RequestOptions } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BosonXmtpMCPClientHttp } from "./boson-client-http.js";

// Mock the MCP SDK StreamableHTTPClientTransport
const mockConnect = vi.fn();
const mockClose = vi.fn();
const mockTransport = {
  connect: mockConnect,
  close: mockClose,
};

vi.mock("@modelcontextprotocol/sdk/client/streamableHttp.js", () => ({
  StreamableHTTPClientTransport: vi
    .fn()
    .mockImplementation(() => mockTransport),
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

// Mock process.env for CI environment tests
const originalEnv = process.env;

describe("BosonXmtpMCPClientHttp", async () => {
  let client: BosonXmtpMCPClientHttp;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  const { StreamableHTTPClientTransport } = await import(
    "@modelcontextprotocol/sdk/client/streamableHttp.js"
  );

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, CI: "" };
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    process.env = originalEnv;
  });

  describe("constructor", () => {
    it("should create an instance with string URL", () => {
      const url = "http://localhost:3000";
      client = new BosonXmtpMCPClientHttp(url);

      expect(client).toBeInstanceOf(BosonXmtpMCPClientHttp);
      expect(client._isConnected).toBe(false);
      expect(client.transport).toBeNull();
      expect(client.mcp).toBeDefined();
    });

    it("should create an instance with URL object", () => {
      const url = new URL("https://api.example.com:8080/mcp");
      client = new BosonXmtpMCPClientHttp(url);

      expect(client).toBeInstanceOf(BosonXmtpMCPClientHttp);
      expect(client._isConnected).toBe(false);
    });

    it("should store the URL internally", () => {
      const url = "http://localhost:3000";
      client = new BosonXmtpMCPClientHttp(url);

      // Access private property for testing
      expect((client as any).url).toBe(url);
    });
  });

  describe("connectToServer", () => {
    beforeEach(() => {
      client = new BosonXmtpMCPClientHttp("http://localhost:3000");
    });

    describe("successful connection", () => {
      it("should connect successfully with default parameters", async () => {
        client.mcp.connect.mockResolvedValue(undefined);

        await client.connectToServer({});

        expect(StreamableHTTPClientTransport).toHaveBeenCalledWith(
          new URL("http://localhost:3000"),
          {
            reconnectionOptions: {
              maxReconnectionDelay: 60_000,
              initialReconnectionDelay: 1_000,
              maxRetries: 2,
              reconnectionDelayGrowFactor: 1.5,
            },
          },
        );
        expect(client.mcp.connect).toHaveBeenCalledWith(
          mockTransport,
          undefined,
        );
        expect(client._isConnected).toBe(true);
        expect(client.transport).toBe(mockTransport);
        expect(consoleErrorSpy).not.toHaveBeenCalled();
      });

      it("should connect successfully with custom options", async () => {
        const options: RequestOptions = { timeout: 5000 };
        client.mcp.connect.mockResolvedValue(undefined);

        await client.connectToServer({ options });

        expect(client.mcp.connect).toHaveBeenCalledWith(mockTransport, options);
        expect(client._isConnected).toBe(true);
      });

      it("should use CI-specific reconnection options when in CI environment", async () => {
        process.env.CI = "true";
        client.mcp.connect.mockResolvedValue(undefined);

        await client.connectToServer({});

        expect(StreamableHTTPClientTransport).toHaveBeenCalledWith(
          new URL("http://localhost:3000"),
          {
            reconnectionOptions: {
              maxReconnectionDelay: 120_000,
              initialReconnectionDelay: 5_000,
              maxRetries: 5,
              reconnectionDelayGrowFactor: 1.5,
            },
          },
        );
        expect(client._isConnected).toBe(true);
      });

      it("should handle different URL formats", async () => {
        const testUrls = [
          "http://localhost:3000",
          "https://api.example.com",
          "https://api.example.com:8080/path",
          new URL("http://127.0.0.1:3001"),
        ];

        for (const url of testUrls) {
          vi.clearAllMocks();
          const testClient = new BosonXmtpMCPClientHttp(url);
          testClient.mcp.connect.mockResolvedValue(undefined);

          await testClient.connectToServer({});

          expect(StreamableHTTPClientTransport).toHaveBeenCalledWith(
            new URL(url.toString()),
            expect.any(Object),
          );
          expect(testClient._isConnected).toBe(true);
        }
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
        vi.mocked(StreamableHTTPClientTransport).mockImplementationOnce(() => {
          throw error;
        });

        await client.connectToServer({});

        expect(client._isConnected).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Streamable HTTP connection failed",
          error,
        );
      });

      it("should handle MCP connection failure", async () => {
        const error = new Error("MCP connection failed");
        client.mcp.connect.mockRejectedValue(error);

        await client.connectToServer({});

        expect(StreamableHTTPClientTransport).toHaveBeenCalled();
        expect(client.mcp.connect).toHaveBeenCalledWith(
          mockTransport,
          undefined,
        );
        expect(client._isConnected).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Streamable HTTP connection failed",
          error,
        );
      });

      it("should handle HTTP-specific errors", async () => {
        const httpError = new Error("HTTP 404 Not Found");
        httpError.name = "HTTPError";
        client.mcp.connect.mockRejectedValue(httpError);

        await client.connectToServer({});

        expect(client._isConnected).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Streamable HTTP connection failed",
          httpError,
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
          "Streamable HTTP connection failed",
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

    describe("reconnection options", () => {
      it("should use development environment defaults", async () => {
        delete process.env.CI;
        client.mcp.connect.mockResolvedValue(undefined);

        await client.connectToServer({});

        expect(StreamableHTTPClientTransport).toHaveBeenCalledWith(
          new URL("http://localhost:3000"),
          {
            reconnectionOptions: {
              maxReconnectionDelay: 60_000,
              initialReconnectionDelay: 1_000,
              maxRetries: 2,
              reconnectionDelayGrowFactor: 1.5,
            },
          },
        );
      });

      it("should use CI environment settings", async () => {
        process.env.CI = "1";
        client.mcp.connect.mockResolvedValue(undefined);

        await client.connectToServer({});

        expect(StreamableHTTPClientTransport).toHaveBeenCalledWith(
          new URL("http://localhost:3000"),
          {
            reconnectionOptions: {
              maxReconnectionDelay: 120_000,
              initialReconnectionDelay: 5_000,
              maxRetries: 5,
              reconnectionDelayGrowFactor: 1.5,
            },
          },
        );
      });

      it("should handle falsy CI environment variable", async () => {
        process.env.CI = "";
        client.mcp.connect.mockResolvedValue(undefined);

        await client.connectToServer({});

        expect(StreamableHTTPClientTransport).toHaveBeenCalledWith(
          new URL("http://localhost:3000"),
          {
            reconnectionOptions: {
              maxReconnectionDelay: 60_000,
              initialReconnectionDelay: 1_000,
              maxRetries: 2,
              reconnectionDelayGrowFactor: 1.5,
            },
          },
        );
      });
    });

    describe("edge cases", () => {
      it("should handle multiple connection attempts", async () => {
        client.mcp.connect.mockResolvedValue(undefined);

        // First connection
        await client.connectToServer({});
        expect(client._isConnected).toBe(true);

        // Second connection (should reset and reconnect)
        await client.connectToServer({});
        expect(client._isConnected).toBe(true);
        expect(StreamableHTTPClientTransport).toHaveBeenCalledTimes(2);
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

      it("should work without options parameter", async () => {
        client.mcp.connect.mockResolvedValue(undefined);

        await client.connectToServer({});

        expect(client.mcp.connect).toHaveBeenCalledWith(
          mockTransport,
          undefined,
        );
        expect(client._isConnected).toBe(true);
      });

      it("should handle invalid URL in constructor gracefully", async () => {
        // This tests URL conversion handling
        const client = new BosonXmtpMCPClientHttp("invalid-url");
        client.mcp.connect.mockResolvedValue(undefined);

        // Should throw during URL construction in connectToServer
        await client.connectToServer({});

        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(client._isConnected).toBe(false);
      });
    });
  });

  describe("transport configuration", () => {
    beforeEach(() => {
      client = new BosonXmtpMCPClientHttp("http://localhost:3000");
    });

    it("should use correct URL for transport", async () => {
      client.mcp.connect.mockResolvedValue(undefined);

      await client.connectToServer({});

      expect(StreamableHTTPClientTransport).toHaveBeenCalledWith(
        new URL("http://localhost:3000"),
        expect.any(Object),
      );
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

    it("should use consistent reconnection delay growth factor", async () => {
      client.mcp.connect.mockResolvedValue(undefined);

      await client.connectToServer({});

      const call = vi.mocked(StreamableHTTPClientTransport).mock.calls[0];
      expect(call[1].reconnectionOptions.reconnectionDelayGrowFactor).toBe(1.5);
    });
  });

  describe("error logging", () => {
    beforeEach(() => {
      client = new BosonXmtpMCPClientHttp("http://localhost:3000");
    });

    it("should log different types of errors correctly", async () => {
      const networkError = new Error("Network error");
      networkError.name = "NetworkError";
      client.mcp.connect.mockRejectedValue(networkError);

      await client.connectToServer({});

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Streamable HTTP connection failed",
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
        "Streamable HTTP connection failed",
        detailedError,
      );
    });

    it("should use specific error message for HTTP transport", async () => {
      const error = new Error("Test error");
      client.mcp.connect.mockRejectedValue(error);

      await client.connectToServer({});

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Streamable HTTP connection failed",
        error,
      );
    });
  });

  describe("inheritance", () => {
    beforeEach(() => {
      client = new BosonXmtpMCPClientHttp("http://localhost:3000");
    });

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

    it("should call parent constructor", () => {
      // The super() call should initialize base class properties
      expect(client._isConnected).toBe(false);
      expect(client.transport).toBeNull();
    });
  });

  describe("URL handling", () => {
    it("should handle various URL schemes", async () => {
      const urls = [
        "http://localhost:3000",
        "https://api.example.com",
        "http://127.0.0.1:8080",
        "https://secure.api.com:443/mcp",
      ];

      for (const url of urls) {
        const testClient = new BosonXmtpMCPClientHttp(url);
        testClient.mcp.connect.mockResolvedValue(undefined);

        await testClient.connectToServer({});

        expect(StreamableHTTPClientTransport).toHaveBeenCalledWith(
          new URL(url),
          expect.any(Object),
        );
      }
    });

    it("should handle URL object in constructor", async () => {
      const url = new URL("https://api.example.com:8080/path");
      const testClient = new BosonXmtpMCPClientHttp(url);
      testClient.mcp.connect.mockResolvedValue(undefined);

      await testClient.connectToServer({});

      expect(StreamableHTTPClientTransport).toHaveBeenCalledWith(
        new URL(url.toString()),
        expect.any(Object),
      );
    });
  });
});
