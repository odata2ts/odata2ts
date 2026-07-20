import { defineConfig } from "vitest/config";
import { coverageReporterOptions } from "../../vitest-coverage.shared";

export default defineConfig({
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
