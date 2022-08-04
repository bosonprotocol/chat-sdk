import {
  MessageType,
  SupportedFileMimeTypes
} from "../../../src/util/definitions";

test("Import enum definitions", () => {
  expect(MessageType).toBeTruthy();
  expect(SupportedFileMimeTypes).toBeTruthy();
});
