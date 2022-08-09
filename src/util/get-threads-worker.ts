import { ThreadObject } from "./definitions";
import { workerData, parentPort } from "worker_threads";

workerData.client
  .splitIntoThreads(workerData.counterparty, workerData.options)
  .then((chatThreads: ThreadObject[]) => {
    parentPort.postMessage(chatThreads);
  })
  .catch((error: Error) => {
    console.log(error);
  });
