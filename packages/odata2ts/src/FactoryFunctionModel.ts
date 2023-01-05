import { ODataVersions } from "@odata2ts/odata-core";
import { SourceFile } from "ts-morph";

import { DataModel } from "./data-model/DataModel";
import { Schema } from "./data-model/edmx/ODataEdmxModelBase";
import { NamingHelper } from "./data-model/NamingHelper";
import { RunOptions } from "./OptionModel";

export type DigestionOptions = Pick<RunOptions, "converters" | "disableAutoManagedKey" | "propertiesByName">; //TODO  | "entitiesByName">;

/**
 * Takes an EdmxSchema plus the run options and creates a DataModel.
 */
export type DigesterFunction<S extends Schema<any, any>> = (
  schema: S,
  options: DigestionOptions,
  namingHelper: NamingHelper
) => Promise<DataModel>;

export type GeneratorFunctionOptions = Pick<RunOptions, "skipEditableModels" | "skipIdModels" | "skipOperations">;

export type EntityBasedGeneratorFunction = (
  dataModel: DataModel,
  sourceFile: SourceFile,
  version: ODataVersions,
  options: GeneratorFunctionOptions,
  namingHelper: NamingHelper
) => void;
