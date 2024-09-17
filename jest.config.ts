import type { JestConfigWithTsJest } from "ts-jest";

const config: JestConfigWithTsJest = {
  collectCoverageFrom: ["src/**/*.js", "src/**/*.ts","!**/node_modules/**"],
  testMatch: ["**/*.test.js", "**/*.test.ts"],
  coverageReporters: ["html", "text", "text-summary", "cobertura"],
  verbose: true,
  testTimeout:1000000,
  transform: {
    "^.+\\.ts?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};

export default config;