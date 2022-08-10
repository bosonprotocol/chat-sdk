import { MessageType, SupportedFileMimeTypes } from "../../../src/util/types";

test("Import enum definitions", () => {
  expect(MessageType).toBeTruthy();
  expect(SupportedFileMimeTypes).toBeTruthy();
});
