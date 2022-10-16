import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  testEnvironment: "node",
  coverageDirectory: "coverage",
  collectCoverageFrom: ["src/**/*.ts"],
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.test.json",
    },
  },
};

export default config;
