import type { Chain } from "@goat-sdk/core";
import { PluginBase } from "@goat-sdk/core";

import { supportedChainIds } from "../configValidation.js";
import { BosonXmtpPluginService } from "./boson-protocol-xmtp-plugin.service.js";
import { BosonXmtpMCPClientHttp } from "../../client/boson-client-http.js";
import { BosonXmtpMCPClientStdio } from "../../client/boson-client-stdio.js";

export type BosonProtocolXmtpOptions = {
  privateKey: string;
} & (
  | { stdio: true }
  | ({ http: true } & {
      url: ConstructorParameters<typeof BosonXmtpMCPClientHttp>["0"];
    })
);

export class BosonProtocolXmtpPlugin extends PluginBase {
  constructor(options: BosonProtocolXmtpOptions) {
    const client =
      "stdio" in options
        ? new BosonXmtpMCPClientStdio()
        : "http" in options
          ? new BosonXmtpMCPClientHttp(options.url)
          : null;
    if (!client) {
      throw new Error("Invalid options in BosonProtocolXmtpPlugin constructor");
    }
    super("boson-protocol-xmtp", [
      new BosonXmtpPluginService(client, options.privateKey),
    ]);
  }

  supportsChain(chain: Chain) {
    return chain.type === "evm" && supportedChainIds.includes(chain.id);
  }
}

export function bosonProtocolXmtpPlugin(options: BosonProtocolXmtpOptions) {
  return new BosonProtocolXmtpPlugin(options);
}
