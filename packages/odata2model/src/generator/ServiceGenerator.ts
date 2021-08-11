import { SourceFile } from "ts-morph";

import { DataModel } from "./../data-model/DataModel";
import { TsGenerator } from "./GeneratorModel";

export class ServiceGenerator implements TsGenerator {
  public generate(dataModel: DataModel, sourceFile: SourceFile): void {
    // TODO
  }
}
