import fsExtra from "fs-extra";
import * as cosmiConfig from "cosmiconfig";
import type { CosmiconfigResult } from "cosmiconfig/dist/types";

import { Cli } from "../src/cli";
import { EmitModes, Modes, RunOptions } from "../src/OptionModel";
import * as app from "../src/app";

jest.mock("fs-extra");
jest.mock("../src/app");
jest.mock("cosmiconfig");

describe("Cli Test", () => {
  const EXIT_MSG = "process.exit was called.";
  const ORIGINAL_ARGS = process.argv;
  const STANDARD_ARGS = ["node-bin.js", "cli.ts"];

  let processExitSpy: jest.SpyInstance;
  let logInfoSpy: jest.SpyInstance;
  let logErrorSpy: jest.SpyInstance;
  let defaultArgs = ["-s", "./test/fixture/dummy.xml", "-o", "./test/fixture"];
  let runOptions: Partial<RunOptions>;
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
    runOptions = {
      mode: Modes.all,
      emitMode: EmitModes.js_dts,
      output: "./test/fixture",
      modelPrefix: "",
      modelSuffix: "",
      prettier: false,
      debug: false,
    };

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
   *
   * @param args
   */
  async function testCli(args: Array<string> = defaultArgs) {
    await expect(runCli(args)).resolves.toBeUndefined();

    expect(process.exit).not.toHaveBeenCalled();
    expect(app.runApp).toHaveBeenCalledWith(null, runOptions);
  }

  test("Smoke Test", async () => {
    await expect(runCli()).rejects.toThrow(EXIT_MSG);

    expect(process.exit).not.toHaveBeenCalledWith(0);
    expect(app.runApp).not.toHaveBeenCalled();
  });

  test("Most simple successful run", async () => {
    await testCli();
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

  async function testModelPrefixSuffix(prefix: string = "", suffix: string = "") {
    const args = [...defaultArgs, "-prefix", prefix, "-suffix", suffix];
    runOptions.modelPrefix = prefix;
    runOptions.modelSuffix = suffix;

    await testCli(args);
  }

  test("Test model-prefix and model-suffix option", async () => {
    await testModelPrefixSuffix();
    await testModelPrefixSuffix("I");
    await testModelPrefixSuffix("", "Model");
    await testModelPrefixSuffix("I", "Model");
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
      mode: Modes[Modes.models],
      emitMode: EmitModes.dts,
      modelPrefix: "I",
      modelSuffix: "Model",
      prettier: true,
      debug: true,
    };

    // when returning empty config
    mockCosmi.search = jest.fn().mockResolvedValue(mockConfig);
    await runCli(defaultArgs);

    // then config should have been used to determine runOptions
    const { mode, ...mockOpts } = mockConfig!.config;
    expect(app.runApp).toHaveBeenCalledWith(null, {
      output: "./test/fixture",
      mode: Modes.models,
      ...mockOpts,
    });
  });
});
