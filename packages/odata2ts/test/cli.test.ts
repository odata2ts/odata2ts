import * as cosmiConfig from "cosmiconfig";
import type { CosmiconfigResult } from "cosmiconfig/dist/types";
import * as fsExtra from "fs-extra";

import { getDefaultConfig } from "../src";
import { CliOptions, ConfigFileOptions, EmitModes, Modes, RunOptions } from "../src";
import * as app from "../src/app";
import { Cli } from "../src/cli";
import * as downloader from "../src/download";

jest.mock("fs-extra");
jest.mock("cosmiconfig");
jest.mock("../src/app");
jest.mock("../src/download");

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
  // const DUMMY_XML = fs.readFileSync("./fixture/dummy.xml", { encoding: "utf8" });

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

  test("Test URL source", async () => {
    const url = "http://localhost:3000/api";
    const args = [...defaultArgs, "-u", url];
    const testDownload = "test";
    // @ts-ignore
    fsExtra.pathExists.mockResolvedValueOnce(false);
    const downloadSpy = jest.spyOn(downloader, "downloadMetadata").mockResolvedValueOnce(testDownload);
    const storeSpy = jest.spyOn(downloader, "storeMetadata").mockResolvedValueOnce("");

    await expect(runCli(args)).resolves.toBeUndefined();
    expect(process.exit).not.toHaveBeenCalled();

    expect(downloadSpy).toHaveBeenCalledWith(url, {}, false);
    expect(storeSpy).toHaveBeenCalledWith(CONFIG.source, testDownload, false);
  });

  test("Test URL source with force & debug & prettify", async () => {
    const url = "http://localhost:3000/api";
    const args = [...defaultArgs, "-u", url, "-d", "-f", "-p"];
    const testDownload = "test";
    const downloadSpy = jest.spyOn(downloader, "downloadMetadata").mockResolvedValueOnce(testDownload);
    const storeSpy = jest.spyOn(downloader, "storeMetadata").mockResolvedValueOnce("");

    await expect(runCli(args)).resolves.toBeUndefined();
    expect(process.exit).not.toHaveBeenCalled();

    expect(downloadSpy).toHaveBeenCalledWith(url, {}, true);
    expect(storeSpy).toHaveBeenCalledWith(CONFIG.source, testDownload, true);
  });

  test("Test URL source with failing request", async () => {
    const url = "http://localhost:3000/api";
    const args = [...defaultArgs, "-u", url, "-f"];
    const testError = new Error("Oh NO!!!");
    const downloadSpy = jest.spyOn(downloader, "downloadMetadata").mockRejectedValue(testError);
    const storeSpy = jest.spyOn(downloader, "storeMetadata").mockResolvedValueOnce("");

    await expect(runCli(args)).rejects.toThrow();
    expect(logErrorSpy).toHaveBeenCalledWith("Failed to load metadata! Message: " + testError.message);
    expect(process.exit).toHaveBeenCalledWith(10);

    expect(downloadSpy).toHaveBeenCalledWith(url, {}, false);
    expect(storeSpy).not.toHaveBeenCalled();
  });

  // test("Test URL source with failing request", async () => {
  //   // @ts-ignore: simulate failed request
  //   axios.request.mockRejectedValueOnce(new Error("Oh No!"));
  //
  //   const args = ["-s", "http://localhost:3000/api", "-o", CONFIG.output];
  //   await expect(runCli(args)).rejects.toThrow();
  //
  //   expect(logErrorSpy).toHaveBeenCalledWith("Failed to load metadata! Message: Oh No!");
  //   expect(process.exit).toHaveBeenCalledWith(10);
  // });

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

  test("Fail with unknown emit mode", async () => {
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

  test("Test TsConfig option", async () => {
    const testPath = "testPath";
    const args = [...defaultArgs, "-t", "testPath"];

    runOptions.tsconfig = testPath;
    await testCli(args);
  });

  async function testDebug(debug: boolean) {
    const args = [...defaultArgs];
    if (debug) {
      args.push("-d");
    }
    runOptions.debug = debug;

    await testCli(args);
  }

  test("Test debug option", async () => {
    await testDebug(true);
    await testDebug(false);
  });

  async function testNoAuto(noAuto: boolean) {
    const args = [...defaultArgs];
    if (noAuto) {
      args.push("-n");
    }
    runOptions.disableAutoManagedKey = noAuto;

    await testCli(args);
  }

  async function testServiceName(name: string) {
    const args = [...defaultArgs, "-name", name];
    runOptions.serviceName = name;

    await testCli(args);
  }

  test("Test serviceName option", async () => {
    await testServiceName("Tester");
    await testServiceName("none");
  });

  test("Test DisableAutoManagedKey option", async () => {
    await testNoAuto(false);
    await testNoAuto(true);
  });

  async function testAllowRenaming(allow: boolean) {
    const args = [...defaultArgs];
    if (allow) {
      args.push("-r");
    }
    runOptions.allowRenaming = allow;

    await testCli(args);
  }

  test("Test AllowRenaming option", async () => {
    await testAllowRenaming(false);
    await testAllowRenaming(true);
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
