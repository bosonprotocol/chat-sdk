import { ThreadObject } from "../util/v0.0.1/types";
import { splitConversation } from "../util/v0.0.1/functions";

self.addEventListener(
  "message",
  function (e) {
    const { messages, counterparty, envName } = e.data;
    splitConversation(messages, counterparty, envName)
      .then((chatThreads: ThreadObject[]) => {
        self.postMessage(chatThreads);
      })
      .catch((error: Error) => {
        console.log(error);
      });
  },
  false
);
