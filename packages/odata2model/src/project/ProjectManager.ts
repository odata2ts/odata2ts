import * as path from "path";
import { emptyDir, remove, writeFile } from "fs-extra";
import { Project, SourceFile } from "ts-morph";

import { NoopFormatter } from "./../formatter/NoopFormatter";
import { PrettierFormatter } from "./../formatter/PrettierFormatter";
import { BaseFormatter } from "../formatter/BaseFormatter";
import { DataModel } from "../data-model/DataModel";

export class ProjectManager {
  private formatter!: BaseFormatter;
  private project!: Project;

  private files: { [name: string]: SourceFile } = {};
  private serviceFiles: Array<SourceFile> = [];

  constructor(private dataModel: DataModel, private outputPath: string, private prettierEnabled: boolean) {}

  public async init() {
    this.formatter = await this.createFormatter(this.outputPath, this.prettierEnabled);

    // Create ts-morph project
    this.project = new Project({
      manipulationSettings: this.formatter.getSettings(),
      skipAddingFilesFromTsConfig: true,
    });
  }

  private async createFile(name: string) {
    const fileName = this.getTsFilePath(name);
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
    return path.join(this.outputPath, "service");
  }

  public async createServiceFile(name: string) {
    const file = await this.createFile(`service/${name}`);
    this.serviceFiles.push(file);

    return file;
  }

  public async writeServiceFiles() {
    await emptyDir(this.outputPath + "/service");

    return Promise.all([
      this.formatAndWriteFile(this.getMainServiceFile()),
      ...this.serviceFiles.map((sf) => this.formatAndWriteFile(sf)),
    ]);
  }

  private getTsFilePath(name: string): string {
    return path.join(this.outputPath, `${name}.ts`);
  }

  private async formatAndWriteFile(file: SourceFile) {
    const fileName = file.getFilePath();
    const raw = file.getFullText();

    // const formatted = raw;
    const formatted = await this.formatter.format(raw).catch(async (error: Error) => {
      console.error("Formatting failed");
      await writeFile("error.log", error);
      process.exit(99);
    });

    console.log(`Writing file: ${fileName}`);
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
