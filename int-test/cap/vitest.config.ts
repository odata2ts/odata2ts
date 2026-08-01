import { defineConfig } from "vitest/config";

/**
 * Integration tests for the CAP "Library" server.
 *
 * `globalSetup` provisions the running server (Docker container via testcontainers, or an externally
 * started server when `LIBRARY_BASE_URL` is set) and hands its base URL to the tests via `provide` /
 * `inject`. See `test/globalSetup.ts`.
 */
export default defineConfig({
  test: {
    globalSetup: ["./test/globalSetup.ts"],
    include: ["test/**/*.test.ts"],
    // integration tests hit a real server - no artificial timeouts
    testTimeout: 30_000,
    // pulling and starting the container happens within the setup hook
    hookTimeout: 180_000,
    // all files share one server instance, so writes in one file must not race reads in another
    fileParallelism: false,
  },
});
