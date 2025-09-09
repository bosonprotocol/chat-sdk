import {
  MessageType,
  SupportedFileMimeTypes,
} from "../../../../src/common/util/v0.0.1/definitions.js";
import { it, expect } from "vitest";

it("Import enum definitions", () => {
  expect(MessageType).toBeTruthy();
  expect(SupportedFileMimeTypes).toBeTruthy();
});
