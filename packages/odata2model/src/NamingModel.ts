/**
 * The available naming strategies.
 */
export enum NamingStrategies {
  NONE = "",
  PASCAL_CASE = "pascalCase",
  CAMEL_CASE = "camelCase",
  CONSTANT_CASE = "constantCase",
}

export interface NamingOptions {
  disableNamingStrategy?: boolean;

  /**
   * Generation options for models, i.e. interfaces representing entity or complex types.
   */
  models?: EntityBasedNamingOptions;

  /**
   * Generation options for Query Objects.
   *
   * By default, prefix = "Q"
   */
  queryObjects?: EntityBasedNamingOptions;

  /**
   * For each model an editable version is generated which represents the model definition for
   * create, update and patch actions.
   *
   * You can override the naming options here.
   * By default, prefix = "Editable"
   */
  editableModels?: EntityDerivedNamingOptions;

  /**
   * ID models are generated from entity id parameters.
   * The generation for one entity entails one model interface representing the id parameters and
   * one QId function which allows to format the parameters for URL usage and to parse parameters
   * from a URL string.
   *
   * You can configure the naming options here.
   * By default, suffix = "Id"
   */
  idModels?: EntityDerivedNamingOptions;

  /**
   * Operations are functions and actions of the OData service.
   * The generation for one operation entails one parameter model interface
   * and one QFunction / QAction class.
   *
   * You can configure the naming options here.
   */
  operations?: OperationNamingOptions;
}

export interface EntityBasedNamingOptions extends NamingStrategyOption, StandardNamingOptions {
  /**
   * Choose a specific strategy to format property names of models: pascal-case, camel-case, etc.
   * By default, camel-case.
   */
  propNamingStrategy?: NamingStrategies;
}

export interface EntityDerivedNamingOptions extends StandardNamingOptions {
  applyModelNaming?: boolean;
}

export interface OperationNamingOptions extends NamingStrategyOption, StandardNamingOptions {
  /**
   * Naming options for generated models representing parameters for functions or actions.
   * Operation name is always used and must be suffixed or prefixed.
   * By default, suffix = "Params"
   */
  paramModel?: NamingStrategyOption & StandardNamingOptions;
  /**
   * Naming options for actions only.
   * When this configuration is provided, the parent configuration regarding suffix and prefix is ignored.
   * By default, parent configuration.
   */
  action?: StandardNamingOptions;
  /**
   * Naming options for functions.
   * When this configuration is provided, the parent configuration regarding suffix and prefix is ignored.
   * By default, parent configuration.
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
