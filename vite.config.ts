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
     * - `examples/main/int-test/**` talks to the live services at services.odata.org, which makes it
     *   dependent on a third party being up and quick. It has its own CI job so a hiccup over there does
     *   not redden unrelated PRs. It contributes no coverage anyway: coverage only includes
     *   packages/**\/src, while examples resolve the packages to their built lib.
     *
     * Everything else stays in: `examples/*` `test/` suites run against the artifacts the generator
     * really produced and are the only place a generator regression shows up. The int-tests of cli-test
     * and ts-floor-check stay too - they are local and deterministic.
     *
     * Note: a custom exclude replaces vitest's defaults instead of extending them, hence defaultExclude.
     */
    exclude: isAggregateRun ? [...defaultExclude, "int-test/**", "examples/main/int-test/**"] : defaultExclude,
    coverage: {
      ...coverageReporterOptions,
      include: ["packages/**/src/**"],
    },
  },
});
