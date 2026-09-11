import { fileURLToPath } from "node:url";
import { coverageConfigDefaults } from "vitest/config";

/**
 * The packages the integration flag measures: the runtime only. The generator (odata2ts) is out of
 * the denominator - it never executes under Vitest in the int-test suites: codegen runs in each
 * suite's build script, and the cli suite execs the compiled CLI as a subprocess istanbul cannot
 * see. See ADR 0004 (workspace root: docs/adr/0004-integration-coverage-flag.md).
 */
export const integrationCoveragePackages = [
  "odata-core",
  "odata-query-objects",
  "odata-query-builder",
  "odata-service",
] as const;

/**
 * The coverage include globs for an integration run, resolved to absolute paths at the repository
 * root (this file lives there) - absolute so they hold no matter which Vitest project root the
 * int-test package runs under.
 */
export function integrationCoverageIncludes(): string[] {
  const repoRoot = fileURLToPath(new URL(".", import.meta.url)).replace(/\/$/, "");
  return integrationCoveragePackages.map((pkg) => `${repoRoot}/packages/${pkg}/src/**`);
}

export const coverageReporterOptions = {
  provider: "istanbul" as const,
  // Mutable on purpose: Vitest's `CoverageOptions.reporter` takes a mutable array and does not
  // export its `CoverageReporter` element type (`string & {}`-widened), so an `as const` tuple is
  // not assignable.
  reporter: ["lcov", "html-spa"],
  // A package-level coverage run writes its HTML report to `packages/<pkg>/coverage`, mirroring the
  // sources below it - `coverage/src/NamingModel.ts.html`. That path matches the source glob of the
  // aggregate run, which then tries to parse the report as a source file to count it as uncovered and
  // dies with a SyntaxError. Vitest's own default only keeps the root's `coverage` out, never the
  // package ones.
  exclude: [...coverageConfigDefaults.exclude, "**/coverage/**"],
};
