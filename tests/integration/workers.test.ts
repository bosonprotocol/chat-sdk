import { describe, it, expect, afterEach } from "vitest";

describe("Worker Functionality Test", () => {
  let worker: Worker | null = null;
  let objectURL: string | null = null;

  // *** Declare TIMEOUT_MS in the describe scope ***
  // This makes it accessible to both the 'it' options and the 'it' body.
  const TIMEOUT_MS = 3000; // Timeout in milliseconds (e.g., 3 seconds)

  afterEach(() => {
    console.log("Running test cleanup...");
    if (worker) {
      console.log("Terminating worker...");
      worker.terminate();
      worker = null;
    }
    if (objectURL) {
      console.log("Revoking object URL...");
      URL.revokeObjectURL(objectURL);
      objectURL = null;
    }
    console.log("Cleanup finished.");
  });

  // Use TIMEOUT_MS from the describe scope for the test case timeout option
  it("can create and communicate with a basic inline worker", async () => {
    console.log(
      "Starting test: can create and communicate with a basic inline worker"
    );

    // TIMEOUT_MS is now accessible from the outer scope, no need to redeclare here.

    // 1. Define the worker code as a string
    const workerCode = `
      console.log("Inline Worker: Script executing.");
      // Signal that the worker script has started and is ready.
      self.postMessage({ action: "ready", source: "inline" });
      // Optional: Listen for messages from the main thread
      self.addEventListener('message', (e) => {
        console.log('Inline Worker: Received message:', e.data);
      });
      console.log("Inline Worker: Ready message sent, listening for messages.");
    `;

    // Promise to handle worker creation and message/error listening
    const workerReadyPromise = new Promise((resolve, reject) => {
      try {
        // 2. Create a Blob from the code string
        console.log("Creating Blob from worker code string...");
        const blob = new Blob([workerCode], {
          type: "application/javascript"
        });

        // 3. Create an Object URL for the Blob
        objectURL = URL.createObjectURL(blob);
        console.log(
          `Blob Object URL created (prefix): ${objectURL.substring(0, 50)}...`
        );

        // 4. Create the Worker using the Object URL
        console.log("Creating worker instance from Object URL...");
        worker = new Worker(objectURL, { name: "InlineTestWorker" });
        console.log("Inline Worker instance created:", worker);

        // --- Listener Logic ---
        const handleMessage = (e: MessageEvent) => {
          console.log("Main Thread: Message received from worker:", e.data);
          if (e.data?.action === "ready") {
            worker?.removeEventListener("message", handleMessage);
            worker?.removeEventListener("error", handleError);
            resolve({ worker: worker as Worker, ready: true });
          }
        };

        const handleError = (e: ErrorEvent) => {
          console.error(
            "Main Thread: Error event received from worker:",
            e.message,
            e
          );
          worker?.removeEventListener("message", handleMessage);
          worker?.removeEventListener("error", handleError);
          reject(
            new Error(`Worker errored: ${e.message || "Unknown worker error"}`)
          );
        };

        worker.addEventListener("message", handleMessage);
        worker.addEventListener("error", handleError);
      } catch (error) {
        console.error(
          "Main Thread: Error during inline worker creation:",
          error
        );
        if (objectURL) {
          URL.revokeObjectURL(objectURL);
          objectURL = null;
        }
        reject(error);
      }
    });

    // Promise for the timeout using TIMEOUT_MS from the outer scope
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            `Test timed out after ${TIMEOUT_MS}ms waiting for inline worker 'ready' message.`
          )
        );
      }, TIMEOUT_MS);
    });

    // --- Race and Assertions ---
    try {
      console.log(
        "Main Thread: Waiting for worker ready message or timeout..."
      );
      const result = (await Promise.race([
        workerReadyPromise,
        timeoutPromise
      ])) as { worker: Worker; ready: boolean };

      console.log("Main Thread: Promise.race finished. Checking results.");
      expect(result).toBeDefined();
      expect(result.ready).toBe(true);
      expect(result.worker).toBeTruthy();

      console.log("Main Thread: Inline worker signaled ready successfully.");
    } catch (error) {
      console.error("Main Thread: Test failed:", error);
      expect.fail((error as Error).message);
    }
    // Use TIMEOUT_MS from the outer scope for the Vitest 'it' timeout option
  });
});
