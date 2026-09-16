import { ODataVersions } from "@odata2ts/odata-core";
import { DataModel } from "./data-model/DataModel.js";
import { Reference, Schema } from "./data-model/edmx/ODataEdmxModelBase.js";
import { NamingHelper } from "./data-model/NamingHelper.js";
import { RunOptions } from "./OptionModel.js";
import { ProjectManager } from "./project/ProjectManager.js";

export type DigestionOptions = Pick<
  RunOptions,
  | "converters"
  | "annotations"
  | "keyProperties"
  | "propertiesByName"
  | "byTypeAndName"
  | "v2"
  | "v4"
  | "skipEditableModels"
  | "skipComments"
  | "skipIdModels"
  | "disableAutomaticNameClashResolution"
  | "bundledFileGeneration"
  | "unflattenComplexTypes"
  | "enumType"
  | "enumSynthesized"
>;

/**
 * Takes an EdmxSchema plus the run options and creates a DataModel.
 *
 * The references are the vocabularies the document includes, which sit outside of the schemas and are
 * needed to resolve the aliases that annotation terms are written with.
 */
export type DigesterFunction<S extends Schema<any, any>> = (
  schema: Array<S>,
  options: DigestionOptions,
  namingHelper: NamingHelper,
  references?: Array<Reference>,
) => Promise<DataModel>;

export type GeneratorFunctionOptions = Pick<
  RunOptions,
  | "mode"
  | "bundledFileGeneration"
  | "skipEditableModels"
  | "skipIdModels"
  | "skipOperations"
  | "skipComments"
  | "enumType"
  | "disableBindingProps"
  | "deepInsertProps"
  | "managedPropertyMode"
  | "v2"
  | "v4"
>;

export type EntityBasedGeneratorFunction = (
  project: ProjectManager,
  dataModel: DataModel,
  version: ODataVersions,
  options: GeneratorFunctionOptions,
  namingHelper: NamingHelper,
) => Promise<void>;
