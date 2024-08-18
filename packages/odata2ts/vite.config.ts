import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // TODO
    globals: true,
    server: {
      deps: {
        inline: ["prettier", "cosmiconfig"],
      },
    },
  },
});
