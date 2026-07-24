import { exec } from "child_process";
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { rimraf } from "rimraf";
import { afterAll, describe, expect, test } from "vitest";

// Resolves the actually compiled CLI entrypoint via the real (workspace-linked) dependency,
// so this test generates from the same artefact a real npm consumer would use. As with the
// other examples/* packages, the workspace must already be built (`yarn build`) beforehand;
// this test does not build it itself.
const CLI_BIN = createRequire(import.meta.url).resolve("@odata2ts/odata2ts/lib/run-cli.js");

// Resolved relative to this file, not `process.cwd()`: a root-level `vitest run` across the
// whole workspace does not chdir into each project, so plain relative paths would resolve
// against the repo root instead of this package.
const PACKAGE_ROOT = path.resolve(import.meta.dirname, "..");
const FIXTURE = path.join(PACKAGE_ROOT, "int-test/fixture/trippin.xml");
const OUT_DIR = path.join(PACKAGE_ROOT, "build");
const FLOOR_TSC = path.join(PACKAGE_ROOT, "floor-ts/node_modules/.bin/tsc");

// This file gets swept up by any workspace-wide `vitest run` (e.g. the root `yarn coverage`),
// not just this package's own `int-test` script. Only the latter is preceded by
// `yarn install-floor-ts`, so skip gracefully instead of failing when floor-ts isn't there.
const FLOOR_TS_INSTALLED = existsSync(FLOOR_TSC);

// Deliberately conservative: what a project on the declared minimum TS version would
// realistically configure, not this repo's own (much newer) tsconfig.settings.json.
const MINIMAL_TSCONFIG = {
  compilerOptions: {
    target: "ES2016",
    module: "CommonJS",
    moduleResolution: "node",
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    noEmit: true,
  },
};

interface CliResult {
  code: number;
  stdout: string;
  stderr: string;
}

function run(command: string, cwd: string): Promise<CliResult> {
  return new Promise((resolve) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      resolve({ code: error && "code" in error ? Number(error.code) : 0, stdout, stderr });
    });
  });
}

describe("TypeScript floor check", () => {
  afterAll(() => rimraf(OUT_DIR));

  // Spawns a real CLI generation run (the full client — models, q-objects and services, the
  // default mode) plus a full `tsc` type-check pass, which can comfortably exceed the default
  // timeout when run alongside the rest of the workspace's test suite (this file is not exempt
  // from the combined root-level `vitest run`/`yarn coverage` sweep, so the timeout must be set
  // here rather than only via a CLI flag on this package's own scripts).
  test.skipIf(!FLOOR_TS_INSTALLED)(
    "generated Trippin client type-checks under the declared floor TS",
    async () => {
      const generated = await run(`node ${CLI_BIN} -s ${FIXTURE} -o ${OUT_DIR} --emit-mode ts`, PACKAGE_ROOT);
      if (generated.code !== 0) {
        throw new Error(`Generation failed, exit ${generated.code}:\n${generated.stdout}\n${generated.stderr}`);
      }

      await writeFile(path.join(OUT_DIR, "tsconfig.json"), JSON.stringify(MINIMAL_TSCONFIG, null, 2));
      const result = await run(`${FLOOR_TSC} -p tsconfig.json`, OUT_DIR);

      expect(result.stdout + result.stderr).toBe("");
      expect(result.code).toBe(0);
    },
    30_000,
  );
});
