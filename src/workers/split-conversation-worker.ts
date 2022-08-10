import { ThreadObject } from "../util/types";
import { splitConversation } from "../util/functions";
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
