import { writeFile } from "fs/promises";
import path from "path";

import { remove } from "fs-extra";
import { Project, SourceFile } from "ts-morph";
import * as TsMorph from "ts-morph";
import { ModuleKind, ModuleResolutionKind, ScriptTarget } from "typescript";

import { EmitModes } from "../../src";
import { ProjectFiles } from "../../src/data-model/DataModel";
import * as Formatter from "../../src/project/formatter";
import { createProjectManager } from "../../src/project/ProjectManager";

// global mock for file operations
jest.mock("fs-extra");
jest.mock("fs/promises");
// global mock for ts-morph to keep this a unit test
jest.mock("ts-morph");

describe("ProjectManager Test", () => {
  const SERVICE_NAME = "Tester";

  const MOCK_PROJECT: Project = {
    // @ts-ignore
    createSourceFile: jest.fn((filePath: string) => ({
      getFilePath: () => filePath,
      getFullText: () => "",
    })),
    // @ts-ignore
    emit: jest.fn(),
  };

  let projectFiles: ProjectFiles;
  let outputDir: string;
  let emitMode: EmitModes;
  let usePrettier: boolean;

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

    projectFiles = {
      model: `${SERVICE_NAME}Model`,
      qObject: `q${SERVICE_NAME}`,
      service: `${SERVICE_NAME}Service`,
    };
    outputDir = "build";
    emitMode = EmitModes.ts;
    usePrettier = true;
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  async function doCreateProjectManager(tsConfig: string | undefined = undefined) {
    return createProjectManager(projectFiles, outputDir, emitMode, usePrettier, tsConfig);
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
        strict: true,
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
        strict: true,
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

  test("ProjectManager: no TS file emitting when empty", async () => {
    // given emit mode and initialized project manager
    emitMode = EmitModes.ts;
    const pm = await doCreateProjectManager();

    // when writing files
    await pm.writeFiles();

    expect(MOCK_PROJECT.emit).not.toHaveBeenCalled();
    expect(writeFile).not.toHaveBeenCalled();
  });

  async function testTsMorphEmitMode(counter: number, mode: EmitModes) {
    // given emit mode and initialized project manager
    emitMode = mode;
    const pm = await doCreateProjectManager();

    // when writing files
    await pm.writeFiles();

    const expectedParams = { emitOnlyDtsFiles: emitMode === EmitModes.dts };
    expect(MOCK_PROJECT.emit).toHaveBeenCalledWith(expectedParams);
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
    // existing file should have been removed first
    await expect(remove).toHaveBeenCalledWith(completeFilePath);
    // ts-morph was used to create source file
    await expect(MOCK_PROJECT.createSourceFile).toHaveBeenCalledWith(completeFilePath);

    return completeFilePath;
  }

  test("ProjectManager: create, get and write model file", async () => {
    // given an initialized project manager
    const pm = await doCreateProjectManager();
    expect(pm.getModelFile()).toBeUndefined();

    // when creating model file
    const result = await pm.createModelFile();

    // then file was created properly
    const filePath = await testFileCreation(result, projectFiles.model);
    expect(pm.getModelFile()).toBe(result);

    // when writing all files
    await pm.writeFiles();

    // then only this file is written
    expect(writeFile).toHaveBeenCalledTimes(1);
    expect(writeFile).toHaveBeenCalledWith(filePath, "");
  });

  test("ProjectManager: create & get qObject file", async () => {
    // given an initialized project manager
    const pm = await doCreateProjectManager();
    expect(pm.getQObjectFile()).toBeUndefined();

    // when creating file
    const result = await pm.createQObjectFile();

    // then file was created properly
    const filePath = await testFileCreation(result, projectFiles.qObject);
    expect(pm.getQObjectFile()).toBe(result);

    // when writing all files
    await pm.writeFiles();

    // then only this file is written
    expect(writeFile).toHaveBeenCalledTimes(1);
    expect(writeFile).toHaveBeenCalledWith(filePath, "");
  });

  test("ProjectManager: create & get main service file", async () => {
    // given an initialized project manager
    const pm = await doCreateProjectManager();
    expect(pm.getMainServiceFile()).toBeUndefined();

    // when creating file
    const result = await pm.createMainServiceFile();

    // then file was created properly
    const filePath = await testFileCreation(result, "TesterService");
    expect(pm.getMainServiceFile()).toBe(result);

    // when writing all files
    await pm.writeFiles();

    // then only this file is written
    expect(writeFile).toHaveBeenCalledTimes(1);
    expect(writeFile).toHaveBeenCalledWith(filePath, "");
  });
});
