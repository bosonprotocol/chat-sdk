import { IdentifierKind, type Signer } from "@xmtp/node-sdk";
import { toBytes } from "viem";
import type { Signer as SignerEthers } from "ethers";

export const createEOASigner = (
  address: `0x${string}`,
  signer: SignerEthers,
): Signer => {
  return {
    type: "EOA",
    getIdentifier: () => ({
      identifier: address.toLowerCase(),
      identifierKind: IdentifierKind.Ethereum,
    }),
    signMessage: async (message: string) => {
      const signature = await signer.signMessage(message);
      return toBytes(signature);
    },
  };
};
