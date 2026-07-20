export const coverageReporterOptions = {
  provider: "istanbul" as const,
  reporter: ["lcov", "html-spa"] as const,
};
