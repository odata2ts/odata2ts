import { writeFile } from "fs/promises";
import { SourceFile } from "ts-morph";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { EmitModes } from "../../src";
import { DataModel } from "../../src/data-model/DataModel";
import { ODataVersion } from "../../src/data-model/DataTypeModel";
import { ImportContainer } from "../../src/generator/ImportContainer";
import { FileHandler } from "../../src/project/FileHandler";
import { FileFormatter } from "../../src/project/formatter/FileFormatter";

// global mock for file operations
vi.mock("fs/promises");

describe("FileHandler Test", () => {
  const MAIN_FILE_NAMES = { model: "TestModel", qObject: "QTest", service: "TestService" };
  const DEFAULT_PATH = "build/unit/fileHandler";
  const DEFAULT_FILENAME = "TestModel";
  const DEFAULT_DATA_MODEL = new DataModel([["MyNamespace"]], ODataVersion.V4);

  const MOCKED_FILE_PATH = "ABC";
  const MOCKED_FILE_CONTENT = "--- Content ---";
  const MOCKED_FORMATTED_CONTENT = "--- FORMATTED ---";

  const mockFile: SourceFile = {
    addImportDeclarations: vi.fn(),
    addStatements: vi.fn(),
    emit: vi.fn(),
    // @ts-ignore
    getFilePath: () => MOCKED_FILE_PATH,
    getFullText: () => MOCKED_FILE_CONTENT,
  };
  const formatter: FileFormatter = {
    getSettings: () => ({}),
    format: vi.fn(async () => MOCKED_FORMATTED_CONTENT),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createFileHandler(options: { path?: string; fileName?: string; reservedNames?: Array<string> } = {}) {
    const { path = DEFAULT_PATH, fileName = DEFAULT_FILENAME, reservedNames = [] } = options;

    const imports = new ImportContainer(path, fileName, DEFAULT_DATA_MODEL, MAIN_FILE_NAMES, true, reservedNames);

    return new FileHandler(path, fileName, mockFile, imports, formatter, true);
  }

  test("Smoke Test", () => {
    const pm = createFileHandler();

    expect(pm.path).toBe(DEFAULT_PATH);
    expect(pm.fileName).toBe(DEFAULT_FILENAME);
    expect(pm.getFullFilePath()).toBe(`${DEFAULT_PATH}/${DEFAULT_FILENAME}`);
    expect(pm.getFile()).toBe(mockFile);
    expect(pm.getImports()).toBeDefined();
    expect(pm.getImports().getImportDeclarations()).toStrictEqual([]);
  });

  test("alternative path and name", () => {
    const path = "any/path";
    const fileName = "tttt";
    const pm = createFileHandler({ path, fileName });

    expect(pm.path).toBe(path);
    expect(pm.fileName).toBe(fileName);
    expect(pm.getFullFilePath()).toBe(`${path}/${fileName}`);
  });

  test("without path", () => {
    const pm = createFileHandler({ path: "" });

    expect(pm.path).toBe("");
    expect(pm.getFullFilePath()).toBe(DEFAULT_FILENAME);
  });

  test("write TS file", async () => {
    const pm = createFileHandler();

    await pm.write(EmitModes.ts);

    expect(mockFile.emit).not.toHaveBeenCalled();
    expect(formatter.format).toHaveBeenCalledWith(MOCKED_FILE_CONTENT);
    expect(writeFile).toHaveBeenCalledTimes(1);
    expect(writeFile).toHaveBeenCalledWith(MOCKED_FILE_PATH, MOCKED_FORMATTED_CONTENT);
  });

  test("write JS file", async () => {
    const pm = createFileHandler();

    await pm.write(EmitModes.js);

    expect(mockFile.emit).toHaveBeenCalledWith();
    expect(formatter.format).not.toHaveBeenCalled();
    expect(writeFile).not.toHaveBeenCalled();
  });

  test("write JS / DTS file", async () => {
    const pm = createFileHandler();

    await pm.write(EmitModes.js_dts);

    expect(mockFile.emit).toHaveBeenCalledWith();
    expect(formatter.format).not.toHaveBeenCalled();
    expect(writeFile).not.toHaveBeenCalled();
  });

  test("write DTS file", async () => {
    const pm = createFileHandler();

    await pm.write(EmitModes.dts);

    expect(mockFile.emit).toHaveBeenCalledWith({ emitOnlyDtsFiles: true });
    expect(formatter.format).not.toHaveBeenCalled();
    expect(writeFile).not.toHaveBeenCalled();
  });

  test("write no output", async () => {
    const pm = createFileHandler();

    await pm.write(EmitModes.ts, true);

    // nothing was written or formatted
    expect(mockFile.emit).not.toHaveBeenCalled();
    expect(formatter.format).not.toHaveBeenCalled();
    expect(writeFile).not.toHaveBeenCalled();

    // imports should have been added, but we don't test that here
    // => other tests rely on this fact
  });
});
