import { Cli } from "../src/cli";
import * as app from "../src/app";
import { EmitModes, Modes, RunOptions } from "../src/OptionModel";
import fsExtra from "fs-extra";

jest.mock("fs-extra");
jest.mock("../src/app");

describe("Cli Test", () => {
  const EXIT_MSG = "process.exit was called.";
  const ORIGINAL_ARGS = process.argv;
  const STANDARD_ARGS = ["node-bin.js", "cli.ts"];

  let processExitSpy: jest.SpyInstance;
  let logInfoSpy: jest.SpyInstance;
  let logErrorSpy: jest.SpyInstance;
  let defaultArgs = ["-s", "./test/fixture/dummy.xml", "-o", "./test/fixture"];
  let runOptions: RunOptions;

  beforeEach(() => {
    // clear mock state before each test
    jest.clearAllMocks();

    // mock program arguments
    process.argv = STANDARD_ARGS;

    // mock process.exit => would otherwise also exit test run
    processExitSpy = jest.spyOn(process, "exit").mockImplementationOnce(() => {
      throw new Error(EXIT_MSG);
    });

    // mock the real app, we're only testing the CLI here
    // => provide Promise implementation to make things work
    // @ts-ignore
    app.runApp.mockResolvedValue();

    // mock console to keep a clean test output
    logInfoSpy = jest.spyOn(console, "log").mockImplementation(jest.fn);
    logErrorSpy = jest.spyOn(console, "error").mockImplementation(jest.fn);

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

    //@ts-ignore
    fsExtra.pathExists.mockResolvedValue(true);
    //@ts-ignore
    fsExtra.readFile.mockResolvedValue("");
  });

  afterAll(() => {
    process.argv = ORIGINAL_ARGS;
  });

  test("Smoke Test", async () => {
    await expect(runCli()).rejects.toThrow(EXIT_MSG);

    expect(process.exit).not.toHaveBeenCalledWith(0);
    expect(app.runApp).not.toHaveBeenCalled();
  });

  async function testCli(args: Array<string> = defaultArgs) {
    await expect(runCli(args)).resolves.toBeUndefined();

    expect(process.exit).not.toHaveBeenCalled();
    expect(app.runApp).toHaveBeenCalledWith(null, runOptions);
  }

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

  test("Fail ensureDir", async () => {
    // @ts-ignore
    fsExtra.ensureDir.mockRejectedValueOnce(new Error("Oh No!"));

    await expect(runCli(defaultArgs)).rejects.toThrow(EXIT_MSG);

    expect(processExitSpy).toHaveBeenCalledWith(3);
    expect(app.runApp).not.toHaveBeenCalled();
    expect(logErrorSpy).toHaveBeenCalledTimes(1);
  });

  test("Fail runApp", async () => {
    // @ts-ignore
    app.runApp.mockRejectedValue(new Error("Oh No!"));

    await expect(runCli(defaultArgs)).rejects.toThrow(EXIT_MSG);

    expect(processExitSpy).toHaveBeenCalledWith(99);
    expect(logErrorSpy).toHaveBeenCalledTimes(1);
  });

  async function runCli(args: Array<string> = []): Promise<void> {
    process.argv = [...STANDARD_ARGS, ...args];
    return new Cli().run();
  }
});
