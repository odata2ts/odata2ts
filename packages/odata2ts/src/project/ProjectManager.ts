import * as path from "path";
import { camelCase } from "change-case";
import { mkdirp } from "mkdirp";
import { CompilerOptions, ExportDeclarationStructure, OptionalKind, Project, SourceFile } from "ts-morph";
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

/**
 * Name of the generated barrel files. Not configurable: "index" is what every module resolution
 * understands as the entry point of a folder, so a different name would defeat the purpose.
 */
const INDEX_FILE_NAME = "index";

function exportAll(moduleSpecifier: string): OptionalKind<ExportDeclarationStructure> {
  return { moduleSpecifier };
}

export interface ProjectManagerOptions {
  usePrettier?: boolean;
  tsConfigPath?: string;
  bundledFileGeneration?: boolean;
  /**
   * for testing purposes, turn this on and retrieve all generated files via getCachedFiles
   */
  noOutput?: boolean;
  allowTypeChecking?: boolean;
  odataVersionV4?: "4.0" | "4.01";
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
  private navHopsFile: FileHandler | undefined;

  private readonly cachedFiles: Map<string, SourceFile> | undefined;

  /**
   * Every file that was actually written, by the folder it lives in. This is the basis for the barrel
   * files, so that they list what has really been emitted - which depends on the generation mode as well
   * as on whether a main file ended up with any content at all.
   */
  private readonly writtenFiles = new Map<string, Array<string>>();

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

  private async writeFile(fileHandler: FileHandler, trackForIndex = true) {
    if (trackForIndex) {
      const folderFiles = this.writtenFiles.get(fileHandler.path) || [];
      folderFiles.push(fileHandler.fileName);
      this.writtenFiles.set(fileHandler.path, folderFiles);
    }

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
      this.options.odataVersionV4,
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

  /**
   * The one file the whole client's `NavHopsTable` lives in - always its own file, never folded into the
   * main service even under `bundledFileGeneration`, since it is one shared table the main service merely
   * imports, not a service class of its own.
   */
  public createNavHopsFile() {
    if (!this.navHopsFile) {
      this.navHopsFile = this.createFile("CacheKeyNavHops");
    }
    return this.navHopsFile;
  }

  public async finalizeNavHopsFile() {
    if (this.navHopsFile) {
      await this.writeFile(this.navHopsFile);
    }
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
    if (this.options.bundledFileGeneration) {
      return this.mainModelFile!;
    }

    // model files always allow for type checking
    return this.createFile(name, reservedNames, folderPath, true);
  }
  public createOrGetQObjectFile(folderPath: string, name: string, reservedNames?: Array<string> | undefined) {
    if (this.options.bundledFileGeneration) {
      return this.mainQFile!;
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

  /**
   * Generates the barrel files, re-exporting everything that has been generated: one index file per
   * namespace and one at the root of the output directory.
   *
   * The files of a folder are always re-exported by the index of its *parent* - the namespace level
   * for the model folders, the output root for everything else. Model folders therefore get no index of
   * their own, which means no generated artefact can ever collide with one: a model literally named "index"
   * is simply re-exported like any other.
   *
   * The root barrel re-exports the files on root level flatly, but each namespace under its own name
   * ({@code export * as libraryCatalog from "./library-catalog/index.js"}). OData allows the same type name
   * in two namespaces, and unbundled generation keeps those names as they are - a flat re-export would make
   * both of them unreachable. With only a single namespace that cannot happen, so there it stays flat.
   *
   * Bundled file generation only ever emits files on root level, so there the root barrel is all there is.
   *
   * Must run after all other files have been written, since the barrels list what was actually emitted.
   */
  public async generateIndexFiles() {
    const folderPaths = [...this.writtenFiles.keys()].filter((folderPath) => folderPath !== "").sort();

    // collect the files of each folder under the folder which is to re-export them
    const specifiersByParent = new Map<string, Array<string>>();
    folderPaths.forEach((folderPath) => {
      const lastSlash = folderPath.lastIndexOf("/");
      const parent = lastSlash < 0 ? "" : folderPath.substring(0, lastSlash);
      const folderName = lastSlash < 0 ? folderPath : folderPath.substring(lastSlash + 1);
      const specifiers = this.getWrittenFileNames(folderPath).map((fileName) => `./${folderName}/${fileName}.js`);

      specifiersByParent.set(parent, [...(specifiersByParent.get(parent) || []), ...specifiers]);
    });

    // one barrel per namespace
    const barreledNamespaces: Array<string> = [];
    for (const [namespace, specifiers] of specifiersByParent) {
      if (namespace && (await this.writeIndexFile(namespace, specifiers.map(exportAll)))) {
        barreledNamespaces.push(namespace);
      }
    }

    await this.writeIndexFile("", [
      ...this.getFileSpecifiers("").map(exportAll),
      // folders without a namespace level of their own are re-exported by the root itself
      ...(specifiersByParent.get("") || []).map(exportAll),
      ...barreledNamespaces.map((namespace) => {
        const moduleSpecifier = `./${namespace}/${INDEX_FILE_NAME}.js`;
        return barreledNamespaces.length === 1
          ? exportAll(moduleSpecifier)
          : { moduleSpecifier, namespaceExport: camelCase(namespace) };
      }),
    ]);
  }

  private getWrittenFileNames(folderPath: string) {
    return (this.writtenFiles.get(folderPath) || []).slice().sort();
  }

  private getFileSpecifiers(folderPath: string) {
    return this.getWrittenFileNames(folderPath).map((fileName) => `./${fileName}.js`);
  }

  /**
   * Only ever relevant for the root barrel: no generated file lives on a namespace level, and model folders
   * get no barrel at all. The root file names are configurable, though, so one of them may occupy the name.
   *
   * @return whether the barrel was written
   */
  private async writeIndexFile(
    folderPath: string,
    exportDeclarations: Array<OptionalKind<ExportDeclarationStructure>>,
  ): Promise<boolean> {
    if (this.writtenFiles.get(folderPath)?.includes(INDEX_FILE_NAME)) {
      console.warn(
        `Skipping index file for "${folderPath || "."}": a generated artefact is already named "${INDEX_FILE_NAME}"!`,
      );
      return false;
    }

    // barrels are trivially correct, so they are type checked regardless of the debug option: an ambiguous
    // re-export is a real problem and should surface instead of being hidden behind @ts-nocheck
    const fileHandler = this.createFile(INDEX_FILE_NAME, undefined, folderPath, true);
    fileHandler.getFile().addExportDeclarations(exportDeclarations);

    await this.writeFile(fileHandler, false);
    return true;
  }
}
