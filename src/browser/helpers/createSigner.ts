import type { Signer } from "@xmtp/browser-sdk";
import type { Signer as SignerEthers } from "ethers";

import { sharedCreateEOASigner } from "../../common/helpers/createSigner.js";

export const createEOASigner = (
  address: `0x${string}`,
  signer: SignerEthers,
): Signer => {
  return sharedCreateEOASigner(address, signer, "Ethereum") as Signer;
};
