import {
  MessageType,
  SupportedFileMimeTypes
} from "../../../../src/util/v0.0.1/definitions";
import { it, expect } from "vitest";

it("Import enum definitions", () => {
  expect(MessageType).toBeTruthy();
  expect(SupportedFileMimeTypes).toBeTruthy();
});
