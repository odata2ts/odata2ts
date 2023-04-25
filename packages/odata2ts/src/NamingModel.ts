/**
 * The available naming strategies.
 */
import { PartialDeep } from "type-fest";

export enum NamingStrategies {
  NONE = "",
  PASCAL_CASE = "pascalCase",
  CAMEL_CASE = "camelCase",
  CONSTANT_CASE = "constantCase",
  SNAKE_CASE = "snakeCase",
}

/**
 * Based on an existing configuration (for example default settings) the user only specifies what needs
 * to be changed. Hence, all options are completely optional.
 */
export interface OverridableNamingOptions extends PartialDeep<NameSettings> {}

/**
 * The required and optional name settings for the generator.
 */
export interface NameSettings {
  /**
   * Because multiple artefacts are generated out of the same entity, some name settings are required in order
   * to differentiate those artefacts. Out-of-the-box odata2ts provides you with sensible default settings,
   * so that you only need to override those settings you want to change.
   *
   * However, sometimes it makes more sense to start from scratch, so that the defaults don't interfere with
   * your own configuration. In this scenario this switch should be enabled to only have default values for
   * the required name settings.
   */
  minimalDefaults?: boolean;

  /**
   * Generation options for models, i.e. interfaces representing entity or complex types.
   */
  models: ModelNamingOptions;

  /**
   * Generation options for Query Objects.
   *
   * By default, prefix = "Q"
   */
  queryObjects: QueryObjectNamingOptions;

  services: ServiceNamingOptions;
}

export interface ModelNamingOptions extends NamingStrategyOption, StandardNamingOptions {
  /**
   * All generated models are bundled into one file.
   * This option specifies the formatting of the file name.
   */
  fileName: FileNamingStrategyOption & RequiredNamingOptions;

  /**
   * Choose a specific strategy to format property names of models: pascal-case, camel-case, etc.
   * By default, camel-case.
   */
  propNamingStrategy?: NamingStrategies;

  /**
   * For each model an editable version is generated which represents the model definition for
   * create, update and patch actions.
   *
   * You can override the naming options here.
   * By default, prefix = "Editable"
   */
  editableModels: EntityDerivedNamingOptions;

  /**
   * ID models are generated from entity id parameters.
   *
   * You can configure the naming options here.
   * By default, suffix = "Id"
   */
  idModels: EntityDerivedNamingOptions;

  /**
   * Operation parameter models are generated from function or action signatures.
   *
   * You can configure the naming options here.
   * By default, suffix = "Params"
   */
  operationParamModels: EntityDerivedNamingOptions;
}

export interface EntityDerivedNamingOptions extends RequiredNamingOptions {
  applyModelNaming?: boolean;
}

export interface QueryObjectNamingOptions extends NamingStrategyOption, RequiredNamingOptions {
  /**
   * All generated models are bundled into one file.
   * This option specifies the formatting of the file name.
   */
  fileName: FileNamingStrategyOption & RequiredNamingOptions;

  /**
   * Choose a specific strategy to format property names of query objects: pascal-case, camel-case, etc.
   * By default, camel-case.
   */
  propNamingStrategy?: NamingStrategies;

  idFunctions: RequiredNamingOptions;

  operations?: OperationNamingOptions;
}

export interface OperationNamingOptions extends StandardNamingOptions {
  /**
   * Naming options for actions only.
   * When this configuration is provided, the parent configuration regarding suffix and prefix is ignored.
   */
  action?: StandardNamingOptions;
  /**
   * Naming options for functions only.
   * When this configuration is provided, the parent configuration regarding suffix and prefix is ignored.
   */
  function?: StandardNamingOptions;
}

export interface NamingStrategyOption {
  /**
   * Choose a specific strategy to format names: pascal-case, camel-case, etc.
   * Defaults to pascal-case.
   */
  namingStrategy?: NamingStrategies;
}

export interface FileNamingStrategyOption {
  /**
   * Choose a specific strategy to format names: pascal-case, camel-case, etc.
   * Defaults to pascal-case.
   */
  namingStrategy?: NamingStrategies;
}

export interface StandardNamingOptions {
  /**
   * Prefix all names, e.g. "I" => "ITest"
   */
  prefix?: string;
  /**
   * Suffix all names, e.g. "model" => "TestModel"
   */
  suffix?: string;
}

export interface RequiredNamingOptions extends Required<StandardNamingOptions> {}

/**
 * Naming options for generated service classes.
 * These options affect the main service as well as all services generated for each entity, complex and collection type.
 *
 * There exists one specialty about services: The file names are not configurable.
 * File names are determined by the name of their corresponding classes, so that service file name
 * and service class name always correspond.
 *
 * By default, suffix = Service and namingStrategy = PascalCase
 */
export interface ServiceNamingOptions extends NamingStrategyOption, RequiredNamingOptions {
  /**
   * Controls the naming options for the main odata service.
   * By default, the base service naming options are applied.
   * But since this is the main entry point for users, it can be configured individually here.
   *
   * By default, applyServiceNaming = true
   */
  main?: NamingStrategyOption & StandardNamingOptions & { applyServiceNaming?: boolean };

  /**
   * Name of the service responsible for entity collections.
   *
   * By default, suffix = Collection and applyServiceNaming = true
   */
  collection: RequiredNamingOptions & { applyServiceNaming?: boolean };

  /**
   * Naming for getter method of another service.
   *
   * By default, namingStrategy = camelCase
   */
  relatedServiceGetter: NamingStrategyOption & RequiredNamingOptions;

  /**
   * Operations are functions and actions of the OData service and are represented as methods
   * of the generated service class. This setting controls the naming of the corresponding
   * function.
   *
   * By default, namingStrategy = camelCase
   */
  operations?: NamingStrategyOption & OperationNamingOptions;

  /**
   * Naming options for private properties of service classes.
   *
   * By default, prefix = _
   */
  privateProps: NamingStrategyOption & RequiredNamingOptions;
}
