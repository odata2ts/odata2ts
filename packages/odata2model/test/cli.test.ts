import * as cosmiConfig from "cosmiconfig";
import type { CosmiconfigResult } from "cosmiconfig/dist/types";
import fsExtra from "fs-extra";

import * as app from "../src/app";
import { Cli } from "../src/cli";
import { getDefaultConfig } from "../src/defaultConfig";
import { CliOptions, ConfigFileOptions, EmitModes, Modes, RunOptions } from "../src/OptionModel";

jest.mock("fs-extra");
jest.mock("../src/app");
jest.mock("cosmiconfig");

describe("Cli Test", () => {
  const EXIT_MSG = "process.exit was called.";
  const ORIGINAL_ARGS = process.argv;
  const STANDARD_ARGS = ["node-bin.js", "cli.ts"];
  const DEFAULT_OPTS: CliOptions = {
    mode: Modes.all,
    emitMode: EmitModes.js_dts,
    output: "./test/fixture",
    prettier: false,
    debug: false,
  };
  const CONFIG: RunOptions = { ...getDefaultConfig(), source: "./test/fixture/dummy.xml", output: "./test/fixture" };

  let processExitSpy: jest.SpyInstance;
  let logInfoSpy: jest.SpyInstance;
  let logErrorSpy: jest.SpyInstance;
  let defaultArgs = ["-s", CONFIG.source, "-o", CONFIG.output];
  let runOptions: CliOptions;
  let mockCosmi = {
    search: jest.fn().mockResolvedValue({}),
  };
  let mockConfig: CosmiconfigResult;

  beforeAll(() => {
    // mock the real app, we're only testing the CLI here
    // => provide Promise implementation to make things work
    // @ts-ignore
    app.runApp.mockResolvedValue();

    // mock loading of config file via IO
    // @ts-ignore
    jest.spyOn(cosmiConfig, "cosmiconfig").mockImplementation(() => mockCosmi);

    // mock console to keep a clean test output
    logInfoSpy = jest.spyOn(console, "log").mockImplementation(jest.fn);
    logErrorSpy = jest.spyOn(console, "error").mockImplementation(jest.fn);
  });

  beforeEach(() => {
    // clear mock state before each test
    jest.clearAllMocks();

    // mock program arguments
    process.argv = STANDARD_ARGS;

    // mock process.exit => would otherwise also exit test run
    processExitSpy = jest.spyOn(process, "exit").mockImplementationOnce(() => {
      throw new Error(EXIT_MSG);
    });

    // default run options
    runOptions = { ...DEFAULT_OPTS };

    mockConfig = {
      config: {},
      isEmpty: false,
      filepath: `${process.cwd}/.testrc`,
    };

    // @ts-ignore
    fsExtra.pathExists.mockResolvedValue(true);
    // @ts-ignore
    fsExtra.readFile.mockResolvedValue("");
  });

  afterAll(() => {
    process.argv = ORIGINAL_ARGS;

    jest.resetAllMocks();
  });

  /**
   * Executes a CLI run.
   *
   * @param args mocked to be process args
   */
  async function runCli(args: Array<string> = []): Promise<void> {
    process.argv = [...STANDARD_ARGS, ...args];
    return new Cli().run();
  }

  /**
   * Test successful CLI run:
   * - no errors occur
   * - run options which are passed to app are matching with ours
   */
  async function testCli(args: Array<string> = defaultArgs) {
    await expect(runCli(args)).resolves.toBeUndefined();

    expect(process.exit).not.toHaveBeenCalled();
    expect(app.runApp).toHaveBeenCalledWith(null, { ...CONFIG, ...runOptions });
  }

  test("Most simple successful run", async () => {
    await testCli(defaultArgs);
  });

  async function failBadArgs(args: Array<string>) {
    await expect(runCli(args)).rejects.toThrow();

    expect(process.exit).toHaveBeenCalledWith(1);
    // expect(process.exit).toHaveBeenCalledWith(1);
    expect(app.runApp).not.toHaveBeenCalled();
  }

  test("Fail without source", async () => {
    await failBadArgs(defaultArgs.slice(0, 2));
  });
  test("Fail without output", async () => {
    await failBadArgs(defaultArgs.slice(2));
  });
  test("Fail with unknown option", async () => {
    await failBadArgs([...defaultArgs, "--unknown"]);
  });

  async function testMode(mode: Modes) {
    const args = [...defaultArgs, "-m", Modes[mode]];
    runOptions.mode = mode;

    await testCli(args);
  }

  test("Test mode option", async () => {
    await testMode(Modes.all);
    await testMode(Modes.qobjects);
    await testMode(Modes.service);
    await testMode(Modes.models);
  });

  test("Fail with unknown mode", async () => {
    await failBadArgs([...defaultArgs, "-m", "xxx"]);
  });

  async function testEmitMode(mode: EmitModes) {
    const args = [...defaultArgs, "-e", mode];
    runOptions.emitMode = mode;

    await testCli(args);
  }

  test("Test emit mode option", async () => {
    await testEmitMode(EmitModes.dts);
    await testEmitMode(EmitModes.js_dts);
    await testEmitMode(EmitModes.js);
    await testEmitMode(EmitModes.dts);
    await testEmitMode(EmitModes.ts);
  });

  test("Fail with unknown mode", async () => {
    await failBadArgs([...defaultArgs, "-e", "xxx"]);
  });

  async function testPrettier(prettier: boolean) {
    const args = [...defaultArgs];
    if (prettier) {
      args.push("-p");
    }
    runOptions.prettier = prettier;

    await testCli(args);
  }

  test("Test prettier option", async () => {
    await testPrettier(false);
    await testPrettier(true);
  });

  async function testDebug(debug: boolean) {
    const args = [...defaultArgs];
    if (debug) {
      args.push("-d");
    }
    runOptions.debug = debug;

    await testCli(args);
  }

  test("Test prettier option", async () => {
    await testDebug(true);
    await testDebug(false);
  });

  test("Fail pathExists", async () => {
    // @ts-ignore
    fsExtra.pathExists.mockResolvedValue(false);

    await expect(runCli(defaultArgs)).rejects.toThrow(EXIT_MSG);

    expect(processExitSpy).toHaveBeenCalledWith(2);
    expect(app.runApp).not.toHaveBeenCalled();
    expect(logErrorSpy).toHaveBeenCalledTimes(1);
  });

  test("Fail emptyDir", async () => {
    // @ts-ignore
    fsExtra.emptyDir.mockRejectedValueOnce(new Error("Oh No!"));

    await expect(runCli(defaultArgs)).rejects.toThrow(EXIT_MSG);

    expect(processExitSpy).toHaveBeenCalledWith(3);
    expect(app.runApp).not.toHaveBeenCalled();
    expect(logErrorSpy).toHaveBeenCalledTimes(1);
  });

  test("Fail runApp", async () => {
    // @ts-ignore
    app.runApp.mockRejectedValueOnce(new Error("Oh No!"));

    await expect(runCli(defaultArgs)).rejects.toThrow(EXIT_MSG);

    expect(processExitSpy).toHaveBeenCalledWith(99);
    expect(logErrorSpy).toHaveBeenCalledTimes(1);
  });

  test("Config loaded but empty", async () => {
    // given are the defaults
    // when returning empty config
    mockCosmi.search = jest.fn().mockResolvedValue(mockConfig);

    // then defaults should work
    await testCli();
  });

  test("Config loaded", async () => {
    // given a custom config
    mockConfig!.config = {
      mode: Modes.models,
      emitMode: EmitModes.dts,
      model: {
        prefix: "I",
        suffix: "Model",
      },
      prettier: true,
      debug: true,
    } as ConfigFileOptions;

    // when returning empty config
    mockCosmi.search = jest.fn().mockResolvedValue(mockConfig);
    await runCli(defaultArgs);

    // then config should have been used to determine runOptions
    const { mode, ...mockOpts } = mockConfig!.config;
    expect(app.runApp).toHaveBeenCalledWith(null, {
      ...CONFIG,
      mode: Modes.models,
      ...mockOpts,
    });
  });
});
