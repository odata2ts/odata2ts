import { writeFile } from "fs/promises";

import { SourceFile } from "ts-morph";

import { DataModel } from "../data-model/DataModel";
import { ImportContainer } from "../generator/ImportContainer";
import { EmitModes } from "../OptionModel";
import { FileFormatter } from "./formatter/FileFormatter";

export class FileHandler {
  private readonly importContainer: ImportContainer;

  constructor(
    public readonly path: string,
    public readonly fileName: string,
    protected readonly file: SourceFile,
    dataModel: DataModel,
    protected formatter: FileFormatter,
    reservedNames: Array<string> | undefined,
    protected bundleFileNames: { model: string; qObject: string; service: string } | undefined
  ) {
    this.importContainer = new ImportContainer(path, fileName, dataModel, reservedNames, bundleFileNames);
  }

  public getFullFilePath() {
    return this.path ? `${this.path}/${this.fileName}` : this.fileName;
  }

  public getFile() {
    return this.file;
  }

  public getImports() {
    return this.importContainer;
  }

  public async write(emitMode: EmitModes) {
    this.file.addImportDeclarations(this.importContainer.getImportDeclarations());

    switch (emitMode) {
      case EmitModes.js:
      case EmitModes.js_dts:
        await this.file.emit();
        break;
      case EmitModes.dts:
        await this.file.emit({ emitOnlyDtsFiles: true });
        break;
      case EmitModes.ts:
        await this.formatAndWriteFile();
        break;
      default:
        throw new Error(`Emit mode "${emitMode}" is invalid!`);
    }
  }

  private async formatAndWriteFile() {
    const fileName = this.file.getFilePath();
    const content = this.file.getFullText();

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
}
