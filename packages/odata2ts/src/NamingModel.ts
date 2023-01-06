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
  /**
   * Generation options for models, i.e. interfaces representing entity or complex types.
   */
  models?: ModelNamingOptions;

  /**
   * Generation options for Query Objects.
   *
   * By default, prefix = "Q"
   */
  queryObjects?: QueryObjectNamingOptions;

  services?: ServiceNamingOptions;
}

export interface ModelNamingOptions extends NamingStrategyOption, StandardNamingOptions {
  /**
   * All generated models are bundled into one file.
   * This option specifies the formatting of the file name.
   */
  fileName?: NamingStrategyOption & StandardNamingOptions;

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
  editableModels?: EntityDerivedNamingOptions;

  /**
   * ID models are generated from entity id parameters.
   *
   * You can configure the naming options here.
   * By default, suffix = "Id"
   */
  idModels?: EntityDerivedNamingOptions;

  /**
   * Operation parameter models are generated from function or action signatures.
   *
   * You can configure the naming options here.
   * By default, suffix = "Params"
   */
  operationParamModels?: EntityDerivedNamingOptions;
}

export interface EntityDerivedNamingOptions extends StandardNamingOptions {
  applyModelNaming?: boolean;
}

export interface QueryObjectNamingOptions extends NamingStrategyOption, StandardNamingOptions {
  /**
   * All generated models are bundled into one file.
   * This option specifies the formatting of the file name.
   */
  fileName?: NamingStrategyOption & StandardNamingOptions;

  /**
   * Choose a specific strategy to format property names of query objects: pascal-case, camel-case, etc.
   * By default, camel-case.
   */
  propNamingStrategy?: NamingStrategies;

  idFunctions?: StandardNamingOptions;

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

/**
 * Naming options for generated service classes.
 *
 * By default, suffix = Service and namingStrategy = pascalCase
 */
export interface ServiceNamingOptions extends NamingStrategyOption, StandardNamingOptions {
  /**
   * For each service one file is generated.
   * This option specifies the formatting of the file name.
   */
  fileNames?: NamingStrategyOption & StandardNamingOptions;

  /**
   * Name of the service responsible for entity collections.
   *
   * By default, suffix = Collection and applyServiceNaming = true
   */
  collection?: StandardNamingOptions & { applyServiceNaming?: boolean };

  /**
   * Naming for factory function for EntityServiceResolvers.
   *
   * By default, prefix = create, suffix = ServiceResolver
   * @example createTestEntityServiceResolver
   */
  serviceResolverFunction?: NamingStrategyOption & StandardNamingOptions;

  /**
   * Naming for getter method. Another related service is returned.
   *
   * By default, prefix = "get" and suffix = "Srv" and namingStrategy = camelCase
   */
  relatedServiceGetter?: NamingStrategyOption & StandardNamingOptions;

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
   */
  privateProps?: StandardNamingOptions & NamingStrategyOption;
  /**
   * Naming options for public properties of service classes.
   */
  publicProps?: NamingStrategyOption;
}
