import { defineConfig } from "vitest/config";
import { coverageReporterOptions, integrationCoverageIncludes } from "../../vitest-coverage.shared.js";
import { workspaceAlias } from "../../vitest-resolve.shared.js";

/**
 * Integration tests for the CAP "Library" server.
 *
 * `globalSetup` provisions the running server (Docker container via testcontainers, or an externally
 * started server when `LIBRARY_BASE_URL` is set) and hands its base URL to the tests via `provide` /
 * `inject`. See `test/globalSetup.ts`.
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
    globalSetup: ["./int-test/cap/test/globalSetup.ts"],
    include: ["int-test/cap/test/**/*.test.ts"],
    // integration tests hit a real server - no artificial timeouts
    testTimeout: 30_000,
    // pulling and starting the container happens within the setup hook
    hookTimeout: 180_000,
    // all files share one server instance, so writes in one file must not race reads in another
    fileParallelism: false,
    coverage: {
      ...coverageReporterOptions,
      include: integrationCoverageIncludes(),
      reportsDirectory: "int-test/cap/coverage",
    },
  },
});
