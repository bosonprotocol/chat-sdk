import type { Chain } from "@goat-sdk/core";
import { PluginBase } from "@goat-sdk/core";
import { BosonXmtpMCPClient } from "../../client/boson-client.js";
import { supportedChainIds } from "../configValidation.js";
import { BosonXmtpPluginService } from "./boson-protocol-xmtp-plugin.service.js";

export interface BosonProtocolXmtpOptions {
  privateKey: string;
}

export class BosonProtocolXmtpPlugin extends PluginBase {
  constructor(options: BosonProtocolXmtpOptions) {
    super("boson-protocol-xmtp", [
      new BosonXmtpPluginService(new BosonXmtpMCPClient(), options.privateKey),
    ]);
  }

  supportsChain(chain: Chain) {
    return chain.type === "evm" && supportedChainIds.includes(chain.id);
  }
}

export function bosonProtocolXmtpPlugin(options: BosonProtocolXmtpOptions) {
  return new BosonProtocolXmtpPlugin(options);
}
