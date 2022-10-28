import { TypeConverterConfig } from "@odata2ts/converter-runtime";

/**
 * Generation mode, by default "all".
 */
export enum Modes {
  models,
  qobjects,
  service,
  all,
}

/**
 * What kind of stuff to emit: Either raw TS or TS that has been compiled to JS / DTS.
 */
export enum EmitModes {
  ts = "ts",
  js = "js",
  dts = "dts",
  js_dts = "js_dts",
}

export enum NamingStrategies {
  NONE = "",
  PASCAL_CASE = "pascalCase",
  CAMEL_CASE = "camelCase",
  CONSTANT_CASE = "constantCase",
}

/**
 * Config options for CLI.
 */
export interface CliOptions {
  /**
   * The source file to use. Must be an EDMX compliant XML file.
   *
   * If not specified, at least one service must be configured in config file.
   */
  source?: string;
  /**
   * Specifies the output directory for the generated stuff.
   *
   *  If not specified, at least one service must be configured in config file.
   */
  output?: string;
  /**
   * Only generates the specified services.
   * Relies on an existing config file where these service names are maintained.
   */
  services?: Array<string>;
  /**
   * Specifies what to generate:
   * - {@code Modes.models} will only generate TS interfaces
   * - {@code Modes.qobjects} will generate functional units used in UriBuilder and for functions and actions
   * - {@code Modes.service} will generate one main OData service client and one per each entity
   * - {@code Modes.all} the same as {@code Modes.service}
   *
   * QObjects will also generate models, and generating the service client will also generate models and QObjects.
   * Defaults to {@code Modes.all}
   */
  mode?: Modes;
  /**
   * Specifies the type of the output files: TypeScript, JS, DTS only, JS with DTS.
   * Defaults to {@code EmitModes.js_dts}
   */
  emitMode?: EmitModes;
  /**
   * Uses prettier with your local configuration to pretty print TypeScript files.
   * Only applies if mode is set to {@code EmitModes.ts}.
   */
  prettier?: boolean;
  /**
   * Verbose debugging information.
   */
  debug?: boolean;
  /**
   * Overrides the service name found in the source file.
   *
   * The service name is the basis for all file names and the name of the main OData client service
   * that serves as entry point for the user.
   */
  serviceName?: string;
}

/**
 * Available options for the actual generation run.
 * Every property is required, except the overriding service name.
 */
export interface RunOptions extends Required<Omit<ServiceGenerationOptions, "serviceName">> {
  serviceName?: string;
}

/**
 * Available options for configuration files, i.e. odata2ts.config.ts.
 */
export interface ConfigFileOptions extends Omit<CliOptions, "source" | "output" | "services"> {
  /**
   * Specify which converters to use by their package name, e.g. "@odata2ts/converter-v2-to-v4".
   * Each converter knows which data type to map.
   *
   * To only use specific converters, the object syntax must be used, where supported converters
   * must be listed by their ids.
   */
  converters?: Array<string | TypeConverterConfig>;

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
   * You can skip the generation altogether, not generating editable model variants,
   * if the generation mode is {@code Mode.model} or {@code Mode.qobject}.
   *
   * You can also configure some naming options.
   * By default, prefix = "Editable"
   */
  editableModels?: SkipAndNamingOptions;

  /**
   * ID models are generated from entity id parameters.
   * The generation for one entity entails one model interface representing the id parameters and
   * one QId function which allows to format the parameters for URL usage and to parse parameters
   * from a URL string.
   *
   * You can skip the generation altogether, not generating models and QId objects, if the
   * generation mode is {@code Mode.model} or {@code Mode.qobject}.
   *
   * You can also configure some naming options.
   * By default, suffix = "Id"
   */
  idModels?: SkipAndNamingOptions;

  /**
   * Operations are functions and actions of the OData service.
   * The generation for one operation entails one parameter model interface
   * and one QFunction / QAction class.
   *
   * You can skip the generation altogether, neither generating model nor query object,
   * if the generation mode is {@code Mode.model} or {@code Mode.qobject}.
   *
   * You can also configure some naming options.
   * By default, prefix = "Editable"
   */
  operations?: OperationNamingOptions;

  services?: { [serviceName: string]: ServiceGenerationOptions };
}

export interface EntityBasedNamingOptions extends NamingStrategyOption, StandardNamingOptions {
  /**
   * Choose a specific strategy to format property names of models: pascal-case, camel-case, etc.
   * By default, camel-case.
   */
  propNamingStrategy?: NamingStrategies;
}

export interface SkipAndNamingOptions extends StandardNamingOptions {
  skip?: boolean;
  applyModelNaming?: boolean;
}

export interface OperationNamingOptions extends NamingStrategyOption, StandardNamingOptions {
  skip?: boolean;
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
   * Choose a specific strategy to format model names: pascal-case, camel-case, etc.
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
 * Custom generation options which are dependent on a specific odata service.
 */
interface ServiceGenerationOptions
  extends Required<Pick<CliOptions, "source" | "output">>,
    Omit<ConfigFileOptions, "services"> {
  /**
   * Configure generation process for EntityTypes and ComplexTypes including their properties.
   */
  modelTypes?: Array<ModelTypeGenerationOptions>;
  /**
   * Configure generation process for individual properties based on their name.
   */
  propertyTypes?: Array<PropertyGenerationOptions>;
}

/**
 * All configurations for EntityTypes and ComplexTypes.
 */
interface ModelTypeGenerationOptions {
  /**
   * Name of the EntityType or ComplexType, e.g. "Person".
   */
  name: string;
  /**
   * Map the name to a different name.
   */
  mappedName?: string;
  /**
   * Whether the generated service should allow for querying this model.
   * True by default.
   */
  queryable?: boolean;
  /**
   * Whether the generated service should allow for creating new models (POST).
   * True by default.
   */
  creatable?: boolean;
  /**
   * Whether the generated service should allow for updates (PUT).
   * True by default.
   */
  updatable?: boolean;
  /**
   * Whether the generated service should allow for partial updates (PATCH).
   * True by default.
   */
  patchable?: boolean;
  /**
   * Whether the generated service should allow for deletion.
   * True by default.
   */
  deletable?: boolean;
  // converter: string | Array<string>
  /**
   * Configuration of individual properties.
   */
  properties?: Array<PropertyGenerationOptions>;
}

/**
 * All configuration options for properties of models.
 */
interface PropertyGenerationOptions {
  /**
   * Name of the property to match. Must match exactly.
   */
  name: string;
  /**
   * Map the name to a different name.
   */
  mappedName?: string;
  /**
   * Managed attributes - i.e. managed by the server - cannot be created or updated.
   * Hence, they are left out of the editable model versions.
   */
  managed?: boolean;

  /**
   * Each converter must specify its package name, e.g. "@odata2ts/converter-v2-to-v4",
   * as well it's i
   * and their ids, e.g. "timeToDurationConverter".
   *
   * To only use specific converters, the object syntax must be used, where supported converters
   * must be listed by their ids.
   */
  converters?: Array<Required<TypeConverterConfig>>;
}
