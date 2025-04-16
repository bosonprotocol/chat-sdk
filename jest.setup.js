/* eslint-disable @typescript-eslint/no-empty-function */
globalThis.import_meta = { url: `file://${process.cwd()}/` };
global.Worker = class {
  constructor(stringUrl) {
    this.url = stringUrl;
    this.postMessage = () => {};
  }
  postMessage() {}
  terminate() {}
  addEventListener() {}
  removeEventListener() {}
  onmessage() {}
  onerror() {}
};
