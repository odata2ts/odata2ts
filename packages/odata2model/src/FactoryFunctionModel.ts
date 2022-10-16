import { MappedConverterChains } from "@odata2ts/converter";
import { ODataVersions } from "@odata2ts/odata-core";
import { SourceFile } from "ts-morph";

import { DataModel } from "./data-model/DataModel";
import { Schema } from "./data-model/edmx/ODataEdmxModelBase";
import { GenerationOptions, RunOptions } from "./OptionModel";

/**
 * Takes an EdmxSchema plus the run options and creates a DataModel.
 */
export type DigesterFunction<S extends Schema<any, any>> = (
  schema: S,
  options: RunOptions,
  converters?: MappedConverterChains
) => Promise<DataModel>;

export type EntityBasedGeneratorFunction = (
  dataModel: DataModel,
  sourceFile: SourceFile,
  version: ODataVersions,
  options: GenerationOptions | undefined
) => void;
