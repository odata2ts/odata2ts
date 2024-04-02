import { writeFile } from "fs/promises";
import path from "path";

import { ImportDeclarationStructure, OptionalKind, Project, SourceFile } from "ts-morph";
import * as TsMorph from "ts-morph";
import { ModuleKind, ModuleResolutionKind, ScriptTarget } from "typescript";

import { EmitModes } from "../../src";
import { DataModel, ProjectFiles } from "../../src/data-model/DataModel";
import { ODataVersion } from "../../src/data-model/DataTypeModel";
import { NamingHelper } from "../../src/data-model/NamingHelper";
import * as Formatter from "../../src/project/formatter";
import { createProjectManager } from "../../src/project/ProjectManager";
import { getTestConfig } from "../test.config";

// global mock for file operations
jest.mock("fs-extra");
jest.mock("fs/promises");
// global mock for ts-morph to keep this a unit test
jest.mock("ts-morph");

describe("ProjectManager Test", () => {
  const NAMESPACE = "ns.1.example";
  const SERVICE_NAME = "Tester";
  const ENTITY_FOLDER_PATH = `${NAMESPACE}/Example`;
  const ENTITY_NAME = "example";

  const mockFileEmit = jest.fn();
  const MOCK_PROJECT: Project = {
    // @ts-ignore
    createSourceFile: jest.fn((filePath: string) => ({
      getFilePath: () => filePath,
      getFullText: () => "",
      addImportDeclarations: (structures: OptionalKind<ImportDeclarationStructure>[]) => {},
      emit: mockFileEmit,
    })),
    // @ts-ignore
    emit: jest.fn(),
  };
  const namingHelper = new NamingHelper(getTestConfig(), SERVICE_NAME);

  let projectFiles: ProjectFiles;
  let outputDir: string;
  let emitMode: EmitModes;
  let usePrettier: boolean;
  let bundledFileGeneration: boolean;

  let projectConstructorSpy: jest.SpyInstance;
  let formatterSpy: jest.SpyInstance;
  let consoleSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeAll(() => {
    projectConstructorSpy = jest.spyOn(TsMorph, "Project").mockImplementation(() => MOCK_PROJECT);
    formatterSpy = jest.spyOn(Formatter, "createFormatter").mockResolvedValue({
      format: () => Promise.resolve(""),
      getSettings: () => ({}),
    });
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, "exit");
  });

  beforeEach(() => {
    jest.clearAllMocks();

    projectFiles = namingHelper.getFileNames();
    outputDir = "build/unitTest";
    emitMode = EmitModes.ts;
    usePrettier = true;
    bundledFileGeneration = true;
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  async function doCreateProjectManager(tsConfig: string | undefined = undefined) {
    const dataModel = new DataModel([["MyNamespace"]], ODataVersion.V4);
    return createProjectManager(outputDir, emitMode, namingHelper, dataModel, {
      usePrettier,
      tsConfigPath: tsConfig,
      bundledFileGeneration,
    });
  }

  test("Smoke Test", async () => {
    await doCreateProjectManager();

    expect(projectConstructorSpy.mock.calls[0][0]).toMatchObject({
      skipAddingFilesFromTsConfig: true,
      compilerOptions: {
        declaration: false,
        outDir: outputDir,
        target: ScriptTarget.ES2016,
        module: ModuleKind.CommonJS,
        moduleResolution: ModuleResolutionKind.NodeJs,
        lib: ["esnext"],
        types: ["node"],
        strict: false,
        allowJs: true,
      },
    });
  });

  // does work locally, but not in the cloud
  test.skip("Use tsconfig.example.json", async () => {
    await doCreateProjectManager("tsconfig.example.json");

    expect(projectConstructorSpy.mock.calls[0][0]).toStrictEqual({
      skipAddingFilesFromTsConfig: true,
      manipulationSettings: {},
      compilerOptions: {
        declaration: false,
        outDir: outputDir,
        target: ScriptTarget.ESNext,
        module: ModuleKind.UMD,
        moduleResolution: ModuleResolutionKind.NodeNext,
        lib: undefined,
        newLine: undefined,
      },
    });
  });

  test("Different Config Test", async () => {
    await doCreateProjectManager();

    expect(projectConstructorSpy.mock.calls[0][0]).toMatchObject({
      skipAddingFilesFromTsConfig: true,
      compilerOptions: {
        declaration: false,
        outDir: outputDir,
        target: ScriptTarget.ES2016,
        module: ModuleKind.CommonJS,
        moduleResolution: ModuleResolutionKind.NodeJs,
        lib: ["esnext"],
        types: ["node"],
        strict: false,
        allowJs: true,
      },
    });
  });

  async function testEmitModeDeclarations(counter: number, mode: EmitModes, declarationsShouldBeSet: boolean) {
    // given emit mode and initialized project manager
    emitMode = mode;

    // when project manager has been created
    await doCreateProjectManager();

    // then compiler options have been set correctly
    expect(projectConstructorSpy.mock.calls[counter][0].compilerOptions).toMatchObject({
      declaration: declarationsShouldBeSet,
      outDir: outputDir,
    });
  }

  test("ProjectManager: compiler options for DTS generation", async () => {
    let callCounter = -1;
    await testEmitModeDeclarations(++callCounter, EmitModes.js_dts, true);
    await testEmitModeDeclarations(++callCounter, EmitModes.dts, true);
    await testEmitModeDeclarations(++callCounter, EmitModes.js, false);
    await testEmitModeDeclarations(++callCounter, EmitModes.ts, false);
  });

  async function testTsMorphEmitMode(counter: number, mode: EmitModes) {
    // given emit mode and initialized project manager
    emitMode = mode;
    const pm = await doCreateProjectManager();

    // when writing files
    pm.initModels();
    await pm.finalizeModels();

    if (EmitModes.dts === mode) {
      expect(mockFileEmit).toHaveBeenCalledWith({ emitOnlyDtsFiles: true });
    } else {
      expect(mockFileEmit).toHaveBeenCalledWith();
    }
    expect(writeFile).not.toHaveBeenCalled();
  }

  test("ProjectManager: JS emit modes", async () => {
    let callCounter = -1;
    await testTsMorphEmitMode(++callCounter, EmitModes.js_dts);
    await testTsMorphEmitMode(++callCounter, EmitModes.js);
    await testTsMorphEmitMode(++callCounter, EmitModes.dts);
  });

  async function testFileCreation(createdFile: SourceFile, expectedFilePath: string) {
    const completeFilePath = path.join(outputDir, expectedFilePath + ".ts");

    // we expect to get the stuff that was produced by project.createSourceFile
    expect(createdFile.getFilePath()).toBe(completeFilePath);
    // ts-morph was used to create source file
    expect(MOCK_PROJECT.createSourceFile).toHaveBeenCalledWith(completeFilePath);

    return completeFilePath;
  }

  test.skip("ProjectManager: create, get and write model file", async () => {
    // given an initialized project manager
    const pm = await doCreateProjectManager();
    pm.initServices();

    // when creating model file
    const result = pm.createOrGetModelFile(ENTITY_FOLDER_PATH, ENTITY_NAME);

    // then file was created properly
    const filePath = await testFileCreation(result.getFile(), projectFiles.model);

    // when writing all files
    await pm.finalizeServices();

    // then only this file is written
    expect(writeFile).toHaveBeenCalledTimes(1);
    expect(writeFile).toHaveBeenCalledWith(filePath, "");
  });

  test("ProjectManager: create & get qObject file", async () => {
    // given an initialized project manager
    const pm = await doCreateProjectManager();
    pm.initQObjects();

    // when creating file
    const result = pm.createOrGetQObjectFile(ENTITY_FOLDER_PATH, ENTITY_NAME);

    // then file was created properly
    const filePath = await testFileCreation(result.getFile(), projectFiles.qObject);

    // when writing files
    await pm.finalizeQObjects();

    // then only this file is written
    expect(writeFile).toHaveBeenCalledTimes(1);
    expect(writeFile).toHaveBeenCalledWith(filePath, "");
  });

  test("ProjectManager: create & get main service file", async () => {
    // given an initialized project manager
    const pm = await doCreateProjectManager();
    expect(pm.getMainServiceFile()).toBeUndefined();

    // when creating file
    pm.initServices();

    // then file was created properly
    const result = pm.getMainServiceFile();
    const filePath = await testFileCreation(result.getFile(), "TesterService");
    expect(pm.getMainServiceFile()).toBe(result);

    // when writing all files
    await pm.finalizeServices();

    // then only this file is written
    expect(writeFile).toHaveBeenCalledTimes(1);
    expect(writeFile).toHaveBeenCalledWith(filePath, "");
  });
});
