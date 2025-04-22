import { Wallet } from "ethers";
import { BosonXmtpClient } from "..";
import {
  MessageType,
  SupportedFileMimeTypes,
  ThreadObject
} from "../util/v0.0.1/definitions";

// This is just a playground for development of the SDK
async function main() {
  const privateKey = "";
  if (!privateKey) {
    throw new Error("please define a private key");
  }
  const counterparties: string[] = [
    "0x69281BEC892a036F3F500cE77109B3C3Fcb42c02"
  ];
  const envName = "testing-0x156207E1ca9746e5a387930c8695d84bc8dAD69F";

  const wallet = new Wallet(privateKey);
  const xmtpClient = await BosonXmtpClient.initialise(wallet, "dev", envName);

  // const threads: any[] = await xmtpClient.getThreads(counterparties);
  // console.log(threads);

  const threadId = { exchangeId: "27", buyerId: "8", sellerId: "4" };
  const thread = await xmtpClient.getThread(
    threadId,
    counterparties[0]
    // { startTime: new Date(0), endTime: new Date() }
  );
  console.log("thread", JSON.stringify(thread, null, 2));
  // for await (const messages of await xmtpClient.monitorThread(threadId, counterparties[0])) {
  //   console.log(messages.data.content.value)
  // }

  // await exampleEncodeAndSendStringMessage(xmtpClient, counterparties[1]);
  // await exampleDecodeStringMessage(xmtpClient, counterparties[1]);

  // await exampleEncodeAndSendImageMessage(xmtpClient, counterparties[0]);
  // await exampleDecodeImageMessage(xmtpClient, counterparties[0]);

  // await exampleEncodeAndSendProposalMessage(xmtpClient, counterparties[0]);
  // await exampleDecodeProposalMessage(xmtpClient, counterparties[0]);
}

main().catch(console.error);

async function exampleEncodeAndSendStringMessage(
  xmtpClient: any,
  recipient: string
) {
  const messageObj = {
    threadId: {
      exchangeId: "88",
      buyerId: "10",
      sellerId: "20"
    },
    contentType: MessageType.String,
    version: "0.0.1",
    content: {
      value: "Hi. This is a test message (again)... (pt. 2)"
    }
  };

  await xmtpClient.encodeAndSendMessage(messageObj, recipient);
}

async function exampleDecodeStringMessage(xmtpClient: any, recipient: string) {
  const chatHistory: any[] = await xmtpClient.getConversationHistory(recipient);
  for (const message of chatHistory) {
    console.log(JSON.stringify(message, null, 2));
    xmtpClient.decodeMessage(message);
  }
}

async function exampleEncodeAndSendProposalMessage(
  xmtpClient: any,
  recipient: string
) {
  const messageObj: any = {
    threadId: {
      exchangeId: "31",
      buyerId: "4",
      sellerId: "8"
    },
    contentType: MessageType.Proposal,
    version: "0.0.1",
    content: {
      value: {
        title: "This is an example title",
        description: "Lorem ipsum...",
        disputeContext: [],
        proposals: [
          {
            type: "Refund",
            percentageAmount: "50%",
            signature: "0x..."
          },
          {
            type: "Return & Replace",
            percentageAmount: "0%",
            signature: "0x..."
          }
        ]
      }
    }
  };

  await xmtpClient.encodeAndSendMessage(messageObj, recipient);
}

async function exampleDecodeProposalMessage(
  xmtpClient: any,
  recipient: string
) {
  const chatHistory: any[] = await xmtpClient.getConversationHistory(recipient);
  for (const message of chatHistory) {
    xmtpClient.decodeMessage(message);
  }
}

async function exampleEncodeAndSendImageMessage(
  xmtpClient: any,
  recipient: string
) {
  const messageObj: any = {
    threadId: {
      exchangeId: "24",
      buyerId: "5",
      sellerId: "11"
    },
    contentType: MessageType.File,
    version: "0.0.1",
    content: {
      value: {
        fileName: "example.png",
        fileType: SupportedFileMimeTypes.PNG,
        fileSize: 1024,
        encodedContent:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
      }
    }
  };

  await xmtpClient.encodeAndSendMessage(messageObj, recipient);
}

async function exampleDecodeImageMessage(xmtpClient: any, recipient: string) {
  const chatHistory: any[] = await xmtpClient.getConversationHistory(recipient);
  for (const message of chatHistory) {
    xmtpClient.decodeMessage(message);
  }
}
