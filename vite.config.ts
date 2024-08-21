import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // TODO
    globals: true,
    coverage: {
      provider: "istanbul",
      include: ["packages/**/src/**"],
      reporter: ["lcov", "html-spa"],
    },
  },
});
