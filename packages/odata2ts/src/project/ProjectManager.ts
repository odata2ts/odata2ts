import * as path from "path";

import { ensureDir } from "fs-extra";
import { CompilerOptions, Project, SourceFile } from "ts-morph";
import { firstCharLowerCase } from "xml2js/lib/processors";

import { DataModel } from "../data-model/DataModel";
import { EntityType } from "../data-model/DataTypeModel";
import { NamingHelper } from "../data-model/NamingHelper";
import { EmitModes } from "../OptionModel";
import { FileHandler } from "./FileHandler";
import { createFormatter } from "./formatter";
import { FileFormatter } from "./formatter/FileFormatter";
import { loadTsMorphCompilerOptions } from "./TsMorphHelper";

export interface ProjectManagerOptions {
  usePrettier?: boolean;
  tsConfigPath?: string;
  bundledFileGeneration?: boolean;
  /**
   * for testing purposes, turn this on and retrieve all generated files via getCachedFiles
   */
  noOutput?: boolean;
}

export async function createProjectManager(
  outputDir: string,
  emitMode: EmitModes,
  namingHelper: NamingHelper,
  dataModel: DataModel,
  options: ProjectManagerOptions
): Promise<ProjectManager> {
  const { usePrettier = false, tsConfigPath = "tsconfig.json" } = options;
  const formatter = await createFormatter(outputDir, usePrettier);

  const compilerOpts: CompilerOptions = await loadTsMorphCompilerOptions(tsConfigPath, emitMode, outputDir);

  const pm = new ProjectManager(outputDir, emitMode, namingHelper, dataModel, formatter, compilerOpts, {
    usePrettier,
    tsConfigPath,
    ...options,
  });

  await pm.init();

  return pm;
}

export class ProjectManager {
  private project!: Project;

  private mainServiceFile: FileHandler | undefined;
  private bundledModelFile: FileHandler | undefined;
  private bundledQFile: FileHandler | undefined;

  private readonly cachedFiles: Map<string, SourceFile> | undefined;

  constructor(
    protected outputDir: string,
    protected emitMode: EmitModes,
    protected namingHelper: NamingHelper,
    protected dataModel: DataModel,
    protected formatter: FileFormatter,
    compilerOptions: CompilerOptions | undefined,
    protected options: ProjectManagerOptions
  ) {
    // Create ts-morph project
    this.project = new Project({
      manipulationSettings: this.formatter.getSettings(),
      skipAddingFilesFromTsConfig: true,
      compilerOptions,
    });

    if (options.noOutput) {
      this.cachedFiles = new Map();
    }
  }

  public getDataModel() {
    return this.dataModel;
  }

  /**
   * Only filled when noOutput=true
   */
  public getCachedFiles() {
    return this.cachedFiles!;
  }

  private async writeFile(fileWrapper: FileHandler) {
    if (this.options.noOutput) {
      this.cachedFiles!.set(fileWrapper.getFullFilePath(), fileWrapper.getFile());
      return;
    }

    return fileWrapper.write(this.emitMode);
  }

  private createFile(
    name: string,
    reservedNames?: Array<string> | undefined,
    additionalPath: string = ""
  ): FileHandler {
    const fileName = path.join(this.outputDir, additionalPath, `${name}.ts`);

    return new FileHandler(
      additionalPath,
      name,
      this.project.createSourceFile(fileName),
      this.dataModel,
      this.formatter,
      reservedNames,
      this.options.bundledFileGeneration ? this.namingHelper.getFileNames() : undefined
    );
  }

  public async init() {
    if (!this.options.bundledFileGeneration) {
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
    if (this.options.bundledFileGeneration) {
      const reservedWords = this.dataModel.getModelTypes().reduce<Array<string>>((collector, model) => {
        const asEntityType = model as EntityType;
        collector.push(model.modelName);
        if (asEntityType.editableName) {
          collector.push(asEntityType.editableName);
        }
        if (asEntityType.id?.modelName) {
          collector.push(asEntityType.id.modelName);
        }

        return collector;
      }, []);
      this.bundledModelFile = this.createFile(this.namingHelper.getFileNames().model, reservedWords);
    }
  }

  public async finalizeModels() {
    if (this.bundledModelFile) {
      return this.writeFile(this.bundledModelFile);
    }
  }

  public initQObjects() {
    if (this.options.bundledFileGeneration) {
      const reservedWords = this.dataModel.getModelTypes().reduce<Array<string>>((collector, model) => {
        const asEntityType = model as EntityType;
        if (asEntityType.qName) {
          collector.push(asEntityType.qName, firstCharLowerCase(asEntityType.qName));
        }
        if (asEntityType.id?.qName) {
          collector.push(asEntityType.id.qName);
        }

        return collector;
      }, []);

      this.bundledQFile = this.createFile(this.namingHelper.getFileNames().qObject, reservedWords);
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
    if (this.options.bundledFileGeneration && this.mainServiceFile) {
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
    if (this.options.bundledFileGeneration) {
      return this.mainServiceFile!;
    }

    return this.createFile(name, reservedNames, folderPath);
  }

  public async finalizeFile(file: FileHandler) {
    if (!this.options.bundledFileGeneration) {
      return this.writeFile(file);
    }
  }
}
