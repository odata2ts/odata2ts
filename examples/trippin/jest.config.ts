import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["/node_modules/"], //, "int-test"],
  coverageDirectory: "coverage",
  collectCoverageFrom: ["src/**/*.ts"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.test.json" }],
  },
};

export default config;
