import { ThreadObject } from "../util/v0.0.1/types";
import { splitConversation } from "../util/v0.0.1/functions";
import { workerData, parentPort } from "worker_threads";

splitConversation(
  workerData.messages,
  workerData.counterparty,
  workerData.envName
)
  .then((chatThreads: ThreadObject[]) => {
    parentPort.postMessage(chatThreads);
  })
  .catch((error: Error) => {
    console.log(error);
  });
