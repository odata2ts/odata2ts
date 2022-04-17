import path from "path";
import { exec } from "child_process";
import { pathExistsSync, removeSync } from "fs-extra";

// This test suite needs a longer timeout, since node process is started
jest.setTimeout(10 * 1000); // 10 secs

const OUTPUT_PATH = "./int-test/generated";
const DUMMY_SOURCE = "./int-test/fixture/v4/dummy.xml";

describe.skip("Run-Cli Test", () => {
  test("Smoke Test", async () => {
    const result = await runCli();

    expect(result.stderr).not.toBeUndefined();
    expect(result.code).toBe(1);
  });

  // TODO:
  //  a) we need a real, but minimal OData spec here
  //  b) specific response code if file isn't valid
  test.skip("Simple", async () => {
    const result = await runCli(["-s", DUMMY_SOURCE, "-o", OUTPUT_PATH]);

    expect(result.code).toBe(0);
    expect(result.stderr).toBe("");
  });

  test("Fail without source", async () => {
    const result = await runCli(["-o", OUTPUT_PATH]);

    expect(result.stderr).toContain("-s");
    expect(result.stderr).toContain("--source");
    expect(result.stderr).toContain("required");
    expect(result.code).toBe(1);
    // expect(result.stdout).toBe("");
  });

  test("Fail without output directory", async () => {
    const result = await runCli(["-s", DUMMY_SOURCE]);

    expect(result.stderr).toContain("-o");
    expect(result.stderr).toContain("--output");
    expect(result.stderr).toContain("required");
    expect(result.code).toBe(1);
    // expect(result.stdout).toBe("");
  });

  test("Fail with missing source", async () => {
    const misleadingFilePath = "doesntExistFile.nef";
    const result = await runCli(["-s", misleadingFilePath, "-o", OUTPUT_PATH]);

    expect(result.stderr).toContain(misleadingFilePath);
    expect(result.stderr).toContain("doesn't exist");
    expect(result.code).toBe(2);
    expect(result.stdout).toContain(`Reading file: ${misleadingFilePath}`);
  });

  test("Create output folder if it doesn't exist", async () => {
    const genDirBase = OUTPUT_PATH;
    const genDir = `${genDirBase}/xyz`;
    const args = ["-s", DUMMY_SOURCE, "-o", genDir];
    removeSync(genDirBase);

    await runCli(args);

    expect(pathExistsSync(genDir)).toBeTruthy();

    removeSync(genDirBase);
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
    exec(
      `yarn ts-node --cwd-mode -T ${path.resolve("./src/run-cli.ts")} ${args?.join(" ")}`,
      (error, stdout, stderr) => {
        resolve({
          code: error && error.code ? error.code : 0,
          error,
          stdout,
          stderr,
        });
      }
    );
  });
}
