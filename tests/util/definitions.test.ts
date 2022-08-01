import {
  MessageType,
  SupportedImageMimeTypes
} from "../../src/util/definitions";

test("Import enum definitions", () => {
  expect(MessageType).toBeTruthy();
  expect(SupportedImageMimeTypes).toBeTruthy();
});
