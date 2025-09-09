import { IdentifierKind, type Signer } from "@xmtp/node-sdk";
import type { Signer as SignerEthers } from "ethers";

import { sharedCreateEOASigner } from "../../common/helpers/createSigner.js";

export const createEOASigner = (
  address: `0x${string}`,
  signer: SignerEthers,
): Signer => {
  return sharedCreateEOASigner(
    address,
    signer,
    IdentifierKind.Ethereum,
  ) as Signer;
};
