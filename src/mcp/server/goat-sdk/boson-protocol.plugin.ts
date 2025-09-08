import { Chain, PluginBase } from "@goat-sdk/core";
import { BosonXmtpMCPClient } from "../../client/boson-client";
import { supportedChainIds } from "../configValidation";
import { BosonXmtpPluginService } from "./boson-protocol-xmtp-plugin.service";

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
