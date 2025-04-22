import { XmtpClient } from "../../../src/xmtp/client";
import { it, expect } from "vitest";

it("Import XmtpClient", () => {
  expect(XmtpClient).toBeTruthy();
});
