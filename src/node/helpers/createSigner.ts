import { IdentifierKind, type Signer } from "@xmtp/node-sdk";
import type { Signer as SignerEthers } from "ethers";

import { commonCreateEOASigner } from "../../common/helpers/createSigner.js";

export const createEOASigner = (
  address: `0x${string}`,
  signer: SignerEthers,
): Signer => {
  return commonCreateEOASigner(
    address,
    signer,
    IdentifierKind.Ethereum,
  ) as Signer;
};
