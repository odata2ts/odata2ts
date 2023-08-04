import { TypeConverterConfig } from "@odata2ts/converter-runtime";
import { AxiosRequestConfig } from "axios";

import { NameSettings, OverridableNamingOptions } from "./NamingModel";

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

/**
 * Config options for CLI.
 */
export interface CliOptions {
  /**
   * The URL to the root of your OData service. The URL might end in a slash or not, it might also end
   * in $metadata, but we usually add this for you.
   *
   * Specifying the URL is a convenience feature to download the metadata file from the given URL.
   * You can configure this request via `sourceConfig` option.
   *
   * The `source` option must still be specified as it is used to store the downloaded file on your disk.
   * By default, the file is used once it has been downloaded.
   */
  sourceUrl?: string;
  /**
   * Downloads the metadata file and overwrites the existing one, if any.
   *
   * Only takes effect, if option `sourceUrl` is specified.
   */
  refreshFile?: boolean;
  /**
   * The source is the file to use (must be an EDMX compliant XML file) or the URL to the
   * metadata (ROOT_SERVICE/$metadata).
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
   * - {@code Modes.qobjects} will generate functional units used in QueryBuilder and for functions and actions
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
   * When compiling TypeScript to JS, "tsconfig.json" is used by default to add compilerOptions.
   * This option allows to specify an alternative file.
   *
   * Only takes effect, when mode is set to anything else than {@code EmitModes.ts}.
   */
  tsconfig?: string;
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
  /**
   * odata2ts will automatically decide if a key prop is managed on the server side.
   * If managed, the property will not be editable (create, update, patch).
   * The following rule applies:
   * If a property is the only key prop of an entity, then the prop is deemed to be managed;
   * in ony other case the prop is unmanaged.
   */
  disableAutoManagedKey?: boolean;
  /**
   * By default, odata2ts doesn't change param, operation, property or model names.
   * The generated models and their properties are named exactly as advertised by the server.
   *
   * By allowing odata2ts to change these names, certain predefined formatting strategies are used:
   * Model / class names are formatted with PascalCase; property, param, and operation names with camelCase.
   *
   * The naming configuration allows to control this and other naming related settings.
   * Note: Even if renaming is disabled, model prefixing / suffixing still applies.
   */
  allowRenaming?: boolean;
}

/**
 * Configuration options of the request to retrieve the metadata.
 * Only takes effect if `source` is a URL.
 */
export interface UrlSourceConfiguration {
  /**
   * Basic auth credentials: the username.
   * Only takes effect if `password` has also been set.
   */
  username?: string;
  /**
   * Basic auth credentials: the password.
   * Only takes effect if `username` has also been set.
   */
  password?: string;
  /**
   * Custom request configuration.
   * URL and method `GET` are set by default, but can be overwritten.
   */
  custom?: AxiosRequestConfig;
}

/**
 * Available options for configuration files, i.e. odata2ts.config.ts.
 */
export interface ConfigFileOptions extends Omit<CliOptions, "sourceUrl" | "source" | "output" | "services"> {
  /**
   * Configuration options of the request to retrieve the metadata.
   * Only takes effect if `sourceUrl` is a URL.
   */
  sourceUrlConfig?: UrlSourceConfiguration;

  /**
   * Configuration of each service.
   *
   * @example { services: { trippin: { source: "...", ... } }}
   */
  services?: { [serviceName: string]: ServiceGenerationOptions };

  /**
   * Specify which converters to use by their package name, e.g. "@odata2ts/converter-v2-to-v4".
   * Each converter knows which data type to map.
   *
   * To only use specific converters, the object syntax must be used, where supported converters
   * must be listed by their ids.
   */
  converters?: Array<string | TypeConverterConfig>;

  /**
   * For each model an editable version is generated which represents the model definition for
   * create, update and patch actions.
   *
   * You can skip the generation altogether, not generating editable model variants,
   * if the generation mode is {@code Mode.model} or {@code Mode.qobject}.
   */
  skipEditableModels?: boolean;

  /**
   * ID models are generated from entity id parameters.
   * The generation for one entity entails one model interface representing the id parameters and
   * one QId function which allows to format the parameters for URL usage and to parse parameters
   * from a URL string.
   *
   * You can skip the generation altogether, not generating models and QId objects, if the
   * generation mode is {@code Mode.model} or {@code Mode.qobject}.
   */
  skipIdModels?: boolean;
  /**
   * Operations are functions and actions of the OData service.
   * The generation for one operation entails one parameter model interface
   * and one QFunction / QAction class.
   *
   * You can skip the generation altogether, neither generating model nor query object,
   * if the generation mode is {@code Mode.model} or {@code Mode.qobject}.
   */
  skipOperations?: boolean;
  /**
   * Model properties have explaining comments by default.
   * With this option you can turn that off.
   */
  skipComments?: boolean;
  /**
   * With OData you can read, update and delete data on a primitive property (`Edm.*`).
   * Usually, you wouldn't do that, but go for a bigger request, fetching more relevant information in one go.
   *
   * There's one exception: Handling `Edm.Stream´ properties and Media entities. Services for stream / media
   * stuff are generated regardless of this setting.
   */
  enablePrimitivePropertyServices?: boolean;

  /**
   * The naming options regarding the generated artefacts.
   */
  naming?: OverridableNamingOptions;

  /**
   * Some OData V2 services generate an extra wrapping for entity collection attributes:
   * <code>trips: {results: [...]}</code>. So instead of directly returning an array of entities
   * an object with the property "results" is wrapped around the entity collection.
   *
   * If you're using the odata client then there's a build-in workaround in place which transforms
   * the results to remove this extra mapping. However, if you're only interested in the types, then
   * the generated models will not match that extra wrapping.
   *
   * Setting this configuration option to <code>true</code> (default: false) will add this extra
   * wrapping to the generated models. But this option is only valid if the generation mode is set
   * to <code>models</code>; it is ignored otherwise.
   */
  v2ModelsWithExtraResultsWrapping?: boolean;
  /**
   * Numbers of type `Edm.Int64` and `Edm.Decimal` are represented as `number` in V4.
   * However, these numbers might not fit into JS' number type, which might result in precision loss.
   *
   * OData offers a special IEEE754 format option to get those types as `string` instead to prevent any
   * precision loss. So if you're handling very large or very small numbers (JS roughly supports 15 digits),
   * then you should use this option and, probably, also an appropriate converter (see available converters).
   *
   * Activating this option affects the type generation and will use `string` for both mentioned types.
   * All requests are executed with the "accept" header set to "application/json;IEEE754Compatible=true".
   * Additionally, when sending data the very same value will be set for the "content-type" header.
   */
  v4BigNumberAsString?: boolean;
}

/**
 * Custom generation options which are dependent on a specific odata service.
 */
export interface ServiceGenerationOptions
  extends Required<Pick<CliOptions, "source" | "output">>,
    Pick<CliOptions, "sourceUrl" | "refreshFile">,
    Omit<ConfigFileOptions, "services"> {
  /**
   * Configure generation process for EntityTypes and ComplexTypes including their keys and properties.
   */
  entitiesByName?: Array<EntityGenerationOptions>;
  /**
   * Configure generation process for individual properties based on their name.
   */
  propertiesByName?: Array<PropertyGenerationOptions>;
}

/**
 * Available options for the actual generation run.
 * Every property is required, except the overriding service name.
 */
export interface RunOptions
  extends Required<Omit<ServiceGenerationOptions, "serviceName" | "sourceUrl" | "sourceUrlConfig" | "refreshFile">>,
    Pick<ServiceGenerationOptions, "serviceName" | "sourceUrl" | "sourceUrlConfig" | "refreshFile"> {
  naming: NameSettings;
}

/**
 * Configuration options for EntityTypes and ComplexTypes.
 * This config applies if the name matches the name of an EntityType or ComplexType as it is specified
 * in the metadata (e.g. in EDMX <EntityType name="Test" ...)
 */
export interface EntityGenerationOptions {
  /**
   * Name of the EntityType or ComplexType, e.g. "Person".
   * Must match exactly or can be a regular expression.
   */
  name: string | RegExp;
  /**
   * Use a different name.
   * If name is a regular expression, mappedName allows to specify captured groups (via $1, $2, ...).
   */
  mappedName?: string;
  /**
   * Overwrite the key specification by naming the props by their EDMX name.
   */
  keys?: Array<string>;
  /**
   * Configuration of individual properties.
   */
  properties?: Array<PropertyGenerationOptions>;

  // converter: string | Array<string>

  /**
   * Whether the generated service should allow for querying this model.
   * True by default.
   */
  // queryable?: boolean;
  /**
   * Whether the generated service should allow for creating new models (POST).
   * True by default.
   */
  // creatable?: boolean;
  /**
   * Whether the generated service should allow for updates (PUT).
   * True by default.
   */
  // updatable?: boolean;
  /**
   * Whether the generated service should allow for partial updates (PATCH).
   * True by default.
   */
  // patchable?: boolean;
  /**
   * Whether the generated service should allow for deletion.
   * True by default.
   */
  // deletable?: boolean;
}

/**
 * All configuration options for properties of models.
 */
export interface PropertyGenerationOptions {
  /**
   * Name of the property to match.
   * Must match exactly or can be a regular expression.
   */
  name: string | RegExp;
  /**
   * Use a different name.
   * If name is a regular expression, mappedName allows to specify captured groups (via $1, $2, ...).
   */
  mappedName?: string;
  /**
   * Managed attributes - i.e. managed by the server - cannot be created or updated.
   * Hence, they are left out of the editable model versions.
   */
  managed?: boolean;

  /**
   * TODO
   *
   * Each converter must specify its package name, e.g. "@odata2ts/converter-v2-to-v4",
   * as well it's i
   * and their ids, e.g. "timeToDurationConverter".
   *
   * To only use specific converters, the object syntax must be used, where supported converters
   * must be listed by their ids.
   */
  // converters?: Array<Required<TypeConverterConfig>>;
}
