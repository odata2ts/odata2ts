import { fileURLToPath } from "node:url";
import { defaultExclude, defineConfig } from "vitest/config";
import { coverageReporterOptions } from "./vitest-coverage.shared";

/*
 * This config is also loaded when a package runs vitest with its own directory as root - there is no
 * per-package config in `examples/*`. The exclusions below describe the **aggregate run started from the
 * repository root** and must not leak into those scoped runs, where they would remove exactly the tests
 * that were asked for: `examples/ts-floor-check` runs a bare `vitest run` whose own `int-test/` would
 * match `int-test/**`, and `examples/main` runs `--dir int-test` on the very path excluded here.
 */
const repoRoot = fileURLToPath(new URL(".", import.meta.url)).replace(/\/$/, "");
const isAggregateRun = process.cwd() === repoRoot;

export default defineConfig({
  test: {
    globals: true,
    /*
     * This is THE place that decides what the unit / coverage run executes. Vitest 4 removed
     * `vitest.workspace.ts`, so a bare `vitest run` walks the whole repository from here and only this
     * exclude keeps things out of it.
     *
     * - `int-test/**` needs real OData servers as Docker containers. It is its own workspace group with
     *   its own CI stage (`yarn int-test`), and must never be pulled into the unit run - it would fail
     *   on any machine without Docker.
     * - `examples/**` are just examples and must be build and run on demand; ok, a bit misused by the
     *   test converters, which are example converters.
     * - `odata-core` are just typing tests with no test suite at all
     *
     * Everything else stays in: The int-tests of cli-test
     * and ts-floor-check stay too - they are local and deterministic.
     *
     * Note: a custom exclude replaces vitest's defaults instead of extending them, hence defaultExclude.
     */
    exclude: isAggregateRun
      ? [...defaultExclude, "int-test/**", "examples/**", "packages/odata-core/**"]
      : defaultExclude,
    coverage: {
      ...coverageReporterOptions,
      include: ["packages/**/src/**"],
    },
  },
});
