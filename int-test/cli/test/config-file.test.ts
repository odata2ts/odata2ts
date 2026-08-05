import { exec } from "child_process";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { rimraf } from "rimraf";
import { afterEach, describe, expect, test } from "vitest";

// Resolves the actually compiled CLI entrypoint via the real (workspace-linked) dependency, so this test
// exercises the same artefact a real npm consumer runs.
const CLI_BIN = createRequire(import.meta.url).resolve("@odata2ts/odata2ts/lib/run-cli.js");

const FIXTURE_DIR = path.join(import.meta.dirname, "fixture");
const MULTI_SERVICE = path.join(FIXTURE_DIR, "multi-service");
const SINGLE_SERVICE = path.join(FIXTURE_DIR, "single-service");
const DUMMY_SOURCE = path.join(FIXTURE_DIR, "dummy.xml");

/**
 * How the CLI arrives at what it generates: the config file it discovers, the arguments which override it,
 * and the service selection.
 *
 * This is the generation *run*, not the generated code - nothing here asserts anything about the emitted
 * TypeScript beyond whether a file was produced at all. What the options do to the output belongs to the
 * generator tests and to `int-test/config-variants`.
 *
 * The CLI finds its config file by searching upwards from the working directory, so every case runs the
 * binary in a fixture directory of its own.
 */
describe("Config File Test", () => {
  afterEach(async () => {
    await Promise.all([rimraf(path.join(MULTI_SERVICE, "build")), rimraf(path.join(SINGLE_SERVICE, "build"))]);
  });

  test("without arguments every configured service is generated", async () => {
    const result = await runCli([], MULTI_SERVICE);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Loaded config file:");
    await expectGenerated(MULTI_SERVICE, "build/alpha/AlphaService.ts");
    await expectGenerated(MULTI_SERVICE, "build/beta/BetaService.ts");
  });

  test("naming a service restricts the run to it", async () => {
    const result = await runCli(["beta"], MULTI_SERVICE);

    expect(result.code).toBe(0);
    await expectGenerated(MULTI_SERVICE, "build/beta/BetaService.ts");
    await expectNotGenerated(MULTI_SERVICE, "build/alpha");
  });

  test("naming several services restricts the run to those", async () => {
    const result = await runCli(["alpha", "beta"], MULTI_SERVICE);

    expect(result.code).toBe(0);
    await expectGenerated(MULTI_SERVICE, "build/alpha/AlphaService.ts");
    await expectGenerated(MULTI_SERVICE, "build/beta/BetaService.ts");
  });

  test("an unknown service name is refused, and the message names it", async () => {
    const result = await runCli(["gamma"], MULTI_SERVICE);

    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain("gamma");
    expect(result.stderr).toContain("doesn't exist in configuration");
    await expectNotGenerated(MULTI_SERVICE, "build");
  });

  test("--source and --output replace the configured services rather than overriding them", async () => {
    // Not a precedence rule but a consequence of what the two options mean: a source and an output describe
    // exactly one service, so there is nothing to merge them into. The configured services drop out
    // entirely and only the file's base settings survive - which is why this asserts that the configured
    // output stays *absent*, not merely that the one from the command line appears.
    const result = await runCli(
      ["-s", DUMMY_SOURCE, "-o", "build/from-cli", "--service-name", "FromCli"],
      SINGLE_SERVICE,
    );

    expect(result.code).toBe(0);
    await expectGenerated(SINGLE_SERVICE, "build/from-cli/FromCliService.ts");
    await expectNotGenerated(SINGLE_SERVICE, "build/from-config");
  });

  test("a config file without services demands --source and --output", async () => {
    // ... and says so, rather than generating nothing and exiting cleanly
    const result = await runCli([], FIXTURE_DIR);

    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain("--source");
    expect(result.stderr).toContain("--output");
  });

  test("debug decides whether the emitted code exempts itself from type checking", async () => {
    // The one place `debug: false` is deliberate. Without the option every generated file opens with
    // `@ts-nocheck`, which makes a type check over that output meaningless - the reason every other
    // generating test configuration in this repository switches it on.
    await runCli(["-s", DUMMY_SOURCE, "-o", "build/quiet", "--service-name", "Quiet"], SINGLE_SERVICE);
    const quiet = await readFile(path.join(SINGLE_SERVICE, "build/quiet/QuietService.ts"), "utf-8");
    expect(quiet).toContain("@ts-nocheck");

    await runCli(["-s", DUMMY_SOURCE, "-o", "build/loud", "--service-name", "Loud", "-d"], SINGLE_SERVICE);
    const loud = await readFile(path.join(SINGLE_SERVICE, "build/loud/LoudService.ts"), "utf-8");
    expect(loud).not.toContain("@ts-nocheck");
  });
});

async function expectGenerated(cwd: string, relativePath: string) {
  const content = await readFile(path.join(cwd, relativePath), "utf-8");
  expect(content.length).toBeGreaterThan(0);
}

async function expectNotGenerated(cwd: string, relativePath: string) {
  await expect(readFile(path.join(cwd, relativePath), "utf-8")).rejects.toThrow();
}

interface CliResult {
  code: number;
  stdout: string;
  stderr: string;
}

function runCli(args: Array<string>, cwd: string): Promise<CliResult> {
  return new Promise((resolve) => {
    exec(`node ${CLI_BIN} ${args.join(" ")}`, { cwd }, (error, stdout, stderr) => {
      resolve({ code: error && error.code ? error.code : 0, stdout, stderr });
    });
  });
}
