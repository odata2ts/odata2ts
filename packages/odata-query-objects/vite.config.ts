import { defineConfig } from "vitest/config";
import { coverageReporterOptions } from "../../vitest-coverage.shared";
import { workspaceAlias } from "../../vitest-resolve.shared";

export default defineConfig({
  resolve: {
    alias: workspaceAlias,
  },
  test: {
    coverage: {
      ...coverageReporterOptions,
      include: ["src/**"],
    },
  },
});
