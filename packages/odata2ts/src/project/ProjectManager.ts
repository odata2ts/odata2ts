import { writeFile } from "fs/promises";
import * as path from "path";

import { remove } from "fs-extra";
import {
  CompilerOptions,
  ModuleKind,
  ModuleResolutionKind,
  NewLineKind,
  Project,
  ScriptTarget,
  SourceFile,
} from "ts-morph";
import load from "tsconfig-loader";
import ts from "typescript";

import { ProjectFiles } from "../data-model/DataModel";
import { EmitModes } from "../OptionModel";
import { createFormatter } from "./formatter";
import { FileFormatter } from "./formatter/FileFormatter";

export async function createProjectManager(
  projectFiles: ProjectFiles,
  outputDir: string,
  emitMode: EmitModes,
  usePrettier: boolean,
  tsConfigPath: string = "tsconfig.json"
): Promise<ProjectManager> {
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

  return new ProjectManager(projectFiles, outputDir, emitMode, formatter, compilerOpts);
}

function getModuleResolutionKind(
  moduleResolution: string | undefined | Record<string, any>
): ModuleResolutionKind | undefined {
  const modRes =
    typeof moduleResolution === "string"
      ? moduleResolution.toLowerCase() === "node"
        ? "nodejs"
        : moduleResolution.toLowerCase()
      : undefined;
  const matchedKey = Object.keys(ts.ModuleResolutionKind).find(
    (mk): mk is keyof typeof ModuleResolutionKind => mk.toLowerCase() === modRes
  );
  return matchedKey ? (ts.ModuleResolutionKind[matchedKey] as ModuleResolutionKind) : undefined;
}

function getModuleKind(module: string | undefined | Record<string, any>): ModuleKind | undefined {
  const mod = typeof module === "string" ? module.toLowerCase() : undefined;
  const matchedKey = Object.keys(ts.ModuleKind).find((mk): mk is keyof typeof ModuleKind => mk.toLowerCase() === mod);
  return matchedKey ? (ts.ModuleKind[matchedKey] as ModuleKind) : undefined;
}

function getTarget(target: string | undefined | Record<string, any>): ScriptTarget | undefined {
  const t = typeof target === "string" ? target.toLowerCase() : undefined;
  const matchedKey = Object.keys(ts.ScriptTarget).find((st): st is keyof typeof ScriptTarget => st.toLowerCase() === t);
  return matchedKey ? (ts.ScriptTarget[matchedKey] as ScriptTarget) : undefined;
}

export class ProjectManager {
  private project!: Project;

  private files: { [name: string]: SourceFile } = {};

  constructor(
    private projectFiles: ProjectFiles,
    private outputDir: string,
    private emitMode: EmitModes,
    private formatter: FileFormatter,
    compilerOptions: CompilerOptions | undefined
  ) {
    // Create ts-morph project
    this.project = new Project({
      manipulationSettings: this.formatter.getSettings(),
      skipAddingFilesFromTsConfig: true,
      compilerOptions,
    });
  }

  private async createFile(name: string) {
    const fileName = path.join(this.outputDir, `${name}.ts`);
    await remove(fileName);
    return this.project.createSourceFile(fileName);
  }

  public async createModelFile() {
    this.files.model = await this.createFile(this.projectFiles.model);
    return this.getModelFile();
  }

  public getModelFile() {
    return this.files.model;
  }

  public async createQObjectFile() {
    this.files.qobject = await this.createFile(this.projectFiles.qObject);
    return this.getQObjectFile();
  }

  public getQObjectFile() {
    return this.files.qobject;
  }

  public async createMainServiceFile() {
    this.files.mainService = await this.createFile(this.projectFiles.service);
    return this.getMainServiceFile();
  }

  public getMainServiceFile() {
    return this.files.mainService;
  }

  public async writeFiles() {
    switch (this.emitMode) {
      case EmitModes.js:
      case EmitModes.js_dts:
        await this.emitJsFiles();
        break;
      case EmitModes.dts:
        await this.emitJsFiles(true);
        break;
      case EmitModes.ts:
        await this.emitTsFiles();
        break;
      default:
        throw new Error(`Emit mode "${this.emitMode}" is invalid!`);
    }
  }

  private async emitJsFiles(declarationOnly?: boolean) {
    console.log(
      declarationOnly
        ? "Emitting declaration files"
        : `Emitting JS files (${this.emitMode === EmitModes.js_dts ? "including" : "without"} declaration files)`
    );

    await this.project.emit({ emitOnlyDtsFiles: !!declarationOnly });

    /* for (const diagnostic of this.project.getPreEmitDiagnostics()) {
      console.log(diagnostic.getMessageText());
    } */
  }

  private async emitTsFiles() {
    const files = [this.getModelFile(), this.getQObjectFile(), this.getMainServiceFile()];
    console.log(`Emitting ${files.length} TS files`);
    return Promise.all([...files.filter((file) => !!file).map(this.formatAndWriteFile)]);
  }

  private formatAndWriteFile = async (file: SourceFile) => {
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
      console.error("Formatting failed");
      await writeFile("error.log", formattingError?.toString() || "no error message!");
      process.exit(99);
    }
  };
}
