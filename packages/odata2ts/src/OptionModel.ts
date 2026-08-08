import { TypeConverterConfig } from "@odata2ts/converter-runtime";
import { AxiosRequestConfig } from "axios";
import { NameSettings, OverridableNamingOptions } from "./NamingModel.js";
import { TypeModel } from "./TypeModel.js";

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
   * Special generation options targeting only V2 services, ignored for V4.
   */
  v2?: V2GenerationOptions;

  /**
   * Special generation options targeting only V4 services, ignored for V2.
   */
  v4?: V4GenerationOptions;

  /**
   * OData allows for namespaces so any entity is unique by virtue of it's name within a namespace.
   * odata2ts works with these fully qualified names internally, but only uses the plain name when generating
   * stuff. This might lead to name clashes (same name in different namespaces).
   *
   * odata2ts employs a simple, automatic resolution strategy: Adding a counter at the end of the name.
   * Set this property to true in order to disable this automatism.
   */
  disableAutomaticNameClashResolution?: boolean;
  /**
   * By default, odata2ts generates a folder structure with individual files per entity.
   * This allows for handling and scaling the generation process for large data structures.
   *
   * That structure entails cyclic imports, which are absolutely valid within OData and which any common
   * ESM or bundler setup resolves without trouble. Some do not: SAP's UI5 module loader is the known case,
   * and any other bundler unable to handle cyclic dependencies has the same problem. There the solution is
   * to bundle the generation into one file per kind of artefact, which removes the cycles - set this
   * option to true.
   *
   * Only you know your target platform, so this is your decision to make; where neither applies it is a
   * matter of preference.
   */
  bundledFileGeneration?: boolean;
  /**
   * By default, odata2ts generates string enums.
   * With this option you can also generate numeric enums or a simple string union type.
   */
  enumType?: "string" | "numeric" | "string-union";
  /**
   * More or less a CAP feature. In newer versions SAP CAP unfolds `<ComplexType>` into one
   * property per leaf, joined by an underscore: So instead of an `Address` object you get
   * `Address_Street`, `Address_City`, `Address_PostalCode` and `Address_Country`.
   * That is the shape CAP recommends, and its structured mode (`cds.odata.structs`) is deprecated.
   *
   * Switching this on groups such flat properties back into one complex property, so the models read
   * `address: { street, city, ... }`. Off by default, which leaves the structure exactly as the metadata
   * states it.
   *
   * The reshaping affects the whole surface, since the service still knows nothing but the flat
   * properties: request and response payloads are converted in both directions, and query paths are
   * rewritten, so `$select`, `$filter` and `$orderby` reach the service in the shape it understands -
   * `address.city` is phrased as `Address_City`.
   *
   * Which flat properties form a group is decided from the metadata alone.
   * The following are excluded:
   * - a group named like a navigation property
   * - a group consisting of nothing but an `Id`, which makes it a foreign key: CAP writes `Publisher_Id`
   *   next to the navigation property `Publisher`. The price is that a complex type made up of a single
   *   property named `Id` goes unrecognised. `Publisher_Id` next to `Publisher_Name` is a group again.
   * - a key property, which every URL of the entity addresses by name
   * - an empty segment, i.e. a name ending with the underscore: CAP's `Location_` sits right next to
   *   `Location_Id` and neither is a structured element
   * Where a `<ComplexType>` exists whose properties match the group exactly, it
   * is used with its own name; otherwise one is synthesized.
   */
  unflattenComplexTypes?: boolean;
  /**
   * Allows to bind an already existing entity to a navigation property of the editable models.
   *
   * Where a service is generated (mode {@code service} or {@code all}), the binding goes by the
   * navigation property itself and states the entity to bind by its key:
   * {@code { Author: { "@id": 1 } }}. The key is typed as the id model of the related entity, so its
   * short form is accepted just as well as the full one. The query objects turn that key into the URL
   * of the entity - relative to the service root - and into the notation of the targeted OData version,
   * which is why a service is needed for it: {@code "Author@odata.bind"} for 4.0,
   * {@code {"@id": …}} for 4.01 and {@code {"__metadata": {"uri": …}}} for V2.
   *
   * Since that URL is built from the entity set the navigation property points to, a binding is only
   * generated for navigation properties whose target is known from the metadata - a
   * NavigationPropertyBinding in V4, an AssociationSet in V2 - and whose related entity has an id model
   * ({@code skipIdModels} therefore takes it away).
   *
   * Without a service the binding is stated as it goes on the wire, by the OData name of the navigation
   * property and carrying the URL itself, e.g. {@code "Author@odata.bind": "People(1)"} for 4.0.
   *
   * Opt-out, so a binding is generated unless this is switched off.
   */
  disableBindingProps?: boolean;
  /**
   * Adds the navigation properties to the editable models, typed as the editable model of the related
   * entity, which is what a deep insert (POST) or a deep update (PATCH / PUT) sends: the related entities
   * travel within the payload of the entity they belong to, instead of being created by requests of their
   * own.
   *
   * Together with the binding props a navigation property accepts either shape - a new
   * entity or a reference to an existing one. Where a service is generated both go by the navigation
   * property itself and the {@code "@id"} property tells them apart; without one, the binding is spelled
   * as it goes on the wire, which shares the property in V2 and OData 4.01 but keeps it apart in 4.0
   * ({@code "Author@odata.bind"}).
   *
   * Opt-out, so the editable models carry the navigation properties unless this is switched off.
   */
  disableDeepInsertProps?: boolean;
}

/**
 * Special generation options targeting only V2 services.
 */
export interface V2GenerationOptions {
  /**
   * OData V2 services wrap an entity collection into an extra object carrying the property "results":
   * `trips: {results: [...]}`. So instead of an array of entities you receive an object which
   * holds that array.
   *
   * Setting this configuration option to `true` (default: false) states that structure in
   * the generated models, so that they describe what the service actually sends.
   *
   * It applies to navigation properties only, because that wrapping is how V2 serialises a feed: a
   * collection of a primitive or of a complex type is a plain array either way.
   *
   * The option applies to every generation mode. The client passes the response structure through
   * untouched, so with the option turned off the generated models will not match the response of a
   * service which wraps.
   */
  responseResultsWrapping?: boolean;
  /**
   * The counterpart of `responseResultsWrapping` for the editable models: collection
   * valued navigation properties of a deep insert are wrapped into an extra object with the property
   * "results", as some V2 services expect it.
   *
   * Deliberately its own option, since a service which answers with the extra wrapping does not
   * necessarily expect it in a request payload - see odata2ts issue #237.
   *
   * Like its counterpart the option applies to every generation mode.
   */
  payloadResultsWrapping?: boolean;
  /**
   * A V2 service answers in its own JSON verbose shape: collections come wrapped as
   * `{d: {results: [...], __count?, __next?}}`, entities as
   * `{d: {...entity, __metadata: {uri, type, etag}}}`, and unexpanded navigation properties carry
   * a `{__deferred: {uri}}` placeholder instead of simply being absent.
   *
   * Setting this option to `true` (default: false) reshapes every response of that service as its
   * V4 equivalent instead: collections become `{value: [...], "@odata.count"?, "@odata.nextLink"?}`,
   * entities are returned bare with `__metadata` turned into `@odata.id` /
   * `@odata.type` / `@odata.etag`, and a navigation property that hasn't been expanded
   * is simply left out - exactly as a real V4 service would send it. Applies recursively to expanded
   * navigation properties of any depth.
   *
   * The generated response types change accordingly (`ODataCollectionResponseV4` / `ODataModelResponseV4` /
   * `ODataValueResponseV4` instead of their V2 counterparts), so a consumer of the generated client only ever
   * deals with the V4 shape, regardless of which OData version the actual service speaks.
   *
   * Turned on, this option reshapes an expanded collection valued navigation property as a plain array
   * regardless of `responseResultsWrapping` / `payloadResultsWrapping` - stating
   * the `results` wrapping in the generated types would describe traffic this client no longer sends or
   * receives. Leave both of those off (the default) when turning this on.
   */
  responseAsV4?: boolean;
}

/**
 * Special generation options targeting only V4 services.
 */
export interface V4GenerationOptions {
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
  bigNumberAsString?: boolean;
  /**
   * The OData version to target. It is declared via the OData-Version header on each request carrying a body,
   * which governs how the service interprets the request payload, and it selects the response types to generate:
   * 4.0 payloads must use the "odata." prefix for control information, while 4.01 and greater use the short form
   * ("@count" instead of "@odata.count").
   *
   * Defaults to "4.0", the more widely deployed and more compatible version.
   */
  odataVersion?: "4.0" | "4.01";
  /**
   * By default, odata2ts emulates the in operator by rolling it out as a series of equals-or-expressions.
   * This allows for maximum compatibility with all V4 services, as well as V2 services.
   *
   * Setting this value to true will instead use the native in operator, resulting in smaller queries
   * on V4 services that support it.
   */
  enableNativeInOperator?: boolean;
}

/**
 * Custom generation options which are dependent on a specific odata service.
 */
export interface ServiceGenerationOptions
  extends
    Required<Pick<CliOptions, "source" | "output">>,
    Pick<CliOptions, "sourceUrl" | "refreshFile">,
    Omit<ConfigFileOptions, "services"> {
  /**
   * Configure generation process for individual properties based on their name.
   */
  propertiesByName?: Array<PropertyGenerationOptions>;
  /**
   * Rename any EntityType, ComplexType, EnumType, Function or Action.
   *
   * You must match the simple name (e.g. "Person") or the fully qualified name
   * (e.g. "Trippin.Person") exactly. Alternatively, you can rename a bunch of types
   * by using regular expressions.
   *
   * By providing additional type information via the "type" attribute you get even more options which only apply
   * to the given type.
   */
  byTypeAndName?: Array<ComplexTypeGenerationOptions | EntityTypeGenerationOptions | GenericTypeGenerationOptions>;
}

/**
 * Available options for the actual generation run.
 * Every property is required, except the overriding service name.
 */
export interface RunOptions
  extends
    Required<Omit<ServiceGenerationOptions, "serviceName" | "sourceUrl" | "sourceUrlConfig" | "refreshFile">>,
    Pick<ServiceGenerationOptions, "serviceName" | "sourceUrl" | "sourceUrlConfig" | "refreshFile"> {
  naming: NameSettings;
}

export interface RenameOptions {
  /**
   * Matcher for the name of any EntityType, ComplexType, EnumType, Function or Action
   * as it is stated in the EDMX model, e.g. "Person". As OData supports namespaces
   * you can also use the fully qualified name (including the namespace) to address any model,
   * e.g. "Trippin.Person". You can also match properties by their name.
   *
   * If the name is specified as plain string, it must match either the name or the fully qualified name
   * exactly (case-sensitive).
   *
   * Alternatively, a regular expression can be used which is always applied to the fully qualified name
   * (e.g. Trippin.Person). The regular expression must match the whole string
   * (e.g. `/Person/` won't do, `/.*\.Person/` would work).
   *
   * To make regular expressions useful, captured groups are also supported in combination with
   * the `mappedName` attribute.
   */
  name: string | RegExp;

  /**
   * If specified, this attribute value is used as final name for the matched name as it will
   * appear in the generated typescript.
   *
   * When using a regular expression for matching the name, then captured groups can be referenced
   * as usual via $1, $2, etc. For example:
   * - name: /Trippin\.(.+)/
   * - mappedName: "T_$1"
   * The result would be "T_Person".
   */
  mappedName?: string;
}

export type TypeBasedGenerationOptions =
  GenericTypeGenerationOptions | ComplexTypeGenerationOptions | EntityTypeGenerationOptions;

export interface GenericTypeGenerationOptions extends RenameOptions {
  type:
    | TypeModel.Any
    | TypeModel.EnumType
    | TypeModel.OperationType
    | TypeModel.OperationImportType
    | TypeModel.Singleton
    | TypeModel.EntitySet;
}

export interface ComplexTypeGenerationOptions extends RenameOptions {
  type: TypeModel.ComplexType;

  /**
   * Configuration of individual properties.
   */
  properties?: Array<PropertyGenerationOptions>;

  // converter: string | Array<string>
}

/**
 * Configuration options for EntityTypes and ComplexTypes.
 * This config applies if the name matches the name of an EntityType or ComplexType as it is specified
 * in the metadata (e.g. in EDMX <EntityType name="Test" ...)
 */
export interface EntityTypeGenerationOptions extends Omit<ComplexTypeGenerationOptions, "type"> {
  type: TypeModel.EntityType;

  /**
   * Overwrite the key specification by naming the props by their EDMX name.
   */
  keys?: Array<string>;

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
export interface PropertyGenerationOptions extends RenameOptions {
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
