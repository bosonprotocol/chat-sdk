import type { Chain } from "@goat-sdk/core";
import { PluginBase } from "@goat-sdk/core";
import { getDefaultEnvironment } from "@modelcontextprotocol/sdk/client/stdio.js";

import type { BosonXmtpMCPClient } from "../../client/boson-client.js";
import { BosonXmtpMCPClientHttp } from "../../client/boson-client-http.js";
import { BosonXmtpMCPClientStdio } from "../../client/boson-client-stdio.js";
import { supportedChainIds } from "../configValidation.js";
import { BosonXmtpPluginService } from "./boson-protocol-xmtp-plugin.service.js";

/**
 * - `stdio`: the private key is handed to the locally-spawned server through
 *   its process environment (never sent as a tool argument).
 * - `http`: the remote server holds its own BOSON_XMTP_PRIVATE_KEY secret, so
 *   no key is provided here and none is ever sent over the wire.
 */
export type BosonProtocolXmtpOptions =
  | { stdio: true; privateKey: string }
  | {
      http: true;
      url: ConstructorParameters<typeof BosonXmtpMCPClientHttp>["0"];
    };

export class BosonProtocolXmtpPlugin extends PluginBase {
  constructor(options: BosonProtocolXmtpOptions) {
    let client: BosonXmtpMCPClient;
    let connectEnv: Record<string, string> | undefined;
    if (options.stdio === true) {
      client = new BosonXmtpMCPClientStdio();
      connectEnv = {
        ...getDefaultEnvironment(),
        START: "true",
        BOSON_XMTP_PRIVATE_KEY: options.privateKey,
      };
    } else if (options.http === true) {
      client = new BosonXmtpMCPClientHttp(options.url);
      connectEnv = undefined;
    } else {
      throw new Error("Invalid options in BosonProtocolXmtpPlugin constructor");
    }
    } else {
      throw new Error("Invalid options in BosonProtocolXmtpPlugin constructor");
    }
    super("boson-protocol-xmtp", [
      new BosonXmtpPluginService(client, connectEnv),
    ]);
  }

  supportsChain(chain: Chain) {
    return chain.type === "evm" && supportedChainIds.includes(chain.id);
  }
}

export function bosonProtocolXmtpPlugin(options: BosonProtocolXmtpOptions) {
  return new BosonProtocolXmtpPlugin(options);
}
