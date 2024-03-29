import { EmitModes, Modes, RunOptions } from "../src";
import { runApp } from "../src/app";
import * as Generator from "../src/generator";
import * as ProjectManager from "../src/project/ProjectManager";
import { ODataModelBuilderV2 } from "./data-model/builder/v2/ODataModelBuilderV2";
import { ODataModelBuilderV4 } from "./data-model/builder/v4/ODataModelBuilderV4";
import { getTestConfig } from "./test.config";

jest.mock("fs-extra");
jest.mock("ts-morph");
jest.mock("../src/generator");

const SERVICE_NAME = "Tester";

describe("App Test", () => {
  let runOptions: RunOptions;
  let odataBuilder: ODataModelBuilderV4;
  let createPmSpy: jest.SpyInstance;
  let pmSpy: ProjectManager.ProjectManager;
  let logInfoSpy: jest.SpyInstance;

  beforeAll(async () => {
    // @ts-ignore
    pmSpy = {
      createModelFile: jest.fn(),
      createQObjectFile: jest.fn(),
      createMainServiceFile: jest.fn(),
      writeFiles: jest.fn(),
    };
    // @ts-ignore
    createPmSpy = jest.spyOn(ProjectManager, "createProjectManager").mockResolvedValue(pmSpy);

    logInfoSpy = jest.spyOn(console, "log").mockImplementation(jest.fn);
  });

  beforeEach(async () => {
    jest.clearAllMocks();

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
    jest.resetAllMocks();
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
    expect(createPmSpy.mock.calls[0][0]).toMatchObject({
      service: `${newNs}Service`,
    });
  });

  test("simple schema detection with changed order", async () => {
    // when multiple schemas exist
    odataBuilder.addEntityType("Test", undefined, (builder) => builder.addKeyProp("id", "Edm.String"));

    const newNs = "New";
    odataBuilder.addSchema(newNs);

    await doRunApp();

    // then the schema with entity types is used
    expect(createPmSpy.mock.calls[0][0]).toMatchObject({
      service: `${SERVICE_NAME}Service`,
    });
  });

  test("simple schema detection with pascal case", async () => {
    // when multiple schemas exist
    const newNs = "my.org.Example";
    const expected = "MyOrgExample";
    odataBuilder.addSchema(newNs).addEntityType("Test", undefined, (builder) => builder.addKeyProp("id", "Edm.String"));

    await doRunApp();

    // then the schema with entity types is used
    expect(createPmSpy.mock.calls[0][0]).toMatchObject({
      service: `${expected}Service`,
    });
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
    runOptions.disableAutomaticNameClashResolution = false;

    // same entity name across different namespaces
    const newNs = "New";
    odataBuilder
      .addEntityType("Test", undefined, (builder) => builder.addKeyProp("id", "Edm.String"))
      .addSchema(newNs)
      .addEntityType("Test", undefined, (builder) => builder.addKeyProp("id", "Edm.String"));

    await doRunApp();

    expect(logInfoSpy).toHaveBeenCalledTimes(2);
    expect(logInfoSpy).toHaveBeenLastCalledWith(
      "Duplicate name: Test - Fully Qualified Names: Tester.Test, New.Test (renamed to: Test2)"
    );
  });

  test("App: generate only models", async () => {
    // given preset runOptions
    // when running the app
    await doRunApp();

    // then project manager was called with our arguments
    expect(createPmSpy.mock.calls[0][0]).toMatchObject({
      model: "TesterModel",
      qObject: "QTester",
      service: "TesterService",
    });
    expect(createPmSpy.mock.calls[0][1]).toBe(runOptions.output);
    expect(createPmSpy.mock.calls[0][2]).toBe(runOptions.emitMode);
    expect(createPmSpy.mock.calls[0][3]).toBe(runOptions.prettier);

    // then only generateModels was called
    expect(Generator.generateModels).toHaveBeenCalled();
    expect(Generator.generateQueryObjects).not.toHaveBeenCalled();
    expect(Generator.generateServices).not.toHaveBeenCalled();

    // then files should have been written
    expect(pmSpy.writeFiles).toHaveBeenCalled();
  });

  test("App: generate also QObjects", async () => {
    // given
    runOptions.mode = Modes.qobjects;
    runOptions.output = "testing";
    runOptions.emitMode = EmitModes.js_dts;
    runOptions.prettier = true;

    // when running the app
    await doRunApp();

    // then project manager was called with our arguments
    expect(createPmSpy.mock.calls[0][1]).toBe("testing");
    expect(createPmSpy.mock.calls[0][2]).toBe(EmitModes.js_dts);
    expect(createPmSpy.mock.calls[0][3]).toBe(true);

    // then generateModels & generateQObjects was called
    expect(Generator.generateModels).toHaveBeenCalled();
    expect(Generator.generateQueryObjects).toHaveBeenCalled();
    expect(Generator.generateServices).not.toHaveBeenCalled();

    // then files should have been written
    expect(pmSpy.writeFiles).toHaveBeenCalled();
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

    // then files should have been written
    expect(pmSpy.writeFiles).toHaveBeenCalled();
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

    // then files should have been written
    expect(pmSpy.writeFiles).toHaveBeenCalled();
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

    // then files should have been written
    expect(pmSpy.writeFiles).toHaveBeenCalled();
  });
});
