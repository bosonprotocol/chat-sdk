import { EthersAdapter } from "@bosonprotocol/ethers-sdk";
import { getDefaultConfig, EnvironmentType } from "@bosonprotocol/common";
import { program } from "commander";
import { providers, utils } from "ethers";
import { CoreSDK } from "@bosonprotocol/core-sdk";
import { BosonXmtpClient } from "@bosonprotocol/chat-sdk";

program
  .description("Checks sellers have initialized the Chat.")
  .option("-e, --env <ENV_NAME>", "Target environment", "testing")
  .option("--xmtpEnv <ENV_NAME>", "Target XMTP environment")
  .option("--buyers", "Also check buyers")
  .parse(process.argv);

async function main() {
  const opts = program.opts();
  const envName = opts.env || "testing";
  const defaultConfig = getDefaultConfig(envName as EnvironmentType);
  const web3Lib = new EthersAdapter(
    new providers.JsonRpcProvider(defaultConfig.jsonRpcUrl)
  );
  const coreSDK = CoreSDK.fromDefaultConfig({
    web3Lib,
    envName
  });
  const sellers = await coreSDK.getSellers();
  // console.log("sellers", sellers);

  const xmtpEnvName =
    opts.xmtpEnv ||
    (defaultConfig.envName === "production" ? "production" : "dev");
  const bosonEnvName = `${defaultConfig.envName}-${defaultConfig.contracts.protocolDiamond}`;
  console.log(`XMTP env: ${xmtpEnvName}, bosonAuthority: ${bosonEnvName}`);
  for (const seller of sellers) {
    const operator = seller.operator;
    const xmtpEnabled = await BosonXmtpClient.isXmtpEnabled(
      utils.getAddress(operator),
      xmtpEnvName,
      bosonEnvName
    );
    console.log("seller", seller.id, operator, xmtpEnabled);
  }
  if (opts.buyers) {
    const buyers = await coreSDK.getBuyers();
    for (const buyer of buyers) {
      const xmtpEnabled = await BosonXmtpClient.isXmtpEnabled(
        utils.getAddress(buyer.wallet),
        xmtpEnvName,
        bosonEnvName
      );
      console.log("buyer", buyer.id, buyer.wallet, xmtpEnabled);
    }
  }
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
