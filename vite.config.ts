import { defaultExclude, defineConfig } from "vitest/config";
import { coverageReporterOptions } from "./vitest-coverage.shared";

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
    exclude: [...defaultExclude, "int-test/**", "examples/main/int-test/**"],
    coverage: {
      ...coverageReporterOptions,
      include: ["packages/**/src/**"],
    },
  },
});
