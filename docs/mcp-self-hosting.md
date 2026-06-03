# Self-hosting the Boson XMTP MCP server

The MCP server signs and acts on behalf of a wallet, so **how you host it is a security
decision**. Read [`SECURITY.md`](../SECURITY.md) first — this guide is the practical
companion to it.

The golden rule: **the server holds the keys to a wallet, so run it like wallet
infrastructure** — locally, or self-hosted on infrastructure you control, one wallet per
instance, key supplied as a secret.

---

## Choose a transport

| Transport | Where it runs | Use when |
| --------- | ------------- | -------- |
| **stdio** (recommended) | A local subprocess on the **end user's machine**, spawned by the client. | Default. The key never leaves the user's machine. |
| **HTTP** | A server **you** host and are responsible for, behind your own auth. | You need a long-running service. Must be private and single-wallet. |

> ⚠️ **Never** run a shared, public, or unauthenticated HTTP server that holds private
> keys, and never point your client at a third-party MCP server. That makes it a custodial
> service for other people's wallets.

---

## Provide the private key as a secret

Each server instance is bound to **one** wallet. Supply that wallet's key through the
**hosting environment** — an environment variable or a secret manager — not through client
requests or committed files.

The target environment variable is:

```
BOSON_XMTP_PRIVATE_KEY=<the wallet private key>
```

Do **not**:

- commit the key to git (this includes `mcpServer.json` and any `.env` file — keep them
  out of version control),
- log it or paste it into shared chats/tickets,
- send it to a server you do not control.

Prefer a **dedicated, low-value wallet** for messaging, and rotate the key if you suspect
exposure.

> **Current limitation:** at the time of writing, the server still receives the key as a
> per-request tool argument and does not yet read `BOSON_XMTP_PRIVATE_KEY` itself (tracked
> in **#101**). Until that lands, the safe configuration is a **local stdio server**, or a
> strictly private, self-hosted, single-wallet HTTP server. This guide documents the
> intended secret-based model so your setup is ready for it.

---

## Running with stdio (recommended)

The client spawns the server as a subprocess. Supply the key (and any non-default
configuration) through the spawned process's environment — see the
[`mcpServer.example.json`](../mcpServer.example.json) template:

```jsonc
{
  "mcpServers": {
    "boson-xmtp-mcp-server-stdio": {
      "command": "node",
      "args": ["/your-path-to/chat-sdk/dist/mcp/server/index.js"],
      "env": {
        "BOSON_XMTP_PRIVATE_KEY": "<your wallet private key>"
      }
    }
  }
}
```

Keep this file **out of version control** when it contains a real key.

---

## Running over HTTP (self-hosted only)

If you must run an HTTP server, treat it as private infrastructure:

- **Bind to `127.0.0.1`** by default. Only bind `0.0.0.0` when the server sits behind your
  own authenticated reverse proxy on a network you control. Do not expose it directly to
  the internet.
- **Never deploy with unauthenticated public access.** Put authentication in front of it.
- **One wallet per instance.** Configure that instance's `BOSON_XMTP_PRIVATE_KEY` as a
  secret in your platform (e.g. a secret manager / runtime secret), not baked into the
  image or committed to the repo.
- **Restrict origins/hosts.** The server honours `ALLOWED_HOSTS` (comma-separated) for
  Host/Origin validation; set it to the hosts you actually use.

### Docker

The included `Dockerfile` / `docker-compose.yml` are a starting point for **local /
private** use. When you run them:

- supply `BOSON_XMTP_PRIVATE_KEY` as a runtime secret (e.g. an env file that is **not**
  committed, or your orchestrator's secret mechanism),
- prefer binding to `127.0.0.1` (or keep `0.0.0.0` only when the container is reached
  exclusively through your own authenticated proxy).

---

## Checklist before you expose anything

- [ ] The key is provided as a hosting secret, not a client request or committed file.
- [ ] This instance is bound to exactly one wallet.
- [ ] stdio is local to the user, or the HTTP server is private and authenticated.
- [ ] No public, unauthenticated endpoint holds or receives the key.
- [ ] A dedicated, low-value wallet is used where possible.

See also: [`SECURITY.md`](../SECURITY.md).
