import type { Signer } from "@xmtp/browser-sdk";
import type { Signer as SignerEthers } from "ethers";

import { commonCreateEOASigner } from "../../common/helpers/createSigner.js";

export const createEOASigner = (
  address: `0x${string}`,
  signer: SignerEthers,
): Signer => {
  return commonCreateEOASigner(address, signer, "Ethereum") as Signer;
};
