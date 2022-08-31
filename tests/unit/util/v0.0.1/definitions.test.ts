import {
  MessageType,
  SupportedFileMimeTypes
} from "../../../../src/util/v0.0.1/definitions";

test("Import enum definitions", () => {
  expect(MessageType).toBeTruthy();
  expect(SupportedFileMimeTypes).toBeTruthy();
});
