// // polyfill Buffer for browser environment
// import { Buffer } from "buffer";

// if (typeof window !== "undefined") {
//   window.Buffer = Buffer;
// // }
// console.log(window.Buffer, globalThis, globalThis === window);
// ✅ Browser‑safe, no fs usage
