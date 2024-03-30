import { writeFile } from "fs/promises";
import * as path from "path";

import { ensureDir } from "fs-extra";
import { CompilerOptions, NewLineKind, Project, SourceFile } from "ts-morph";
import load from "tsconfig-loader";

import { DataModel } from "../data-model/DataModel";
import { NamingHelper } from "../data-model/NamingHelper";
import { EmitModes } from "../OptionModel";
import { FileWrapper } from "./FileWrapper";
import { createFormatter } from "./formatter";
import { FileFormatter } from "./formatter/FileFormatter";
import { getModuleKind, getModuleResolutionKind, getTarget } from "./TsMorphHelper";

export interface ProjectManagerOptions {
  usePrettier?: boolean;
  tsConfigPath?: string;
  bundledFileGeneration?: boolean;
}

export async function createProjectManager(
  outputDir: string,
  emitMode: EmitModes,
  namingHelper: NamingHelper,
  dataModel: DataModel,
  options: ProjectManagerOptions
): Promise<ProjectManager> {
  const { usePrettier = false, tsConfigPath = "tsconfig.json", bundledFileGeneration = false } = options;
  const generateDeclarations = EmitModes.js_dts === emitMode || EmitModes.dts === emitMode;
  const conf = load({ filename: tsConfigPath });
  const formatter = await createFormatter(outputDir, usePrettier);

  const {
    // ignored props
    noEmit, // we always want to emit
    importsNotUsedAsValues, // type is missing
    jsx,
    plugins,
    // mapped props
    moduleResolution,
    lib,
    module,
    newLine,
    target,
    rootDir,
    rootDirs,
    ...passThrough
  } = conf?.tsConfig.compilerOptions || {};

  const compilerOpts: CompilerOptions = {
    ...passThrough,
    outDir: outputDir,
    declaration: generateDeclarations,
    moduleResolution: getModuleResolutionKind(moduleResolution),
    module: getModuleKind(module),
    target: getTarget(target),
    lib: lib as string[],
    newLine:
      newLine?.toLowerCase() === "crlf"
        ? NewLineKind.CarriageReturnLineFeed
        : newLine?.toLowerCase() === "lf"
        ? NewLineKind.LineFeed
        : undefined,
  };

  const pm = new ProjectManager(
    outputDir,
    emitMode,
    namingHelper,
    dataModel,
    formatter,
    compilerOpts,
    bundledFileGeneration
  );

  await pm.init();

  return pm;
}

export class ProjectManager {
  private project!: Project;

  private mainServiceFile: FileWrapper | undefined;
  private bundledModelFile: FileWrapper | undefined;
  private bundledQFile: FileWrapper | undefined;

  constructor(
    private outputDir: string,
    private emitMode: EmitModes,
    private namingHelper: NamingHelper,
    private dataModel: DataModel,
    private formatter: FileFormatter,
    compilerOptions: CompilerOptions | undefined,
    public readonly bundledFileGeneration: boolean
  ) {
    // Create ts-morph project
    this.project = new Project({
      manipulationSettings: this.formatter.getSettings(),
      skipAddingFilesFromTsConfig: true,
      compilerOptions,
    });
  }

  private createFile(
    name: string,
    reservedNames?: Array<string> | undefined,
    additionalPath: string = ""
  ): FileWrapper {
    const fileName = path.join(this.outputDir, additionalPath, `${name}.ts`);

    return new FileWrapper(
      additionalPath,
      name,
      this.project.createSourceFile(fileName),
      this.dataModel,
      reservedNames,
      this.bundledFileGeneration ? this.namingHelper.getFileNames() : undefined
    );
  }

  private async writeFile(fileWrapper: FileWrapper) {
    const file = fileWrapper.getFile();
    const imports = fileWrapper.getImports();

    file.addImportDeclarations(imports.getImportDeclarations());

    await ensureDir(path.join(this.outputDir, fileWrapper.path));

    switch (this.emitMode) {
      case EmitModes.js:
      case EmitModes.js_dts:
        await file.emit();
        break;
      case EmitModes.dts:
        await file.emit({ emitOnlyDtsFiles: true });
        break;
      case EmitModes.ts:
        await this.formatAndWriteFile(file);
        break;
      default:
        throw new Error(`Emit mode "${this.emitMode}" is invalid!`);
    }
  }

  private async formatAndWriteFile(file: SourceFile) {
    const fileName = file.getFilePath();
    const content = file.getFullText();

    try {
      const formatted = await this.formatter.format(content);

      try {
        return writeFile(fileName, formatted);
      } catch (writeError) {
        console.error(`Failed to write file [/${fileName}]`, writeError);
        process.exit(3);
      }
    } catch (formattingError) {
      console.error("Formatting failed", formattingError);
      await writeFile("error.log", formattingError?.toString() || "no error message!");
      process.exit(99);
    }
  }

  public async init() {
    if (!this.bundledFileGeneration) {
      // ensure folder for each model
      await Promise.all(
        this.dataModel.getModelTypes().map((mt) => {
          ensureDir(path.join(this.outputDir, mt.folderPath));
        })
      );
    }

    const typePart = this.emitMode.toUpperCase().replace("_", " & ");
    console.log(`Prepared to emit ${typePart} files.`);
  }

  public initModels() {
    if (this.bundledFileGeneration) {
      this.bundledModelFile = this.createFile(this.namingHelper.getFileNames().model);
    }
  }

  public async finalizeModels() {
    if (this.bundledModelFile) {
      return this.writeFile(this.bundledModelFile);
    }
  }

  public initQObjects() {
    if (this.bundledFileGeneration) {
      this.bundledQFile = this.createFile(this.namingHelper.getFileNames().qObject);
    }
  }

  public async finalizeQObjects() {
    if (this.bundledQFile) {
      return this.writeFile(this.bundledQFile);
    }
  }

  public initServices(reservedNames?: Array<string>) {
    this.mainServiceFile = this.createFile(this.namingHelper.getFileNames().service, reservedNames);
  }

  public async finalizeServices() {
    if (this.bundledFileGeneration && this.mainServiceFile) {
      return this.writeFile(this.mainServiceFile);
    }
  }

  public getMainServiceFile() {
    return this.mainServiceFile!;
  }

  public createOrGetModelFile(folderPath: string, name: string, reservedNames?: Array<string> | undefined) {
    if (this.bundledModelFile) {
      return this.bundledModelFile;
    }

    return this.createFile(name, reservedNames, folderPath);
  }
  public createOrGetQObjectFile(folderPath: string, name: string, reservedNames?: Array<string> | undefined) {
    if (this.bundledQFile) {
      return this.bundledQFile;
    }

    return this.createFile(name, reservedNames, folderPath);
  }
  public createOrGetServiceFile(folderPath: string, name: string, reservedNames?: Array<string> | undefined) {
    if (this.bundledFileGeneration) {
      return this.mainServiceFile!;
    }

    return this.createFile(name, reservedNames, folderPath);
  }

  public async finalizeFile(file: FileWrapper) {
    if (!this.bundledFileGeneration) {
      return this.writeFile(file);
    }
  }
}
