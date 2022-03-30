import { createProjectManager } from "../../src/project/ProjectManager";
import { EmitModes } from "../../src/OptionModel";
import { ProjectFiles } from "../../src/data-model/DataModel";
import * as TsMorph from "ts-morph";
import { remove } from "fs-extra";
import { Project } from "ts-morph";
import path from "path";

jest.mock("fs-extra");
// globally mock ts-morph to keep this a unit test
jest.mock("ts-morph");

describe("ProjectManager Test", () => {
  const SERVICE_NAME = "Tester";
  const MOCK_SOURCE_FILE = { test: "balloon" };
  const MOCK_PROJECT: Project = {
    // @ts-ignore
    createSourceFile: jest.fn(() => MOCK_SOURCE_FILE),
    // @ts-ignore
    emit: jest.fn(),
  };

  let projectFiles: ProjectFiles;
  let outputDir: string;
  let emitMode: EmitModes;
  let usePrettier: boolean;

  let projectConstructorSpy: jest.SpyInstance;

  beforeAll(() => {
    projectConstructorSpy = jest.spyOn(TsMorph, "Project").mockImplementation(() => MOCK_PROJECT);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    projectFiles = {
      model: `${SERVICE_NAME}Model`,
      qObject: `q${SERVICE_NAME}`,
      service: `${SERVICE_NAME}Service`,
    };
    outputDir = "build";
    emitMode = EmitModes.js_dts;
    usePrettier = true;
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  async function doCreateProjectManager() {
    return createProjectManager(projectFiles, outputDir, emitMode, usePrettier);
  }

  test("Smoke Test", async () => {
    await doCreateProjectManager();

    expect(projectConstructorSpy.mock.calls[0][0]).toMatchObject({
      skipAddingFilesFromTsConfig: true,
      compilerOptions: {
        declaration: true,
        outDir: outputDir,
      },
    });
  });

  async function testEmitModeDeclarations(counter: number, mode: EmitModes, declarationsShouldBeSet: boolean) {
    emitMode = mode;
    await doCreateProjectManager();

    expect(projectConstructorSpy.mock.calls[counter][0].compilerOptions).toEqual({
      declaration: declarationsShouldBeSet,
      outDir: outputDir,
    });
  }

  test("ProjectManager: set compiler option for DTS generation", async () => {
    let callCounter = -1;
    await testEmitModeDeclarations(++callCounter, EmitModes.js_dts, true);
    await testEmitModeDeclarations(++callCounter, EmitModes.dts, true);
    await testEmitModeDeclarations(++callCounter, EmitModes.js, false);
    await testEmitModeDeclarations(++callCounter, EmitModes.ts, false);
  });

  test("ProjectManager: create & get model file", async () => {
    const pm = await doCreateProjectManager();

    // initially no model file
    expect(pm.getModelFile()).toBeUndefined();

    // create model file
    const expectedModelFilePath = path.join(outputDir, "TesterModel.ts");
    const result = await pm.createModelFile();

    // we expect to get the stuff that was produced by project.createSourceFile
    expect(result).toBe(MOCK_SOURCE_FILE);
    // existing file should have been removed first
    await expect(remove).toHaveBeenCalledWith(expectedModelFilePath);
    // ts-morph was used to create source file
    await expect(MOCK_PROJECT.createSourceFile).toHaveBeenCalledWith(expectedModelFilePath);

    // same model file as before via create
    expect(pm.getModelFile()).toBe(result);
  });

  test("ProjectManager: create & get qObject file", async () => {
    const pm = await doCreateProjectManager();

    // initially no model file
    expect(pm.getQObjectFile()).toBeUndefined();

    // create model file
    const expectedModelFilePath = path.join(outputDir, "qTester.ts");
    const result = await pm.createQObjectFile();

    // we expect to get the stuff that was produced by project.createSourceFile
    expect(result).toBe(MOCK_SOURCE_FILE);
    // existing file should have been removed first
    await expect(remove).toHaveBeenCalledWith(expectedModelFilePath);
    // ts-morph was used to create source file
    await expect(MOCK_PROJECT.createSourceFile).toHaveBeenCalledWith(expectedModelFilePath);

    // same model file as before via create
    expect(pm.getQObjectFile()).toBe(result);
  });

  test("ProjectManager: create & get main service file", async () => {
    const pm = await doCreateProjectManager();

    // initially no model file
    expect(pm.getMainServiceFile()).toBeUndefined();

    // create model file
    const expectedModelFilePath = path.join(outputDir, "TesterService.ts");
    const result = await pm.createMainServiceFile();

    // we expect to get the stuff that was produced by project.createSourceFile
    expect(result).toBe(MOCK_SOURCE_FILE);
    // existing file should have been removed first
    await expect(remove).toHaveBeenCalledWith(expectedModelFilePath);
    // ts-morph was used to create source file
    await expect(MOCK_PROJECT.createSourceFile).toHaveBeenCalledWith(expectedModelFilePath);

    // same model file as before via create
    expect(pm.getMainServiceFile()).toBe(result);
  });

  test("ProjectManager: getServiceDir", async () => {
    const pm = await doCreateProjectManager();
    expect(pm.getServiceDir()).toBe(path.join(outputDir, "service"));
  });

  test("ProjectManager: create service file", async () => {
    const pm = await doCreateProjectManager();
    expect(pm.getServiceDir()).toBe(path.join(outputDir, "service"));
  });
});
