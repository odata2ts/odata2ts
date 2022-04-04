import * as path from "path";
import { emptyDir, remove, writeFile } from "fs-extra";
import { Project, SourceFile } from "ts-morph";

import { ProjectFiles } from "../data-model/DataModel";
import { EmitModes } from "../OptionModel";
import { createFormatter } from "./formatter";
import { FileFormatter } from "./formatter/FileFormatter";

export async function createProjectManager(
  projectFiles: ProjectFiles,
  outputDir: string,
  emitMode: EmitModes,
  usePrettier: boolean
): Promise<ProjectManager> {
  const formatter = await createFormatter(outputDir, usePrettier);
  return new ProjectManager(projectFiles, outputDir, emitMode, formatter);
}

const STATIC_SERVICE_DIR = "service";

export class ProjectManager {
  private project!: Project;

  private files: { [name: string]: SourceFile } = {};
  private serviceFiles: Array<SourceFile> = [];

  constructor(
    private projectFiles: ProjectFiles,
    private outputDir: string,
    private emitMode: EmitModes,
    private formatter: FileFormatter
  ) {
    const generateDeclarations = [EmitModes.js_dts, EmitModes.dts].includes(emitMode);

    // Create ts-morph project
    this.project = new Project({
      manipulationSettings: this.formatter.getSettings(),
      skipAddingFilesFromTsConfig: true,
      compilerOptions: {
        outDir: outputDir,
        declaration: generateDeclarations,
      },
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

  public getServiceDir() {
    return path.join(this.outputDir, STATIC_SERVICE_DIR);
  }

  public async cleanServiceDir() {
    return emptyDir(this.getServiceDir());
  }

  public async createServiceFile(name: string) {
    const file = await this.createFile(path.join(STATIC_SERVICE_DIR, name));
    this.serviceFiles.push(file);

    return file;
  }

  public getServiceFiles() {
    return this.serviceFiles;
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
    const files = [this.getModelFile(), this.getQObjectFile(), this.getMainServiceFile(), ...this.getServiceFiles()];
    console.log(
      "Emitting TS files: ",
      files.filter((f) => !!f).map((f) => f.getFilePath())
    );
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
      await writeFile("error.log", formattingError);
      process.exit(99);
    }
  };
}
