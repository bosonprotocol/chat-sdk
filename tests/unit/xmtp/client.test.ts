import { XmtpClient } from "../../../src/browser/client.js";
import { it, expect } from "vitest";

it("Import XmtpClient", () => {
  expect(XmtpClient).toBeTruthy();
});
