import type { Signer as SignerEthers } from "ethers";
import { toBytes } from "viem";

export const sharedCreateEOASigner = (
  address: `0x${string}`,
  signer: SignerEthers,
  identifierKind: "Ethereum" | 0,
) => {
  return {
    type: "EOA",
    getIdentifier: () => ({
      identifier: address.toLowerCase(),
      identifierKind,
    }),
    signMessage: async (message: string) => {
      const signature = await signer.signMessage(message);
      return toBytes(signature);
    },
  } as const;
};
