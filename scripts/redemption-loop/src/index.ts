import { EthersAdapter } from "@bosonprotocol/ethers-sdk";
import { getDefaultConfig, EnvironmentType } from "@bosonprotocol/common";
import { program } from "commander";
import { providers, utils, Wallet } from "ethers";
import { CoreSDK } from "@bosonprotocol/core-sdk";
import { BosonXmtpClient } from "@bosonprotocol/chat-sdk";
import {
  MessageType,
  version
} from "../../../dist/cjs/util/v0.0.1/definitions";

program
  .description("Checks sellers have initialized the Chat.")
  .requiredOption("--offerId <offerId>", "Id of the Offer to commit")
  .requiredOption(
    "--buyerPrivateKey <buyerPrivateKey>",
    "Private key of the buyer wallet"
  )
  .option("--nbCommits <nbCommits>", "Nb of times to commit", "30")
  .option("-e, --env <ENV_NAME>", "Target environment", "testing")
  .option("--xmtpEnv <ENV_NAME>", "Target XMTP environment")
  .parse(process.argv);

async function main() {
  const opts = program.opts();
  const envName = opts.env || "testing";
  const defaultConfig = getDefaultConfig(envName as EnvironmentType);
  console.log(
    "opts.buyerPrivateKey",
    opts.buyerPrivateKey,
    "offerId",
    opts.offerId
  );
  const buyerWallet = new Wallet(opts.buyerPrivateKey);
  const offerId = opts.offerId;
  const nbCommits = parseInt(opts.nbCommits);
  const web3Lib = new EthersAdapter(
    new providers.JsonRpcProvider(defaultConfig.jsonRpcUrl),
    buyerWallet
  );
  const coreSDK = CoreSDK.fromDefaultConfig({
    web3Lib,
    envName
  });

  const xmtpEnvName =
    opts.xmtpEnv ||
    (defaultConfig.envName === "production" ? "production" : "dev");
  const bosonEnvName = `${defaultConfig.envName}-${defaultConfig.contracts.protocolDiamond}`;
  console.log(`XMTP env: ${xmtpEnvName}, bosonAuthority: ${bosonEnvName}`);
  const xmtpClient = await BosonXmtpClient.initialise(
    buyerWallet,
    xmtpEnvName,
    bosonEnvName
  );
  const xmtpEnabled = await BosonXmtpClient.isXmtpEnabled(
    utils.getAddress(buyerWallet.address),
    xmtpEnvName,
    bosonEnvName
  );
  console.log("buyer", buyerWallet.address, xmtpEnabled);

  const promises = [];
  for (let i = 0; i < nbCommits; i++) {
    console.log("----------------------------------------------------");
    console.log(`#${i + 1}/${nbCommits} Commit to offer ${offerId}`);
    const exchangeId = await commitToOffer(offerId, coreSDK);
    console.log(`#${i + 1}/${nbCommits} ExchangeId = ${exchangeId}`);
    let notFound = 10;
    let exchange;
    while (notFound-- > 0) {
      exchange = await coreSDK.getExchangeById(exchangeId);
      if (!exchange) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        // console.log("retry...", notFound);
      } else {
        notFound = 0;
      }
    }
    if (!exchange) {
      console.error(
        `#${i + 1}/${nbCommits} Unable to find exchange from id ${exchangeId}`
      );
      continue;
    }
    await sendDeliveryDetailsToChat(
      exchangeId,
      exchange.buyer.id,
      exchange.seller.id,
      exchange.seller.operator,
      `bla bla bla\n${exchangeId} #${i + 1}/${nbCommits}`,
      xmtpClient
    );
    console.log(
      `#${i + 1}/${nbCommits} Redemption message sent to seller '${
        exchange.seller.id
      }:${exchange.seller.operator}'`
    );
    const txRedeem = await coreSDK.redeemVoucher(exchangeId);
    promises.push(
      // eslint-disable-next-line no-async-promise-executor
      new Promise<void>(async (resolve) => {
        await txRedeem.wait();
        console.log(`#${i + 1}/${nbCommits} Exchange ${exchangeId} redeemed`);
        console.log("----------------------------------------------------");
        resolve();
      })
    );
  }
  await Promise.all(promises);
}

async function commitToOffer(
  offerId: string,
  coreSDK: CoreSDK
): Promise<string> {
  const txCommit = await coreSDK.commitToOffer(offerId);
  const txResult = await txCommit.wait();
  const exchangeId = coreSDK.getCommittedExchangeIdFromLogs(txResult.logs);
  return exchangeId?.toString() as string;
}

async function sendDeliveryDetailsToChat(
  exchangeId: string,
  buyerId: string,
  sellerId: string,
  sellerAddress: string,
  message: string,
  xmtpClient: BosonXmtpClient
) {
  const value = `DELIVERY ADDRESS:\n${message}`;
  const newMessage = {
    threadId: {
      exchangeId,
      buyerId,
      sellerId
    },
    content: {
      value
    },
    contentType: MessageType.String,
    version
  } as const;
  const destinationAddress = utils.getAddress(sellerAddress);
  await xmtpClient.encodeAndSendMessage(newMessage, destinationAddress);
}

main()
  .then(() => {
    console.log("success");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
