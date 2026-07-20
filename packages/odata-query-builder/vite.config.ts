import { defineConfig } from "vitest/config";
import { coverageReporterOptions } from "../../vitest-coverage.shared";

export default defineConfig({
  test: {
    coverage: {
      ...coverageReporterOptions,
      include: ["src/**"],
    },
  },
});
