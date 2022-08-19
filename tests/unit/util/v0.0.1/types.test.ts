import {
  MessageType,
  SupportedFileMimeTypes
} from "../../../../src/util/v0.0.1/types";

test("Import enum definitions", () => {
  expect(MessageType).toBeTruthy();
  expect(SupportedFileMimeTypes).toBeTruthy();
});
