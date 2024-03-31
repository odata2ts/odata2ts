import { SourceFile } from "ts-morph";

import { DataModel } from "../data-model/DataModel";
import { ImportContainer } from "../generator/ImportContainer";

export class FileWrapper {
  private readonly importContainer: ImportContainer;

  constructor(
    protected readonly _path: string,
    public readonly fileName: string,
    protected readonly file: SourceFile,
    protected readonly dataModel: DataModel,
    reservedNames: Array<string> | undefined,
    protected bundleFileNames: { model: string; qObject: string; service: string } | undefined
  ) {
    this.importContainer = new ImportContainer(_path, fileName, dataModel, reservedNames, bundleFileNames);
  }

  public get path() {
    return this._path;
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
}
