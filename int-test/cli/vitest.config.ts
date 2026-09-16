import { defineConfig } from "vitest/config";
import { coverageReporterOptions, integrationCoverageIncludes } from "../../vitest-coverage.shared.js";
import { workspaceAlias } from "../../vitest-resolve.shared.js";

/**
 * Integration tests for the odata2ts CLI itself - local and deterministic, no server involved. The
 * tests exec the compiled CLI binary as a subprocess, which coverage instrumentation cannot see, so
 * this coverage run exists for denominator parity with the server suites (ADR 0004), not to credit
 * the CLI path.
 *
 * `root` is the repository root, not this suite's directory: the coverage denominator (the runtime
 * packages' `src/`) lives at the repository root, and Vitest only instruments and reports files
 * inside the project root - with the suite directory as root, the istanbul provider crashes on the
 * untested-files pass.
 */
export default defineConfig({
  root: "../..",
  resolve: {
    alias: workspaceAlias,
  },
  test: {
    include: ["int-test/cli/test/**/*.test.ts"],
    coverage: {
      ...coverageReporterOptions,
      include: integrationCoverageIncludes(),
      reportsDirectory: "int-test/cli/coverage",
    },
  },
});
