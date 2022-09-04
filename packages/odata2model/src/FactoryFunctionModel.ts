import { SourceFile } from "ts-morph";

import { DataModel } from "./data-model/DataModel";
import { Schema } from "./data-model/edmx/ODataEdmxModelBase";
import { RunOptions } from "./OptionModel";

/**
 * Takes an EdmxSchema plus the run options and creates a DataModel.
 */
export type DigesterFunction<S extends Schema<any, any>> = (schema: S, options: RunOptions) => Promise<DataModel>;

export type EntityBasedGeneratorFunction = (dataModel: DataModel, sourceFile: SourceFile) => void;
