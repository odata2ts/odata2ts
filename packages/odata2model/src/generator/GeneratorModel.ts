import { SourceFile } from "ts-morph";

import { DataModel } from "./../data-model/DataModel";

export interface TsGenerator {
  generate(dataModel: DataModel, sourceFile: SourceFile): void;
}
