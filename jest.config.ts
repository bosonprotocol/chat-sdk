import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverage: true,
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "src/**/*.{ts,js}",
    "!src/example/*.{ts,js}",
    "!src/workers/*.{ts,js}"
  ],
  coverageReporters: ["json", "text"],
  coveragePathIgnorePatterns: ["jest.config.js", "/node_modules/", "/dist/"],
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.tests.json"
    }
  },
  roots: ["<rootDir>"],
  modulePaths: ["<rootDir>"],
  moduleDirectories: ["node_modules"]
};
export default config;
