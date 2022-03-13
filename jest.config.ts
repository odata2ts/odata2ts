module.exports = {
  projects: ["<rootDir>/packages/*/jest.config.ts"],
  coverageDirectory: "<rootDir>/coverage/",
  collectCoverageFrom: ["**/src/**/*.{ts,tsx}"],
};
