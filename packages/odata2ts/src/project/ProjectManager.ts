import * as path from "path";
import { mkdirp } from "mkdirp";
import { CompilerOptions, Project, SourceFile } from "ts-morph";
import { firstCharLowerCase } from "xml2js/lib/processors.js";
import { DataModel } from "../data-model/DataModel.js";
import { EntityType } from "../data-model/DataTypeModel.js";
import { NamingHelper } from "../data-model/NamingHelper.js";
import { ImportContainer } from "../generator/ImportContainer.js";
import { EmitModes } from "../OptionModel.js";
import { FileHandler } from "./FileHandler.js";
import { FileFormatter } from "./formatter/FileFormatter.js";
import { createFormatter } from "./formatter/index.js";
import { loadTsMorphCompilerOptions } from "./TsMorphHelper.js";

export interface ProjectManagerOptions {
  usePrettier?: boolean;
  tsConfigPath?: string;
  bundledFileGeneration?: boolean;
  /**
   * for testing purposes, turn this on and retrieve all generated files via getCachedFiles
   */
  noOutput?: boolean;
  allowTypeChecking?: boolean;
}

export async function createProjectManager(
  outputDir: string,
  emitMode: EmitModes,
  namingHelper: NamingHelper,
  dataModel: DataModel,
  options: ProjectManagerOptions,
): Promise<ProjectManager> {
  const { usePrettier = false, tsConfigPath = "tsconfig.json" } = options;
  const formatter = usePrettier ? await createFormatter(outputDir, usePrettier) : undefined;

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
  private mainModelFile: FileHandler | undefined;
  private mainQFile: FileHandler | undefined;

  private readonly cachedFiles: Map<string, SourceFile> | undefined;

  constructor(
    protected outputDir: string,
    protected emitMode: EmitModes,
    protected namingHelper: NamingHelper,
    protected dataModel: DataModel,
    protected formatter: FileFormatter | undefined,
    compilerOptions: CompilerOptions | undefined,
    protected options: ProjectManagerOptions,
  ) {
    // Create ts-morph project
    this.project = new Project({
      // manipulationSettings: this.formatter.getSettings(),
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

  private async writeFile(fileHandler: FileHandler) {
    if (this.options.noOutput) {
      await fileHandler.write(this.emitMode, true);
      this.cachedFiles!.set(fileHandler.getFullFilePath(), fileHandler.getFile());

      return;
    }

    return fileHandler.write(this.emitMode);
  }

  private createFile(
    name: string,
    reservedNames?: Array<string> | undefined,
    additionalPath: string = "",
    forceTypeChecking = false,
  ): FileHandler {
    const fileName = path.join(this.outputDir, additionalPath, `${name}.ts`);
    const imports = new ImportContainer(
      additionalPath,
      name,
      this.dataModel,
      this.namingHelper.getFileNames(),
      !!this.options.bundledFileGeneration,
      reservedNames,
    );

    return new FileHandler(
      additionalPath,
      name,
      this.project.createSourceFile(fileName),
      imports,
      this.formatter,
      forceTypeChecking || !!this.options.allowTypeChecking,
    );
  }

  public async init() {
    if (!this.options.bundledFileGeneration) {
      // ensure folder for each model: we do this at this point for performance reasons
      await Promise.all(this.dataModel.getModelTypes().map((mt) => mkdirp(path.join(this.outputDir, mt.folderPath))));
    }

    const typePart = this.emitMode.toUpperCase().replace("_", " & ");
    console.log(`Prepared to emit ${typePart} files.`);
  }

  public initModels() {
    if (this.options.bundledFileGeneration) {
      // collect reserved names, that is names of classes we're going to create => imports must take them into account
      const reservedWords = this.dataModel.getModelTypes().reduce<Array<string>>((collector, model) => {
        const asEntityType = model as EntityType;
        collector.push(model.modelName);
        if (asEntityType.editableName) {
          collector.push(asEntityType.editableName);
        }
        if (asEntityType.id?.modelName) {
          collector.push(asEntityType.id.modelName);
        }
        this.dataModel.getAllEntityOperations(model.fqName).forEach((op) => {
          if (op.parameters.length) {
            collector.push(op.paramsModelName);
          }
        });

        return collector;
      }, []);
      this.dataModel.getUnboundOperationTypes().forEach((op) => {
        if (op.parameters.length) {
          reservedWords.push(op.paramsModelName);
        }
      });

      this.mainModelFile = this.createFile(this.namingHelper.getFileNames().model, reservedWords);
    }
  }

  public async finalizeModels() {
    if (
      this.mainModelFile &&
      (this.options.bundledFileGeneration || this.mainModelFile.getFile().getFullText().length)
    ) {
      await this.writeFile(this.mainModelFile);
    }
  }

  public initQObjects() {
    if (this.options.bundledFileGeneration) {
      // collect reserved names, that is names of classes we're going to create => imports must take them into account
      const reservedWords = this.dataModel.getModelTypes().reduce<Array<string>>((collector, model) => {
        const asEntityType = model as EntityType;
        if (asEntityType.qName) {
          collector.push(asEntityType.qName, firstCharLowerCase(asEntityType.qName));
        }
        if (asEntityType.id?.qName) {
          collector.push(asEntityType.id.qName);
        }
        this.dataModel.getAllEntityOperations(model.fqName).forEach((op) => {
          collector.push(op.qName);
        });

        return collector;
      }, []);
      this.dataModel.getUnboundOperationTypes().forEach((op) => {
        reservedWords.push(op.qName);
      });

      this.mainQFile = this.createFile(this.namingHelper.getFileNames().qObject, reservedWords);
    }
  }

  public async finalizeQObjects() {
    if (this.mainQFile && (this.options.bundledFileGeneration || this.mainQFile.getFile().getFullText().length)) {
      await this.writeFile(this.mainQFile);
    }
  }

  public initServices() {
    const mainServiceName = this.namingHelper.getMainServiceName();
    const reservedNames = [mainServiceName];

    if (this.options.bundledFileGeneration) {
      [...this.dataModel.getEntityTypes(), ...this.dataModel.getComplexTypes()].reduce((collector, model) => {
        collector.push(model.serviceName, model.serviceCollectionName);
        return collector;
      }, reservedNames);
    }

    this.mainServiceFile = this.createFile(mainServiceName, reservedNames);
  }

  public async finalizeServices() {
    if (this.mainServiceFile) {
      await this.writeFile(this.mainServiceFile);
    }
  }

  public getMainServiceFile() {
    return this.mainServiceFile!;
  }

  public createOrGetMainModelFile(reservedNames?: Array<string>) {
    if (!this.mainModelFile) {
      this.mainModelFile = this.createFile(this.namingHelper.getFileNames().model, reservedNames, "", true);
    }
    return this.mainModelFile;
  }

  public createOrGetMainQObjectFile(reservedNames?: Array<string>) {
    if (!this.mainQFile) {
      this.mainQFile = this.createFile(this.namingHelper.getFileNames().qObject, reservedNames);
    }
    return this.mainQFile;
  }

  public createOrGetModelFile(folderPath: string, name: string, reservedNames?: Array<string> | undefined) {
    if (this.mainModelFile) {
      return this.mainModelFile;
    }

    // model files always allow for type checking
    return this.createFile(name, reservedNames, folderPath, true);
  }
  public createOrGetQObjectFile(folderPath: string, name: string, reservedNames?: Array<string> | undefined) {
    if (this.mainQFile) {
      return this.mainQFile;
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
    // write individual files in unbundled mode & if this is not one of the main files on root level
    if (
      !this.options.bundledFileGeneration &&
      file.path !== "" &&
      !Object.values(this.namingHelper.getFileNames()).includes(file.fileName)
    ) {
      await this.writeFile(file);
    }
  }
}
