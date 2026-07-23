import { exec } from "child_process";
import { access } from "node:fs/promises";
import { createRequire } from "node:module";
import { rimraf } from "rimraf";
import { afterAll, describe, expect, test } from "vitest";

// Resolves the actually compiled CLI entrypoint via the real (workspace-linked) dependency,
// so this test exercises the same artefact a real npm consumer runs.
const CLI_BIN = createRequire(import.meta.url).resolve("@odata2ts/odata2ts/lib/run-cli.js");

const OUTPUT_PATH = "./int-test/build";
const DUMMY_SOURCE = "./int-test/fixture/dummy.xml";

describe("Run-Cli Test", () => {
  afterAll(() => rimraf(OUTPUT_PATH));

  test("Smoke Test", async () => {
    const result = await runCli();

    expect(result.stderr).not.toBeUndefined();
    expect(result.code).toBe(1);
  });

  test("Simple", async () => {
    const result = await runCli(["-s", DUMMY_SOURCE, "-o", OUTPUT_PATH, "--emit-mode", "ts"]);

    expect(result.code).toBe(0);
    expect(result.stderr).toBe("");
  });

  test("Fail without source", async () => {
    const result = await runCli(["-o", OUTPUT_PATH]);

    expect(result.stderr).toContain("--source");
    expect(result.stderr).toContain("--output");
    expect(result.stderr).toContain("must be specified");
    expect(result.code).toBe(1);
  });

  test("Fail without output directory", async () => {
    const result = await runCli(["-s", DUMMY_SOURCE]);

    expect(result.stderr).toContain("--source");
    expect(result.stderr).toContain("--output");
    expect(result.stderr).toContain("must be specified");
    expect(result.code).toBe(1);
  });

  test("Fail with missing source", async () => {
    const misleadingFilePath = "doesntExistFile.nef";
    const result = await runCli(["-s", misleadingFilePath, "-o", OUTPUT_PATH]);

    expect(result.stderr).toContain(misleadingFilePath);
    expect(result.stderr).toContain("doesn't exist");
    expect(result.code).toBe(2);
    expect(result.stdout).toContain(`Didn't find metadata file at:`);
    expect(result.stdout).toContain(misleadingFilePath);
  });

  test("Create output folder if it doesn't exist", async () => {
    const genDirBase = OUTPUT_PATH;
    const genDir = `${genDirBase}/xyz`;
    const args = ["-s", DUMMY_SOURCE, "-o", genDir, "--emit-mode", "ts"];
    await rimraf(genDirBase);

    await runCli(args);

    // throws (and fails the test) if the directory wasn't created
    await access(genDir);

    await rimraf(genDirBase);
  });
});

interface CliResult {
  code: number;
  error: any;
  stdout: string;
  stderr: string;
}

function runCli(args?: Array<string>): Promise<CliResult> {
  return new Promise((resolve) => {
    exec(`node ${CLI_BIN} ${args?.join(" ") ?? ""}`, (error, stdout, stderr) => {
      resolve({
        code: error && error.code ? error.code : 0,
        error,
        stdout,
        stderr,
      });
    });
  });
}
