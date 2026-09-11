import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import aspNetConfig from "../int-test/asp-net/vitest.config";
import capConfig from "../int-test/cap/vitest.config";
import cliConfig from "../int-test/cli/vitest.config";
import olingoConfig from "../int-test/olingo-v2/vitest.config";
import {
  coverageReporterOptions,
  integrationCoverageIncludes,
  integrationCoveragePackages,
} from "../vitest-coverage.shared";
import { workspaceAlias } from "../vitest-resolve.shared";

// This test lives in <repo root>/test/, so the repository root is one level up.
const repoRoot = fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");

describe("integrationCoveragePackages", () => {
  // ADR 0004: the integration flag measures the runtime packages only - the generator
  // (odata2ts) never executes under Vitest in the int-test suites.
  test("measures the four runtime packages and no other", () => {
    expect([...integrationCoveragePackages].sort()).toEqual([
      "odata-core",
      "odata-query-builder",
      "odata-query-objects",
      "odata-service",
    ]);
  });
});

describe("integrationCoverageIncludes", () => {
  test("resolves to the runtime packages' src/ at the repository root", () => {
    expect([...integrationCoverageIncludes()].sort()).toEqual(
      [
        `${repoRoot}/packages/odata-core/src/**`,
        `${repoRoot}/packages/odata-query-builder/src/**`,
        `${repoRoot}/packages/odata-query-objects/src/**`,
        `${repoRoot}/packages/odata-service/src/**`,
      ].sort(),
    );
  });
});

// The minimal shape the int-test configs must expose for this test - the configs are
// defineConfig modules, so they are read through this view rather than their full UserConfig type.
type IntTestConfigShape = {
  root: string;
  test: {
    include: string[];
    coverage: {
      include: string[];
      provider: string;
      reporter: string[];
      exclude: string[];
      reportsDirectory: string;
    };
  };
  resolve: {
    alias: Record<string, string>;
  };
};

const intTestConfigs: Array<[name: string, config: IntTestConfigShape]> = [
  ["asp-net", aspNetConfig as IntTestConfigShape],
  ["cap", capConfig as IntTestConfigShape],
  ["cli", cliConfig as IntTestConfigShape],
  ["olingo-v2", olingoConfig as IntTestConfigShape],
];

describe.each(intTestConfigs)("%s", (name, config) => {
  test("measures the runtime packages only, with the shared reporter options", () => {
    expect(config.test.coverage.include).toEqual(integrationCoverageIncludes());
    expect(config.test.coverage.provider).toBe(coverageReporterOptions.provider);
    expect(config.test.coverage.reporter).toEqual(coverageReporterOptions.reporter);
    expect(config.test.coverage.exclude).toEqual(coverageReporterOptions.exclude);
  });

  test("roots the project at the repository root, so the runtime packages are in-root files", () => {
    // ADR 0004: the denominator (the runtime packages' src/) lives at the repository root. Vitest
    // only instruments and reports files inside the project root - with the suite directory as
    // root, the istanbul provider crashes on the untested-files pass - so the suites run with the
    // repository root as project root (one level above the suite's int-test/ directory).
    expect(config.root).toBe("../..");
  });

  test("discovers only the suite's own test files", () => {
    expect(config.test.include).toEqual([`int-test/${name}/test/**/*.test.ts`]);
  });

  test("writes the coverage report to the suite's own coverage directory", () => {
    expect(config.test.coverage.reportsDirectory).toBe(`int-test/${name}/coverage`);
  });

  test("aliases the workspace packages to their src/ entry points", () => {
    expect(config.resolve.alias).toEqual(workspaceAlias);
  });
});
