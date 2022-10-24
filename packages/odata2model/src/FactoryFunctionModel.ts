import { MappedConverterChains } from "@odata2ts/converter-runtime";
import { ODataVersions } from "@odata2ts/odata-core";
import { SourceFile } from "ts-morph";

import { DataModel } from "./data-model/DataModel";
import { Schema } from "./data-model/edmx/ODataEdmxModelBase";
import { RunOptions } from "./OptionModel";

export type DigestionOptions = Pick<
  RunOptions,
  "converters" | "serviceName" | "models" | "editableModels" | "idModels" | "operations"
>;

/**
 * Takes an EdmxSchema plus the run options and creates a DataModel.
 */
export type DigesterFunction<S extends Schema<any, any>> = (
  schema: S,
  options: DigestionOptions,
  converters?: MappedConverterChains
) => Promise<DataModel>;

export type GeneratorFunctionOptions = Pick<RunOptions, "models" | "editableModels" | "idModels" | "operations">;

export type EntityBasedGeneratorFunction = (
  dataModel: DataModel,
  sourceFile: SourceFile,
  version: ODataVersions,
  options: GeneratorFunctionOptions
) => void;
