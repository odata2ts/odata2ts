import { writeFile } from "fs/promises";

import { SourceFile } from "ts-morph";

import { ImportContainer } from "../generator/ImportContainer.js";
import { EmitModes } from "../OptionModel.js";
import { FileFormatter } from "./formatter/FileFormatter.js";

export class FileHandler {
  constructor(
    public readonly path: string,
    public readonly fileName: string,
    protected readonly file: SourceFile,
    protected readonly importContainer: ImportContainer,
    protected formatter: FileFormatter | undefined,
    public readonly allowTypeChecking: boolean
  ) {}

  public getFullFilePath() {
    return this.path ? `${this.path}/${this.fileName}` : this.fileName;
  }

  public getFile() {
    return this.file;
  }

  public getImports() {
    return this.importContainer;
  }

  public async write(emitMode: EmitModes, noOutput = false) {
    this.file.addImportDeclarations(this.importContainer.getImportDeclarations());
    // add ts-nocheck to beginning of each file
    if (!this.allowTypeChecking) {
      const stmts = this.file.addStatements((writer) => {
        writer.writeLine("// @ts-nocheck");
      });
      stmts[0].setOrder(0);
    }

    if (noOutput) {
      return;
    }

    switch (emitMode) {
      case EmitModes.js:
      case EmitModes.js_dts:
        return this.file.emit();
      case EmitModes.dts:
        return this.file.emit({ emitOnlyDtsFiles: true });
      case EmitModes.ts:
        return this.formatAndWriteFile();
      default:
        throw new Error(`Emit mode "${emitMode}" is invalid!`);
    }
  }

  private async formatAndWriteFile() {
    const fileName = this.file.getFilePath();
    const content = this.file.getFullText();

    try {
      const formatted = this.formatter ? await this.formatter.format(content) : content;

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
