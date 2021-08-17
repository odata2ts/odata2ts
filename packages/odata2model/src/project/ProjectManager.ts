import * as path from "path";
import { emptyDir, remove, writeFile } from "fs-extra";
import { Project, SourceFile, ts } from "ts-morph";

import { NoopFormatter } from "./../formatter/NoopFormatter";
import { PrettierFormatter } from "./../formatter/PrettierFormatter";
import { BaseFormatter } from "../formatter/BaseFormatter";
import { DataModel } from "../data-model/DataModel";
import { EmitModes, RunOptions } from "../OptionModel";

export class ProjectManager {
  private formatter!: BaseFormatter;
  private project!: Project;

  private files: { [name: string]: SourceFile } = {};
  private serviceFiles: Array<SourceFile> = [];

  constructor(private dataModel: DataModel, private options: RunOptions) {}

  public async init() {
    const { output, prettier, emitMode } = this.options;
    const generateDeclarations = [EmitModes.js_dts, EmitModes.dts].includes(emitMode);

    this.formatter = await this.createFormatter(output, prettier);

    // Create ts-morph project
    this.project = new Project({
      manipulationSettings: this.formatter.getSettings(),
      skipAddingFilesFromTsConfig: true,
      compilerOptions: {
        outDir: output,
        declaration: generateDeclarations,
      },
    });
  }

  private async createFile(name: string) {
    const fileName = path.join(this.options.output, `${name}.ts`);
    await remove(fileName);
    return this.project.createSourceFile(fileName);
  }

  public async createModelFile() {
    this.files.model = await this.createFile(this.dataModel.getFileNames().model);
    return this.getModelFile();
  }

  public getModelFile() {
    return this.files.model;
  }

  public async writeModelFile() {
    return this.formatAndWriteFile(this.getModelFile());
  }

  public async createQObjectFile() {
    this.files.qobject = await this.createFile(this.dataModel.getFileNames().qObject);
    return this.getQObjectFile();
  }

  public getQObjectFile() {
    return this.files.qobject;
  }

  public async writeQObjectFile() {
    return this.formatAndWriteFile(this.getQObjectFile());
  }

  public async createMainServiceFile() {
    this.files.mainService = await this.createFile(this.dataModel.getFileNames().service);
    return this.getMainServiceFile();
  }

  public getMainServiceFile() {
    return this.files.mainService;
  }

  public getServiceDir() {
    return path.join(this.options.output, "service");
  }

  public async createServiceFile(name: string) {
    const file = await this.createFile(`service/${name}`);
    this.serviceFiles.push(file);

    return file;
  }

  public async writeServiceFiles() {
    await emptyDir(this.options.output + "/service");

    return Promise.all([
      this.formatAndWriteFile(this.getMainServiceFile()),
      ...this.serviceFiles.map((sf) => this.formatAndWriteFile(sf)),
    ]);
  }

  public async writeFiles() {
    switch (this.options.emitMode) {
      case EmitModes.ts:
        await this.writeModelFile();
        await this.writeQObjectFile();
        await this.writeServiceFiles();
        break;
      case EmitModes.js:
      case EmitModes.js_dts:
        await this.emitJsFiles();
        break;
      case EmitModes.dts:
        await this.emitJsFiles(true);
        break;
    }
  }

  private async emitJsFiles(declarationOnly?: boolean) {
    console.log(
      `Emitting ${declarationOnly ? "declaration" : "JS"} files (${
        this.options.emitMode === EmitModes.js_dts ? "including" : "without"
      } declaration files)`
    );

    await this.project.emit({ emitOnlyDtsFiles: !!declarationOnly });

    /* for (const diagnostic of this.project.getPreEmitDiagnostics()) {
      console.log(diagnostic.getMessageText());
    } */
  }

  private async formatAndWriteFile(file: SourceFile) {
    const fileName = file.getFilePath();

    switch (this.options.emitMode) {
      case EmitModes.ts:
        console.log(`Writing file: ${fileName}`);
        return this.emitSourceFiles(fileName, file.getFullText());
      case EmitModes.js:
      case EmitModes.js_dts:
        console.log(`Emitting JS files for: ${fileName}`);
        await file.emit();
        break;
      case EmitModes.dts:
        console.log(`Emitting declarations for: ${fileName}`);
        return file.emit({ emitOnlyDtsFiles: true });
    }
  }

  private async emitSourceFiles(fileName: string, content: string) {
    // const formatted = raw;
    const formatted = await this.formatter.format(content).catch(async (error: Error) => {
      console.error("Formatting failed");
      await writeFile("error.log", error);
      process.exit(99);
    });

    return writeFile(fileName, formatted).catch((error: Error) => {
      console.error(`Failed to write file [/${fileName}]`, error);
      process.exit(3);
    });
  }

  private async createFormatter(outputPath: string, isPrettierEnabled: boolean) {
    const formatter = isPrettierEnabled ? new PrettierFormatter(outputPath) : new NoopFormatter(outputPath);
    return await formatter.init();
  }
}
