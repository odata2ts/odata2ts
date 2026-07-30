import { defaultExclude, defineConfig } from "vitest/config";
import { coverageReporterOptions } from "./vitest-coverage.shared";

export default defineConfig({
  test: {
    globals: true,
    /*
     * The int-tests of examples/main talk to the live OData services at services.odata.org, which makes them
     * dependent on a third party being up and quick. They run in their own CI job (see coverage.yml) instead,
     * so that a hiccup over there doesn't redden unrelated PRs. They contribute no coverage anyway: coverage
     * only includes packages/**\/src, while examples resolve the packages to their built lib.
     *
     * The int-tests of cli-test and ts-floor-check stay in this run - they are local and deterministic.
     *
     * Note: a custom exclude replaces vitest's defaults instead of extending them, hence defaultExclude.
     */
    exclude: [...defaultExclude, "examples/main/int-test/**"],
    coverage: {
      ...coverageReporterOptions,
      include: ["packages/**/src/**"],
    },
  },
});
