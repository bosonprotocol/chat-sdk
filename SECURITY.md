# Security Policy

## Reporting a vulnerability

Please report security vulnerabilities **privately** — do not open a public GitHub issue.

- Email: **security@bosonprotocol.io**
- Or reach the team privately via the [Boson Protocol Discord](https://discord.com/invite/QSdtKRaap6).

We will acknowledge your report and work with you on a coordinated disclosure.

---

## MCP server: wallet private-key trust model

> **Read this before running or deploying the MCP server.**

The Boson XMTP **MCP server acts on behalf of a wallet**. To initialise an XMTP client,
read threads, send messages, and revoke installations, it needs the wallet's **private
key**. Concretely, the server turns the key into an `ethers.Wallet` and signs with it.

This has a direct security consequence:

> **Anyone who can reach the MCP server, read its memory, or read its logs can sign as
> that wallet** — send messages, revoke installations, and otherwise act as the wallet
> owner. The private key is the wallet. Treat the MCP server as a piece of wallet
> infrastructure, not as a shared API.

### Hard rules

1. **Run the server locally, or self-host it on infrastructure you control.**
   - Preferred: **stdio** transport, where the server runs as a local subprocess on the
     end user's machine.
   - Acceptable: **HTTP** transport that **you** host, on infrastructure **you** are
     responsible for, behind your own authentication.
2. **Never point a client at a shared or third-party MCP server**, and **never expose the
   server publicly or unauthenticated.** A public server that holds (or receives) private
   keys is a custodial service for other people's wallets.
3. **One server instance per wallet.** A single instance should be bound to a single
   wallet. Do not operate a multi-tenant server that handles many users' keys.
4. **Provide the key as a hosting secret**, e.g. an environment variable or secret
   manager — see [`docs/mcp-self-hosting.md`](docs/mcp-self-hosting.md). **Never**:
   - commit the key to git (including in `mcpServer.json` or `.env` files),
   - paste it into shared chats, tickets, or logs,
   - send it to a server you do not control.
5. **Use a dedicated, low-value wallet** for messaging where possible, and rotate the key
   if you suspect exposure.

### Known limitation (being addressed)

The current code transmits the private key from the client to the server **as a tool-call
argument on every request**, and the server can be deployed as a public, unauthenticated,
multi-tenant HTTP service. This means the key can travel over the network and appear in
logs. Until the hardening below lands, the **only** safe configuration is a **local stdio
server** (or a strictly private, self-hosted, single-wallet HTTP server that you control).

We are moving to an **environment-secret model**, where the server reads the key once at
startup from a hosting secret (an environment variable) and the client never transmits it.
Tracking issues:

- Documentation (this policy and the self-hosting guide): **#100**
- Code changes (key from environment, removal of the public deployment): **#101**

---

## Scope

This policy covers the `@bosonprotocol/chat-sdk` package, including the MCP server and
client under `src/mcp/`. For vulnerabilities in the wider Boson Protocol, see the
[Boson Protocol](https://bosonprotocol.io) security channels.
