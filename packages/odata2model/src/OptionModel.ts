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
  js_dts = "js-dts",
}

/**
 * Config options for CLI.
 */
export interface CliOptions {
  source: string;
  output: string;
  mode: keyof typeof Modes;
  emitMode: keyof typeof EmitModes;
  modelPrefix: string;
  modelSuffix: string;
  prettier: boolean;
  debug: boolean;
  serviceName?: string;
}

/**
 * Available options for configuration files, i.e. odata2ts.config.ts.
 */
export interface ConfigFileOptions extends Omit<Partial<CliOptions>, "source" | "output"> {
  generation?: GenerationOptions;
}

/**
 * Available options for the actual generation run.
 */
export interface RunOptions extends Omit<CliOptions, "source" | "mode" | "emitMode"> {
  mode: Modes;
  emitMode: EmitModes;
  generation?: GenerationOptions;
}


export interface GenerationOptions {
  /**
   * If activated, no Editable models are generated.
   * Only applies if mode is set to model or Q-object generation; required by service generation.
   *
   * False by default.
   */
  skipEditableModel?: boolean;
  /**
   * If set to true, id models and QId functions are not generated.
   * Only applies if mode is set to model or Q-object generation; required by service generation.
   *
   * False by default.
   */
  skipIdModel?: boolean;
  /**
   * If activated, neither models for operation params nor QActions or QFunctions are generated.
   * Only applies if mode is set to model or Q-object generation; required by service generation.
   *
   * False by default.
   */
  skipOperationModel?: boolean;

  model?: EntityGenerationOptions;
  idModel?: EntityGenerationOptions;
  // paramModel?: EntityGenerationOptions;
  // qEntity?: EntityGenerationOptions;
  // qIdFunction?: EntityGenerationOptions;
  // qFunction?: EntityGenerationOptions;
  // qAction?: EntityGenerationOptions;
  // service?: EntityGenerationOptions;

  /**
   * Specify which converters to use by their package name, e.g. "@odata2ts/converter-v2-to-v4".
   * Each converter knows which data type to map.
   *
   * To only use specific converters, the object syntax must be used, where supported converters
   * must be listed by their ids.
   */
  converters?: Array<string | TypeConverterModel>;
  /**
   * Custom generation options which are dependent on a specific odata service.
   */
  custom?: CustomGenerationOptions;
}

/**
 * Allows for further configuration of a converter.
 */
export interface TypeConverterModel {
  /**
   * The package or module name, e.g. "@odata2ts/converter-v2-to-v4".
   */
  module: string;
  /**
   * List of converter ids of this module, which should be used.
   */
  use: Array<string>;
}

/**
 * Generation configurations revolving around the entities of EDMX.
 */
export interface EntityGenerationOptions {
  /**
   * A name prefix to use.
   */
  prefix?: string;
  /**
   * A name suffix to use.
   */
  suffix?: string;
  // namingStrategy?: PascalCaseNamingStrategy,
  // propNamingStrategy?: CamelCaseNamingStrategy
}

/**
 * Configure generation process for certain EDMX entities specifically for the given OData service.
 */
export interface CustomGenerationOptions {
  /**
   * Configure generation process for EntityTypes and ComplexTypes including their properties.
   */
  modelTypes?: Array<ModelTypeGenerationOptions>;
  /**
   * Configure generation process for properties without any relationship to their EntityType or ComplexType.
   */
  propertyTypes?: Array<PropertyGenerationOptions>;
}

/**
 * All configurations for EntityTypes and ComplexTypes.
 */
export interface ModelTypeGenerationOptions {
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
export interface PropertyGenerationOptions {
  /**
   * Name of the property.
   */
  name: string;
  /**
   * Map the name to a different name.
   */
  mappedName?: string;
  /**
   * Managed attributes - i.e. managed by the server - cannot be created or updated.
   */
  managed?: boolean;
}
