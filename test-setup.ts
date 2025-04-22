// polyfill Buffer for browser environment
import { Buffer } from "buffer";

if (typeof window !== "undefined") {
  window.Buffer = Buffer;
}
