import type { Signer } from "@xmtp/browser-sdk";
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
      identifierKind: "Ethereum",
    }),
    signMessage: async (message: string) => {
      const signature = await signer.signMessage(message);
      return toBytes(signature);
    },
  };
};
