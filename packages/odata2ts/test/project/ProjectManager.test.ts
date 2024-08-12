import path from "path";

import { ODataTypesV4 } from "@odata2ts/odata-core";
import { ensureDir } from "fs-extra";
import { EmitResult } from "ts-morph";
import { vi } from "vitest";
import type { MockInstance } from "vitest";

import { EmitModes } from "../../src";
import { DataModel } from "../../src/data-model/DataModel";
import { digest } from "../../src/data-model/DataModelDigestionV4";
import { NamingHelper } from "../../src/data-model/NamingHelper";
import { createProjectManager } from "../../src/project/ProjectManager";
import { ODataModelBuilderV4 } from "../data-model/builder/v4/ODataModelBuilderV4";
import { getTestConfig } from "../test.config";

// global mock for file operations
vi.mock("fs-extra");

const fileHandlerSpy = vi.fn();
const writeMock = vi.fn();

vi.mock("../../src/project/FileHandler", async () => {
  const { FileHandler } = await vi.importActual("../../src/project/FileHandler");

  // @ts-ignore
  class MockFileHandler extends FileHandler {
    constructor(...args: any) {
      // @ts-ignore
      super(...args);
      fileHandlerSpy(...args);
    }

    public async write(emitMode: EmitModes): Promise<EmitResult | void> {
      writeMock(emitMode);
    }
  }

  return { FileHandler: MockFileHandler };
});

describe("ProjectManager Test", () => {
  const NAMESPACE = "ns.1.example";
  const SERVICE_NAME = "Tester";
  const ENTITY_FOLDER_PATH = "ns_1_example/my_entity";
  const DEFAULT_NAMING_HELPER = new NamingHelper(getTestConfig(), SERVICE_NAME, [[NAMESPACE]]);
  const MAIN_FILE_NAMES = { model: "TesterModel", qObject: "QTester", service: "TesterService" };

  const ENTITY_NAME = "MyEntity";
  const COMPLEX_NAME = "MyComplex";
  const ENUM_NAME = "MyEnum";
  const UNBOUND_OPERATION_NAME = "MyUnboundOp";
  const UNBOUND_OPERATION_NAME_NO_PARAMS = "MyUnboundParamlessOp";
  const BOUND_OPERATION_NAME = "MyBoundOp";
  const BOUND_OPERATION_NAME_NO_PARAMS = "MyBoundParamlessOp";

  let modelBuilder: ODataModelBuilderV4;

  let outputDir: string;
  let emitMode: EmitModes;
  let usePrettier: boolean;
  let bundledFileGeneration: boolean;
  let noOutput: boolean;

  let consoleSpy: MockInstance;

  let usedDataModel: DataModel | undefined;

  function withNs(name: string) {
    return `${NAMESPACE}.${name}`;
  }

  beforeAll(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  beforeEach(() => {
    vi.clearAllMocks();

    modelBuilder = new ODataModelBuilderV4(NAMESPACE);
    outputDir = "build/unitTest";
    emitMode = EmitModes.ts;
    usePrettier = true;
    bundledFileGeneration = true;
    noOutput = false;

    usedDataModel = undefined;
  });

  afterAll(() => {
    vi.resetAllMocks();
  });

  function useExhaustiveDataModel(mb: ODataModelBuilderV4) {
    mb.addEntityType(ENTITY_NAME, undefined, () => {})
      .addComplexType(COMPLEX_NAME, undefined, () => {})
      .addEnumType(ENUM_NAME, [])
      .addFunction(UNBOUND_OPERATION_NAME, ODataTypesV4.String, false, (builder) =>
        builder.addParam("test", ODataTypesV4.String)
      )
      .addFunction(UNBOUND_OPERATION_NAME_NO_PARAMS, ODataTypesV4.String, false)
      .addFunction(BOUND_OPERATION_NAME, ODataTypesV4.String, true, (builder) =>
        builder.addParam("binding", withNs(ENTITY_NAME)).addParam("test", ODataTypesV4.String)
      )
      .addFunction(BOUND_OPERATION_NAME_NO_PARAMS, ODataTypesV4.String, true, (builder) =>
        builder.addParam("bindingParam", withNs(ENTITY_NAME))
      );
  }

  async function doCreateProjectManager(tsConfig: string | undefined = undefined) {
    const testConfig = getTestConfig();
    usedDataModel = await digest(modelBuilder.getSchemas(), testConfig, DEFAULT_NAMING_HELPER);
    return createProjectManager(outputDir, emitMode, DEFAULT_NAMING_HELPER, usedDataModel, {
      usePrettier,
      tsConfigPath: tsConfig,
      bundledFileGeneration,
      noOutput,
    });
  }

  function checkFileHandlerCreation(filePath: string, fileName: string, allowTypeChecking = false) {
    expect(fileHandlerSpy).toHaveBeenCalledWith(
      filePath,
      fileName,
      // we don't check the SourceFile from ts-morph
      expect.anything(),
      // todo: import container
      expect.anything(),
      // we don't want to check the formatter
      expect.anything(),
      allowTypeChecking
    );
  }

  function checkFileHandlerCreationForBundledFiles(fileName: string, reservedNames: Array<string> = []) {
    expect(fileHandlerSpy).toHaveBeenCalledWith(
      // no path for bundled files
      "",
      fileName,
      // we don't check the SourceFile from ts-morph
      expect.anything(),
      // todo: import container
      expect.anything(),
      // we don't want to check the formatter
      expect.anything(),
      false
    );
  }

  test("Smoke Test", async () => {
    const pm = await doCreateProjectManager();

    expect(pm.getCachedFiles()).toBeUndefined();
    expect(pm.getMainServiceFile()).toBeUndefined();
    expect(pm.getDataModel()).toBeDefined();

    await pm.init();
    expect(ensureDir).not.toHaveBeenCalled();
  });

  test("Ensure Directories for Unbundled File Generation", async () => {
    // when unbundled file generation is active
    bundledFileGeneration = false;
    // and whe have entity models
    useExhaustiveDataModel(modelBuilder);

    // then on creating the PM
    await doCreateProjectManager();

    // one folder has been created for each entity: entityType, complexType and enumType
    expect(ensureDir).toHaveBeenCalledTimes(3);
    expect(ensureDir).toHaveBeenNthCalledWith(3, `${outputDir}/${ENTITY_FOLDER_PATH}`.replaceAll("/", path.sep));
  });

  test("Init & finalize bundled models file", async () => {
    const pm = await doCreateProjectManager();

    // when initializing models
    pm.initModels();

    // then bundled model file has been created
    checkFileHandlerCreationForBundledFiles(MAIN_FILE_NAMES.model);

    // when retrieving a model (with any parameters whatsoever)
    const file = pm.createOrGetModelFile("any", "any");
    expect(file).toBeDefined();

    // then we get the same file
    expect(file).toBe(pm.createOrGetModelFile("x", "y", ["z"]));
    expect(file).toBe(pm.createOrGetMainModelFile());

    // and created exactly one file
    expect(fileHandlerSpy).toHaveBeenCalledTimes(1);

    // nothing happens here
    await pm.finalizeFile(file);
    expect(writeMock).not.toHaveBeenCalled();

    // when finalizing
    await pm.finalizeModels();

    // then file is written
    expect(writeMock).toHaveBeenCalled();
  });

  test("Init bundled models file with reserved names", async () => {
    // when using an actual data model
    useExhaustiveDataModel(modelBuilder);
    const pm = await doCreateProjectManager();

    pm.initModels();

    // then all sorts of interfaces will be created, these are the reservedNames
    checkFileHandlerCreationForBundledFiles(MAIN_FILE_NAMES.model, [
      ENUM_NAME,
      COMPLEX_NAME,
      `Editable${COMPLEX_NAME}`,
      ENTITY_NAME,
      `Editable${ENTITY_NAME}`,
      `${ENTITY_NAME}Id`,
      `${ENTITY_NAME}_${BOUND_OPERATION_NAME}Params`,
      `${UNBOUND_OPERATION_NAME}Params`,
    ]);
  });

  test("Init & finalize unbundled models", async () => {
    // given filepath and name & unbundled mode
    const folderPath = "my-path";
    const fileName = "MyModel";
    bundledFileGeneration = false;

    // when initializing models
    const pm = await doCreateProjectManager();
    pm.initModels();

    // then no file is created
    expect(fileHandlerSpy).not.toHaveBeenCalled();

    // when requesting the file
    const file = pm.createOrGetModelFile(folderPath, fileName);

    // then file is created
    checkFileHandlerCreation(folderPath, fileName, true);

    // when finalizing
    await pm.finalizeFile(file);

    // then file is written
    expect(writeMock).toHaveBeenCalledTimes(1);

    // nothing happens here
    await pm.finalizeModels();
    expect(writeMock).toHaveBeenCalledTimes(1);
  });

  test("Unbundled models with main model file", async () => {
    // given unbundled mode
    bundledFileGeneration = false;

    const pm = await doCreateProjectManager();

    // when requesting the main model file
    const file = pm.createOrGetMainModelFile();

    // then file is created
    checkFileHandlerCreation("", "TesterModel", true);

    // when finalizing models, then main file is not written => empty
    await pm.finalizeModels();
    expect(writeMock).not.toHaveBeenCalled();

    // when adding stuff and finalizing models, then file is written
    file.getFile().addInterface({ name: "xyz" });
    await pm.finalizeModels();
    expect(writeMock).toHaveBeenCalledTimes(1);
  });

  test("Init & finalize bundled q-objects file", async () => {
    const pm = await doCreateProjectManager();

    // when initializing models
    pm.initQObjects();

    // then bundled model file has been created
    checkFileHandlerCreationForBundledFiles(MAIN_FILE_NAMES.qObject);

    // when retrieving a model (with any parameters whatsoever)
    const file = pm.createOrGetQObjectFile("any", "any");
    expect(file).toBeDefined();

    // then we get the same file
    expect(file).toBe(pm.createOrGetQObjectFile("x", "y", ["z"]));
    expect(file).toBe(pm.createOrGetMainQObjectFile());

    // and created exactly one file
    expect(fileHandlerSpy).toHaveBeenCalledTimes(1);

    // nothing happens here
    await pm.finalizeFile(file);
    expect(writeMock).not.toHaveBeenCalled();

    // when finalizing
    await pm.finalizeQObjects();

    // then file is written
    expect(writeMock).toHaveBeenCalled();
  });

  test("Init bundled q-objects file with reserved names", async () => {
    // when using an actual data model
    useExhaustiveDataModel(modelBuilder);
    const pm = await doCreateProjectManager();

    pm.initQObjects();

    // then all sorts of interfaces will be created, these are the reservedNames
    checkFileHandlerCreationForBundledFiles(MAIN_FILE_NAMES.qObject, [
      `Q${COMPLEX_NAME}`,
      `q${COMPLEX_NAME}`,
      `Q${ENTITY_NAME}`,
      `q${ENTITY_NAME}`,
      `Q${ENTITY_NAME}Id`,
      `${ENTITY_NAME}_Q${BOUND_OPERATION_NAME}`,
      `${ENTITY_NAME}_Q${BOUND_OPERATION_NAME_NO_PARAMS}`,
      `Q${UNBOUND_OPERATION_NAME}`,
      `Q${UNBOUND_OPERATION_NAME_NO_PARAMS}`,
    ]);
  });

  test("Init & finalize unbundled q-objects", async () => {
    // given filepath and name & unbundled mode
    const folderPath = "my-path";
    const fileName = "MyModel";
    bundledFileGeneration = false;

    // when initializing models
    const pm = await doCreateProjectManager();
    pm.initQObjects();

    // then no file is created
    expect(fileHandlerSpy).not.toHaveBeenCalled();

    // when requesting the file
    const file = pm.createOrGetQObjectFile(folderPath, fileName);

    // then file is created
    checkFileHandlerCreation(folderPath, fileName);

    // when finalizing
    await pm.finalizeFile(file);

    // then file is written
    expect(writeMock).toHaveBeenCalled();

    // nothing happens here
    await pm.finalizeQObjects();
    expect(writeMock).toHaveBeenCalledTimes(1);
  });

  test("Unbundled q-objects with main q-object file", async () => {
    // given unbundled mode
    bundledFileGeneration = false;
    const pm = await doCreateProjectManager();

    // when requesting the main q-object file
    const file = pm.createOrGetMainQObjectFile();

    // then file is created
    checkFileHandlerCreation("", "QTester");

    // when finalizing models, then main file is not written => empty
    await pm.finalizeQObjects();
    expect(writeMock).not.toHaveBeenCalled();

    // when adding stuff and finalizing models, then file is written
    file.getFile().addInterface({ name: "xyz" });
    await pm.finalizeQObjects();
    expect(writeMock).toHaveBeenCalledTimes(1);
  });

  test("Init & finalize bundled service file", async () => {
    const pm = await doCreateProjectManager();

    // when initializing models
    pm.initServices();

    // then main service file has been created
    checkFileHandlerCreationForBundledFiles(MAIN_FILE_NAMES.service, [MAIN_FILE_NAMES.service]);

    // when retrieving a service file (with any parameters whatsoever)
    const file = pm.createOrGetServiceFile("any", "any");
    expect(file).toBeDefined();

    // then we get the same file
    expect(file).toBe(pm.createOrGetServiceFile("x", "y", ["z"]));

    // and created exactly one file
    expect(fileHandlerSpy).toHaveBeenCalledTimes(1);

    // nothing happens here
    await pm.finalizeFile(file);
    expect(writeMock).not.toHaveBeenCalled();

    // when finalizing
    await pm.finalizeServices();

    // then file is written
    expect(writeMock).toHaveBeenCalledTimes(1);
  });

  test("Init bundled service file with reserved names", async () => {
    // when using an actual data model
    useExhaustiveDataModel(modelBuilder);
    const pm = await doCreateProjectManager();

    pm.initServices();

    // then all sorts of interfaces will be created, these are the reservedNames
    checkFileHandlerCreationForBundledFiles(MAIN_FILE_NAMES.service, [
      MAIN_FILE_NAMES.service,
      `${ENTITY_NAME}Service`,
      `${ENTITY_NAME}CollectionService`,
      `${COMPLEX_NAME}Service`,
      `${COMPLEX_NAME}CollectionService`,
    ]);
  });

  test("Init & finalize unbundled services", async () => {
    // given filepath and name & unbundled mode
    const folderPath = "my-path";
    const fileName = "MyModel";
    bundledFileGeneration = false;

    // when initializing models
    const pm = await doCreateProjectManager();
    pm.initServices();

    // then main service file is created
    checkFileHandlerCreation("", MAIN_FILE_NAMES.service); //[MAIN_FILE_NAMES.service]

    // when requesting a new file
    const file = pm.createOrGetServiceFile(folderPath, fileName);

    // then a new one has been created
    checkFileHandlerCreation(folderPath, fileName);

    // when finalizing file
    await pm.finalizeFile(file);

    // then file is written
    expect(writeMock).toHaveBeenCalled();

    // when finalizing services
    await pm.finalizeServices();

    // then mainService file is written
    expect(writeMock).toHaveBeenCalledTimes(2);
  });

  test("Test no output", async () => {
    noOutput = true;
    const pm = await doCreateProjectManager();

    expect(pm.getCachedFiles()).toBeDefined();
    expect(pm.getCachedFiles().size).toBe(0);

    pm.initServices();
    await pm.finalizeServices();

    expect(pm.getCachedFiles().size).toBe(1);
  });

  // test("ProjectManager: create and write model file", async () => {
  //   // given an initialized project manager
  //   const pm = await doCreateProjectManager();
  //   pm.initModels();
  //
  //   // when creating model file
  //   const result = pm.createOrGetModelFile(ENTITY_FOLDER_PATH, ENTITY_NAME);
  //
  //   // then file was created properly
  //   const filePath = await testFileCreation(result.getFile(), projectFiles.model);
  //
  //   // when writing all files
  //   await pm.finalizeModels();
  //
  //   // then only this file is written
  //   expect(writeFile).toHaveBeenCalledTimes(1);
  //   expect(writeFile).toHaveBeenCalledWith(filePath, "");
  // });
  //
  // async function testFileCreation(createdFile: SourceFile, expectedFilePath: string) {
  //   const completeFilePath = path.join(outputDir, expectedFilePath + ".ts");
  //
  //   // we expect to get the stuff that was produced by project.createSourceFile
  //   expect(createdFile.getFilePath()).toBe(completeFilePath);
  //   // ts-morph was used to create source file
  //   expect(MOCK_PROJECT.createSourceFile).toHaveBeenCalledWith(completeFilePath);
  //
  //   return completeFilePath;
  // }
  //
  // test("ProjectManager: create & get qObject file", async () => {
  //   // given an initialized project manager
  //   const pm = await doCreateProjectManager();
  //   pm.initQObjects();
  //
  //   // when creating file
  //   const result = pm.createOrGetQObjectFile(ENTITY_FOLDER_PATH, ENTITY_NAME);
  //
  //   // then file was created properly
  //   const filePath = await testFileCreation(result.getFile(), projectFiles.qObject);
  //
  //   // when writing files
  //   await pm.finalizeQObjects();
  //
  //   // then only this file is written
  //   expect(writeFile).toHaveBeenCalledTimes(1);
  //   expect(writeFile).toHaveBeenCalledWith(filePath, "");
  // });
  //
  // test("ProjectManager: create & get main service file", async () => {
  //   // given an initialized project manager
  //   const pm = await doCreateProjectManager();
  //   expect(pm.getMainServiceFile()).toBeUndefined();
  //
  //   // when creating file
  //   pm.initServices();
  //
  //   // then file was created properly
  //   const result = pm.getMainServiceFile();
  //   const filePath = await testFileCreation(result.getFile(), "TesterService");
  //   expect(pm.getMainServiceFile()).toBe(result);
  //
  //   // when writing all files
  //   await pm.finalizeServices();
  //
  //   // then only this file is written
  //   expect(writeFile).toHaveBeenCalledTimes(1);
  //   expect(writeFile).toHaveBeenCalledWith(filePath, "");
  // });
});
