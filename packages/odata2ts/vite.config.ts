import { defineConfig } from "vitest/config";
import { coverageReporterOptions } from "../../vitest-coverage.shared.js";
import { workspaceAlias } from "../../vitest-resolve.shared.js";

export default defineConfig({
  resolve: {
    alias: workspaceAlias,
  },
  test: {
    server: {
      deps: {
        inline: ["prettier", "cosmiconfig"],
      },
    },
    coverage: {
      ...coverageReporterOptions,
      include: ["src/**"],
    },
  },
});
