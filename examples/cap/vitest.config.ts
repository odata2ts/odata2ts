import { defineConfig } from "vitest/config";

/**
 * Integration tests for the CAP "Library" server.
 *
 * `globalSetup` provisions the running server (Docker container via testcontainers, or an externally
 * started server when `LIBRARY_BASE_URL` is set) and hands its base URL to the tests via `provide` /
 * `inject`. See `int-test/globalSetup.ts`.
 */
export default defineConfig({
  test: {
    globalSetup: ["./int-test/globalSetup.ts"],
    include: ["int-test/**/*.test.ts"],
    // integration tests hit a real server - no artificial timeouts
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
});
