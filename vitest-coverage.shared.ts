import { coverageConfigDefaults } from "vitest/config";

export const coverageReporterOptions = {
  provider: "istanbul" as const,
  reporter: ["lcov", "html-spa"] as const,
  // A package-level coverage run writes its HTML report to `packages/<pkg>/coverage`, mirroring the
  // sources below it - `coverage/src/NamingModel.ts.html`. That path matches the source glob of the
  // aggregate run, which then tries to parse the report as a source file to count it as uncovered and
  // dies with a SyntaxError. Vitest's own default only keeps the root's `coverage` out, never the
  // package ones.
  exclude: [...coverageConfigDefaults.exclude, "**/coverage/**"],
};
