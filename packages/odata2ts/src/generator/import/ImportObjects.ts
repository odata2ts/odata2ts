/**
 * All module names of the main dependencies.
 */
export const LIB_MODULES = {
  core: "@odata2ts/odata-core",
  qObject: "@odata2ts/odata-query-objects",
  clientApi: "@odata2ts/http-client-api",
  service: "@odata2ts/odata-service",
};

/**
 * All imported entity names from the core API.
 * Includes versioned file names, i.e. according to OData version.
 */
export enum CoreImports {
  DeferredContent,
  ODataCollectionResponse, // versioned
  ODataModelResponse, // versioned
  ODataValueResponse, // versioned
}

/**
 * For all core imports that are versioned two files exist, one for V2, one for V4.
 * ODataCollectionResponse = ODataCollectionResponseV2 + ODataCollectionResponseV4
 *
 */
export const VERSIONED_CORE_IMPORTS = [
  CoreImports.ODataCollectionResponse,
  CoreImports.ODataValueResponse,
  CoreImports.ODataModelResponse,
];

/**
 * Most relevant, but not all imports from query objects library
 */
export enum QueryObjectImports {
  QueryObject = "QueryObject",
  QId = "QId",
  QFunction = "QFunction",
  QAction = "QAction",
  EnumCollection = "EnumCollection",
  QEnumCollection = "QEnumCollection",
  QNumericEnumCollection = "QNumericEnumCollection",
  QEnumCollectionPath = "QEnumCollectionPath",
  QNumericEnumCollectionPath = "QNumericEnumCollectionPath",
  QCollectionPath = "QCollectionPath",
  QEntityCollectionPath = "QEntityCollectionPath",
  OperationReturnType = "OperationReturnType",
  ReturnTypes = "ReturnTypes",
  QComplexParam = "QComplexParam",
}

/**
 * All imports from HTTP client API.
 */
export enum ClientApiImports {
  ODataHttpClient,
  ODataHttpClientConfig,
  HttpResponseModel,
}

/**
 * All imports from service library.
 * Includes versioned file names, i.e. according to OData version.
 */
export enum ServiceImports {
  ODataService,
  EntityTypeService,
  PrimitiveTypeService,
  CollectionService,
  EntitySetService,
}

/**
 * For all versioned imports two files exist, one for V2, one for V4.
 * EntityTypeService = EntityTypeServiceV2 + EntityTypeServiceV4
 */
export const VERSIONED_SERVICE_IMPORTS = [
  ServiceImports.EntityTypeService,
  ServiceImports.PrimitiveTypeService,
  ServiceImports.CollectionService,
  ServiceImports.EntitySetService,
];
