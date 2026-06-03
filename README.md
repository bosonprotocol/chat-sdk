[![banner](/docs/assets/banner.png)](https://bosonprotocol.io)

<h2 align="center">Chat SDK for Boson Protocol v2</h2>

<div align="center">

<a href="">![](https://img.shields.io/badge/license-Apache--2.0-brightgreen?style=flat-square)</a>
<a href="https://discord.com/invite/QSdtKRaap6">![](https://img.shields.io/badge/Chat%20on-Discord-%235766f2?style=flat-square)</a>
<a href="https://twitter.com/BosonProtocol">![](https://img.shields.io/twitter/follow/BosonProtocol?style=social)</a>

</div align="center">

<div align="center">

🛠️ **Tools for building on top of the [Boson Protocol](https://bosonprotocol.io).**

</div>

JS lib which extends @xmtp/xmtp-js, adding support for chat threads and further message types.

<hr>
<h2>Install</h2>
<pre>npm i @bosonprotocol/chat-sdk</pre>

<hr>
<h2>Usage</h2>
<ul>
    <li>Initialise SDK</li>
        <ul>
            <li>
                <pre>import { BosonXmtpClient } from "@bosonprotocol/chat-sdk";
const client = await BosonXmtpClient.initialise(signer, "test");</pre>
            </li>
        </ul>
    <li>Get Chat Threads</li>
        <ul>
            <li>
                <pre>const counterparties = ["0xabc123", "0xdef456", ...];
const threads = await client.getThreads(counterparties);</pre>
            </li>
        </ul>
    <li>Send Message</li>
        <ul>
            <li>
                <pre>const messageObj = {
  threadId: {
    exchangeId: "1",
    buyerId: "2",
    sellerId: "3"
  },
  contentType: MessageType.String,
  version: "0.0.1",
  content: {
    value: "Example message"
  }
};
const recipient = "0xabc123...";
await client.encodeAndSendMessage(messageObj, recipient);</pre>
            </li>
        </ul>
    <li>Monitor Chat Thread (i.e. for incoming messages)</li>
        <ul>
            <li>
                <pre>for await (const message of await client.monitorThread(threadId, counterparty)) {
  console.log(message);
}</pre>
            </li>
        </ul>
</ul>

<hr>
<h2>MCP server &amp; client</h2>

This package also ships a [Model Context Protocol](https://modelcontextprotocol.io) (MCP)
server and client (under `src/mcp/`) that expose Boson XMTP messaging as tools — initialise
an XMTP client, read threads, send messages, and revoke installations — so AI agents can use
them. It is published with the `boson-xmtp-mcp-server` binary and supports two transports:

<ul>
    <li><b>stdio</b> — the server runs as a local subprocess on the end user's machine (recommended).</li>
    <li><b>HTTP</b> — a long-running server that <i>you</i> host on infrastructure you control.</li>
</ul>

> ⚠️ **Security: the MCP server acts on behalf of a wallet and needs its private key.**
> Anyone who can reach the server or read its logs/memory can sign as that wallet. **Run it
> locally (stdio) or self-host it privately — never point a client at a shared/public server,
> and never expose it unauthenticated.** Provide the key as a hosting secret, never in client
> requests or committed files.
>
> Read [`SECURITY.md`](SECURITY.md) and the [self-hosting guide](docs/mcp-self-hosting.md)
> before running or deploying the MCP server.

<hr>
<h2>Local Development</h2>
<ul>
    <li>Build</li>
        <ul>
            <li>
                <pre>npm run build</pre>
            </li>
        </ul>
    <li>Test</li>
        <ul>
            <li>
                <pre>npm run test:all
npm run test:unit
npm run test:integration</pre>
            </li>
        </ul>
    <li>Lint</li>
        <ul>
            <li>
                <pre>npm run lint
npm run lint:fix</pre>
            </li>
        </ul>
    <li>Format</li>
        <ul>
            <li>
                <pre>npm run prettier</pre>
            </li>
        </ul>
</ul>
<hr>
