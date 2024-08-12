import type { MockInstance } from "vitest";
import { vi } from "vitest";

import { EmitModes, Modes, RunOptions } from "../src";
import { runApp } from "../src/app";
import * as Generator from "../src/generator";
import * as ProjectManager from "../src/project/ProjectManager";
import { ODataModelBuilderV2 } from "./data-model/builder/v2/ODataModelBuilderV2";
import { ODataModelBuilderV4 } from "./data-model/builder/v4/ODataModelBuilderV4";
import { getTestConfig } from "./test.config";

vi.mock("fs-extra");
vi.mock("ts-morph");
vi.mock("../src/generator");
const { namingHelperSpy } = vi.hoisted(() => {
  const spy = vi.fn();
  return { namingHelperSpy: spy };
});
vi.mock("../src/data-model/NamingHelper", async (importOriginal) => {
  const original = await importOriginal();
  // @ts-ignore
  const { NamingHelper: TheNamingHelper } = original;

  class Mock extends TheNamingHelper {
    constructor(...args: any) {
      super(...args);
      namingHelperSpy(...args);
    }
  }

  return { NamingHelper: Mock };
});

describe("App Test", () => {
  const SERVICE_NAME = "Tester";
  let runOptions: RunOptions;
  let odataBuilder: ODataModelBuilderV4;
  let createPmSpy: MockInstance;
  let logInfoSpy: MockInstance;

  beforeAll(async () => {
    // @ts-ignore
    createPmSpy = vi.spyOn(ProjectManager, "createProjectManager").mockResolvedValue(vi.fn());

    logInfoSpy = vi.spyOn(console, "log").mockImplementation(() => vi.fn());
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    odataBuilder = new ODataModelBuilderV4(SERVICE_NAME);
    runOptions = {
      ...getTestConfig(),
      mode: Modes.models,
      emitMode: EmitModes.ts,
      source: "ignore",
      output: "ignore",
      prettier: false,
      debug: false,
    };
  });

  afterAll(() => {
    vi.resetAllMocks();
  });

  function doRunApp() {
    return runApp(odataBuilder.getModel(), runOptions);
  }

  test("simple schema detection", async () => {
    // when multiple schemas exist
    const newNs = "New";
    odataBuilder.addSchema(newNs).addEntityType("Test", undefined, (builder) => builder.addKeyProp("id", "Edm.String"));

    await doRunApp();

    // then the schema with entity types is used
    expect(namingHelperSpy).toHaveBeenCalledWith(runOptions, newNs, [
      [SERVICE_NAME, undefined],
      [newNs, undefined],
    ]);
  });

  test("simple schema detection with changed order", async () => {
    // when multiple schemas exist
    odataBuilder.addEntityType("Test", undefined, (builder) => builder.addKeyProp("id", "Edm.String"));

    const newNs = "New";
    odataBuilder.addSchema(newNs);

    await doRunApp();

    // then the schema with entity types is used
    expect(namingHelperSpy).toHaveBeenCalledWith(runOptions, SERVICE_NAME, [
      [SERVICE_NAME, undefined],
      [newNs, undefined],
    ]);
  });

  test("simple schema detection with pascal case", async () => {
    // when multiple schemas exist
    const newNs = "my.org.Example";
    const expected = "MyOrgExample";
    odataBuilder.addSchema(newNs).addEntityType("Test", undefined, (builder) => builder.addKeyProp("id", "Edm.String"));

    await doRunApp();

    // then the schema with entity types is used
    expect(namingHelperSpy).toHaveBeenCalledWith(runOptions, expected, [
      [SERVICE_NAME, undefined],
      [newNs, undefined],
    ]);
  });

  test("with validation errors", async () => {
    runOptions.disableAutomaticNameClashResolution = true;

    // same entity name across different namespaces
    const newNs = "New";
    odataBuilder
      .addEntityType("Test", undefined, (builder) => builder.addKeyProp("id", "Edm.String"))
      .addSchema(newNs)
      .addEntityType("Test", undefined, (builder) => builder.addKeyProp("id", "Edm.String"));

    try {
      await doRunApp();
    } catch (error) {
      expect(error?.toString()).toContain("same name across different namespaces!");
    }

    expect(logInfoSpy).toHaveBeenCalledTimes(2);
    expect(logInfoSpy).toHaveBeenLastCalledWith("Duplicate name: Test - Fully Qualified Names: Tester.Test, New.Test");
  });

  test("with automatic name clash resolution", async () => {
    // same entity name across different namespaces
    const newNs = "New";
    odataBuilder
      .addEntityType("Test", undefined, (builder) => builder.addKeyProp("id", "Edm.String"))
      .addSchema(newNs)
      .addEntityType("Test", undefined, (builder) => builder.addKeyProp("id", "Edm.String"));

    await doRunApp();

    expect(logInfoSpy).toHaveBeenNthCalledWith(
      2,
      "Duplicate name: Test - Fully Qualified Names: Tester.Test, New.Test (renamed to: Test2)"
    );
  });

  test("App: no name clash resolution if not bundled", async () => {
    runOptions.bundledFileGeneration = false;

    // same entity name across different namespaces
    const newNs = "New";
    odataBuilder
      .addEntityType("Test", undefined, (builder) => builder.addKeyProp("id", "Edm.String"))
      .addSchema(newNs)
      .addEntityType("Test", undefined, (builder) => builder.addKeyProp("id", "Edm.String"));

    await doRunApp();

    expect(logInfoSpy).toHaveBeenNthCalledWith(1, "Successfully generated models!");
    expect(logInfoSpy).toHaveBeenNthCalledWith(2, "Successfully finished!");
  });

  test("App: generate only models", async () => {
    // given preset runOptions
    // when running the app
    await doRunApp();

    // then project manager was called with our arguments
    expect(createPmSpy.mock.calls[0][0]).toBe(runOptions.output);
    expect(createPmSpy.mock.calls[0][1]).toBe(runOptions.emitMode);
    expect(createPmSpy.mock.calls[0][4]).toStrictEqual({
      usePrettier: false,
      bundledFileGeneration: true,
      tsConfigPath: "tsconfig.json",
      allowTypeChecking: false,
    });

    // then only generateModels was called
    expect(Generator.generateModels).toHaveBeenCalled();
    expect(Generator.generateQueryObjects).not.toHaveBeenCalled();
    expect(Generator.generateServices).not.toHaveBeenCalled();
  });

  test("App: generate also QObjects", async () => {
    // given
    runOptions.mode = Modes.qobjects;
    runOptions.output = "testing";
    runOptions.emitMode = EmitModes.js_dts;
    runOptions.prettier = true;
    runOptions.bundledFileGeneration = false;
    runOptions.tsconfig = "test.json";

    // when running the app
    await doRunApp();

    // then project manager was called with our arguments
    expect(createPmSpy.mock.calls[0][0]).toBe("testing");
    expect(createPmSpy.mock.calls[0][1]).toBe(EmitModes.js_dts);
    expect(createPmSpy.mock.calls[0][4]).toStrictEqual({
      usePrettier: true,
      bundledFileGeneration: false,
      tsConfigPath: "test.json",
      allowTypeChecking: false,
    });

    // then generateModels & generateQObjects was called
    expect(Generator.generateModels).toHaveBeenCalled();
    expect(Generator.generateQueryObjects).toHaveBeenCalled();
    expect(Generator.generateServices).not.toHaveBeenCalled();
  });

  test("App: generate also services", async () => {
    // given
    runOptions.mode = Modes.service;

    // when running the app
    await doRunApp();

    // then all generators have been called
    expect(Generator.generateModels).toHaveBeenCalled();
    expect(Generator.generateQueryObjects).toHaveBeenCalled();
    expect(Generator.generateServices).toHaveBeenCalled();
  });

  test("App: generate services for V2", async () => {
    // given
    runOptions.mode = Modes.service;

    // when running the app
    const builder = new ODataModelBuilderV2(SERVICE_NAME);
    await runApp(builder.getModel(), runOptions);

    // then all generators have been called
    expect(Generator.generateModels).toHaveBeenCalled();
    expect(Generator.generateQueryObjects).toHaveBeenCalled();
    expect(Generator.generateServices).toHaveBeenCalled();
  });

  test("App: generate all", async () => {
    // given
    runOptions.mode = Modes.all;

    // when running the app
    await doRunApp();

    // then all generators have been called
    expect(Generator.generateModels).toHaveBeenCalled();
    expect(Generator.generateQueryObjects).toHaveBeenCalled();
    expect(Generator.generateServices).toHaveBeenCalled();
  });
});
