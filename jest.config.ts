import type { JestConfigWithTsJest } from "ts-jest";

const config: JestConfigWithTsJest = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  collectCoverage: true,
  extensionsToTreatAsEsm: [".ts"],
  setupFiles: ["<rootDir>/jest.setup.js"],
  coverageDirectory: "coverage",
  collectCoverageFrom: ["src/**/*.{ts,js}", "!src/example/*.{ts,js}"],
  coverageReporters: ["json", "text"],
  coveragePathIgnorePatterns: ["jest.config.js", "/node_modules/", "/dist/"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@xmtp/browser-sdk$":
      "<rootDir>/node_modules/@xmtp/browser-sdk/dist/index.js",
    "^@xmtp/content-type-primitives$":
      "<rootDir>/node_modules/@xmtp/content-type-primitives/dist/index.js",
    "^@xmtp/content-type-group-updated$":
      "<rootDir>/node_modules/@xmtp/content-type-group-updated/dist/index.js",
    "^@xmtp/content-type-text$":
      "<rootDir>/node_modules/@xmtp/content-type-text/dist/index.js",
    "^@xmtp/wasm-bindings$":
      "<rootDir>/node_modules/@xmtp/wasm-bindings/dist/bindings_wasm.js"
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.tests.json",
        useESM: true
      }
    ],
    "^.+\\.js$": "babel-jest"
  },
  // Transform ESM modules in @xmtp/browser-sdk, @xmtp/content-type-text...
  transformIgnorePatterns: [
    "/node_modules/(?!@xmtp/(browser-sdk|content-type-primitives|content-type-group-updated|content-type-text|wasm-bindings))"
  ]
};
export default config;
