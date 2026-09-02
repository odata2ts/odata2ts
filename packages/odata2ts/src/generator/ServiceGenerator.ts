import { ODataVersions } from "@odata2ts/odata-core";
import deepmerge from "deepmerge";
import {
  ClassDeclarationStructure,
  MethodDeclarationStructure,
  OptionalKind,
  PropertyDeclarationStructure,
  Scope,
} from "ts-morph";
import { upperCaseFirst } from "upper-case-first";
import { firstCharLowerCase } from "xml2js/lib/processors.js";
import { DataModel } from "../data-model/DataModel.js";
import {
  ActionImportType,
  ComplexType,
  DataTypes,
  EntityContainerModel,
  EntitySetType,
  EntityType,
  FunctionImportType,
  hasUpdatableModel,
  OperationType,
  OperationTypes,
  PropertyModel,
  ReturnTypeModel,
  SingletonType,
} from "../data-model/DataTypeModel.js";
import { NamingHelper } from "../data-model/NamingHelper.js";
import { CacheKeyMode, ConfigFileOptions, Modes, resolveCacheKeyMode } from "../OptionModel.js";
import { FileHandler } from "../project/FileHandler.js";
import { ProjectManager } from "../project/ProjectManager.js";
import { ClientApiImports, CoreImports, QueryObjectImports, ServiceImports } from "./import/ImportObjects.js";
import { importReturnType } from "./import/ImportResponseHelper.js";
import { ImportContainer } from "./ImportContainer.js";

export interface PropsAndOps extends Required<Pick<ClassDeclarationStructure, "properties" | "methods">> {}

export interface ServiceGeneratorOptions extends Pick<
  ConfigFileOptions,
  "enablePrimitivePropertyServices" | "enumType" | "managedPropertyMode" | "cacheKeys"
> {
  v2: Pick<NonNullable<ConfigFileOptions["v2"]>, "responseAsV4">;
  v4: Pick<NonNullable<ConfigFileOptions["v4"]>, "bigNumberAsString" | "odataVersion">;
}

export async function generateServices(
  project: ProjectManager,
  dataModel: DataModel,
  version: ODataVersions,
  namingHelper: NamingHelper,
  options?: ServiceGeneratorOptions,
) {
  const generator = new ServiceGenerator(project, dataModel, version, namingHelper, options);
  return generator.generate();
}

class ServiceGenerator {
  constructor(
    private project: ProjectManager,
    private dataModel: DataModel,
    private version: ODataVersions,
    private namingHelper: NamingHelper,
    private options: ServiceGeneratorOptions = { v2: {}, v4: {} },
  ) {}

  private readonly cacheKeyMode = resolveCacheKeyMode(this.options.cacheKeys);

  private isV4BigNumber() {
    return this.options.v4.bigNumberAsString && this.version === ODataVersions.V4;
  }

  private isV401() {
    return this.options.v4.odataVersion === "4.01" && this.version === ODataVersions.V4;
  }

  private isV2AsV4() {
    return !!this.options.v2.responseAsV4 && this.version === ODataVersions.V2;
  }

  // ---------------------------------------------------------------------------------------------------
  // cache-key emission
  //
  // Every method below returns the bare runtime expression building a `CacheKeyState` - or `""` when the
  // feature is off, which is what keeps `off` output byte-identical to before this feature existed. A
  // root expression is self-contained (`rootState(...)`); every other expression reads the parent's state
  // off a `cacheKeyState` variable the call site must destructure from `this.__base` - but only when the
  // expression is non-empty, or the `off` output gains an unused binding.
  // ---------------------------------------------------------------------------------------------------

  /** The root of a route: an entity set, a singleton, or an operation rooted at one. */
  private emitRootStateExpr(
    imports: ImportContainer,
    typeName: string,
    kind: "list" | "detail",
    paramsSource?: string,
  ): string {
    if (this.cacheKeyMode === CacheKeyMode.off) {
      return "";
    }
    const rootStateFn = imports.addServiceFunction("rootState");
    const optionsArg = paramsSource ? `, { params: ${paramsSource} }` : "";
    return `${rootStateFn}("${typeName}", "${kind}"${optionsArg})`;
  }

  /**
   * A navigation property hop, grade-aware: hierarchical under `hierarchical` mode or where the relation
   * is not derivable (contained, grade C), re-rooted under `typeFlattening` wherever it is. `elementType`
   * is the property's own declared type - a hierarchical hop's `typeName` regardless of what entity set
   * backs it; `entitySetType` (feeding `resourceType`/`invalidates`) is deliberately the *entity set's*
   * own type instead, even when `elementType` is narrower (`Publisher/Books` binds `Media`, typed
   * `Collection(Book)`): a cast restricts what is addressed without changing which collection a write
   * invalidates, exactly as a direct subtype cast does.
   */
  private emitNavHopExpr(
    imports: ImportContainer,
    ownerFqName: string,
    navPropOdataName: string,
    elementType: EntityType,
    isCollection: boolean,
    contained: boolean,
  ): string {
    if (this.cacheKeyMode === CacheKeyMode.off) {
      return "";
    }

    const kind = isCollection ? "list" : "detail";
    const targetSet = !contained ? this.dataModel.getNavPropBindingTarget(ownerFqName, navPropOdataName) : undefined;
    const entitySetTypeEntry = targetSet ? `, entitySetType: "${targetSet.entityType.fqName}"` : "";

    if (this.cacheKeyMode === CacheKeyMode.typeFlattening && targetSet) {
      const derivation = this.dataModel.getNavPropDerivation(ownerFqName, navPropOdataName);

      // grade A, to-one: the target's key is fully known, so this re-roots onto a true canonical entity
      // key rather than a filtered collection.
      if (derivation.grade === "A" && derivation.targetKeyPairs) {
        const reRootToEntityFn = imports.addServiceFunction("reRootToEntity");
        const keyEntries = derivation.targetKeyPairs
          .map((pair) => `${pair.targetKeyProperty}: cacheKeyState.keyValues!["${pair.sourceKeyProperty}"]`)
          .join(", ");
        return `${reRootToEntityFn}(cacheKeyState, "${derivation.rootType}", { ${keyEntries} })`;
      }

      // grade A or B, to-many: a derived filter, re-rooted at the target entity set's own type.
      if ((derivation.grade === "A" || derivation.grade === "B") && derivation.filterPairs) {
        const hopStateFn = imports.addServiceFunction("hopState");
        const filterEntries = derivation.filterPairs
          .map((pair) => `"${pair.filterPath}": cacheKeyState.keyValues!["${pair.parentKeyProperty}"]`)
          .join(", ");
        const castEntry = derivation.cast ? `, cast: "${derivation.cast}"` : "";
        return (
          `${hopStateFn}(cacheKeyState, { name: "${navPropOdataName}", kind: "${kind}", ` +
          `reRoot: { typeName: "${derivation.rootType}", filter: { ${filterEntries} }${castEntry} }${entitySetTypeEntry} })`
        );
      }
    }

    const hopStateFn = imports.addServiceFunction("hopState");
    return `${hopStateFn}(cacheKeyState, { typeName: "${elementType.fqName}", kind: "${kind}", name: "${navPropOdataName}"${entitySetTypeEntry} })`;
  }

  /** A complex property hop: the same shape as a navigation hop, but never re-rooted - a complex value is never a navigation property. */
  private emitComplexHopExpr(imports: ImportContainer, typeName: string, isCollection: boolean, name: string): string {
    if (this.cacheKeyMode === CacheKeyMode.off) {
      return "";
    }
    const hopStateFn = imports.addServiceFunction("hopState");
    return `${hopStateFn}(cacheKeyState, { typeName: "${typeName}", kind: "${isCollection ? "list" : "detail"}", name: "${name}" })`;
  }

  /** A primitive property, primitive collection or stream property hop: bare name, no type. */
  private emitBareHopExpr(imports: ImportContainer, name: string): string {
    if (this.cacheKeyMode === CacheKeyMode.off) {
      return "";
    }
    const hopStateFn = imports.addServiceFunction("hopState");
    return `${hopStateFn}(cacheKeyState, { name: "${name}" })`;
  }

  /** A stream property's raw value: the property hop, then a further hop appending `$value`. */
  private emitStreamHopExpr(imports: ImportContainer, odataName: string): string {
    if (this.cacheKeyMode === CacheKeyMode.off) {
      return "";
    }
    const hopStateFn = imports.addServiceFunction("hopState");
    return `${hopStateFn}(${hopStateFn}(cacheKeyState, { name: "${odataName}" }), { name: "$value" })`;
  }

  /** A subtype cast: a restriction on the very same resource, not a hop away from it. */
  private emitCastParamsExpr(imports: ImportContainer, castFqName: string): string {
    if (this.cacheKeyMode === CacheKeyMode.off) {
      return "";
    }
    const withParamsFn = imports.addServiceFunction("withParams");
    return `${withParamsFn}(cacheKeyState, { cast: "${castFqName}" })`;
  }

  /**
   * The root of an unbound function/action import: rooted at its declared `EntitySet`'s type where one is
   * declared, `$operation` otherwise - the one case with no type to head with, so no `rootState` call
   * produces it: the state is built as a plain object literal instead.
   */
  private emitUnboundOperationRootExpr(
    imports: ImportContainer,
    op: OperationType,
    entitySetOdataName: string | undefined,
    hasParams: boolean,
  ): string {
    if (this.cacheKeyMode === CacheKeyMode.off) {
      return "";
    }

    const entitySet = entitySetOdataName
      ? Object.values(this.dataModel.getEntityContainer().entitySets).find((es) => es.odataName === entitySetOdataName)
      : undefined;

    if (entitySet) {
      const rootStateFn = imports.addServiceFunction("rootState");
      const kind = op.returnType?.isCollection ? "list" : "detail";
      const operationParams = hasParams ? ", params" : "";
      return `${rootStateFn}("${entitySet.entityType.fqName}", "${kind}", { params: { operation: "${op.fqName}"${operationParams} } })`;
    }

    const operationRootConst = imports.addServiceFunction("OPERATION_ROOT");
    return `{ typeName: ${operationRootConst}, steps: ["${op.fqName}"], kindIndex: 0 }`;
  }

  /** A bound function/action: a hop off the resource it is bound to, with its return type where structured. */
  private emitBoundOperationHopExpr(
    imports: ImportContainer,
    fqOperationName: string,
    returnType: ReturnTypeModel | undefined,
  ): string {
    if (this.cacheKeyMode === CacheKeyMode.off) {
      return "";
    }
    const hopStateFn = imports.addServiceFunction("hopState");
    const isStructured = !!returnType?.fqType && returnType.dataType !== DataTypes.PrimitiveType;
    const typeNameEntry = isStructured
      ? `typeName: "${returnType!.fqType}", kind: "${returnType!.isCollection ? "list" : "detail"}", `
      : "";
    return `${hopStateFn}(cacheKeyState, { ${typeNameEntry}name: "${fqOperationName}" })`;
  }

  /**
   * The version type argument list as seen from the main service, which pins it: the main service does not
   * declare the extra type parameter itself, everything it hands out infers it from the options.
   *
   * Empty unless something is actually pinned, since both V4's `V` and V2's `AsV4` default appropriately
   * on their own (`"4.0"`, `false`).
   */
  private getMainVersionArg() {
    if (this.isV401()) {
      return `<"4.01">`;
    }
    if (this.isV2AsV4()) {
      return `<true>`;
    }
    return "";
  }

  /**
   * {@link getMainVersionArg} for the one place it must not be used: the main service's own `extends`
   * clause. `ODataService` is the single, unversioned base class every main service extends, V2 and V4
   * alike, and it is generic only over the V4 minor version - there is no `AsV4` for it to accept.
   * `v2ResponseAsV4` still reaches every sub-service, just via the runtime option
   * ({@link getRuntimeOptions}) rather than this type argument.
   */
  private getRootServiceVersionArg() {
    return this.isV401() ? `<"4.01">` : "";
  }

  /**
   * The version type argument list as seen from a generated service class, which declares the extra type
   * parameter itself and passes it on, so that nested services keep the shape of the client they belong to:
   * `V` for a V4 service (4.0 vs 4.01), `AsV4` for a V2 service generated with `v2ResponseAsV4`.
   *
   * Empty for a plain V2 service, which knows no such type parameter.
   */
  private getServiceVersionArg() {
    if (this.version === ODataVersions.V4) {
      return "<V>";
    }
    if (this.isV2AsV4()) {
      return "<AsV4>";
    }
    return "";
  }

  /**
   * {@link getServiceVersionArg} for a type argument list which already carries entries, so that the
   * version reads as the last argument instead of the only one.
   */
  private getServiceVersionArgSuffix() {
    if (this.version === ODataVersions.V4) {
      return ", V";
    }
    if (this.isV2AsV4()) {
      return ", AsV4";
    }
    return "";
  }

  /**
   * The name of the model an entity service writes with. That service never creates an entity, so it is
   * the UpdatableModel wherever the type has one of its own, and the EditableModel everywhere else -
   * for a type with nothing immutable about it the two would say the same thing anyway.
   */
  private resolveUpdatableModelName(model: ComplexType): string {
    return hasUpdatableModel(model, this.options.managedPropertyMode!) ? model.updatableName : model.editableName;
  }

  /**
   * Type parameters of a generated service class: V4 services are generic over the OData version, a V2
   * service generated with `v2ResponseAsV4` over whether it reshapes its response as V4. A plain V2 service
   * has no type parameter at all.
   */
  private getServiceTypeParams(imports: ImportContainer) {
    if (this.version === ODataVersions.V4) {
      return [`V extends ${imports.addCoreLib(ODataVersions.V4, CoreImports.ODataVersionV4)} = "4.0"`];
    }
    if (this.isV2AsV4()) {
      return [`AsV4 extends boolean = false`];
    }
    return [];
  }

  /**
   * Options which are decided at generation time, but only take effect at runtime, hence they are passed
   * on to the base service. Results in a constructor being generated, if there are any.
   */
  private getRuntimeOptions() {
    const options: Array<string> = [];
    if (this.isV4BigNumber()) {
      options.push("bigNumbersAsString: true");
    }
    if (this.isV401()) {
      options.push(`odataVersionV4: "4.01"`);
    }
    if (this.isV2AsV4()) {
      options.push("v2ResponseAsV4: true");
    }
    return options;
  }

  /**
   * The runtime options type of a generated service class - the counterpart of {@link getServiceTypeParams}.
   * V4 always uses `ODataServiceOptionsInternal<V>`, generic over the very type parameter the class itself
   * declares, since it already needs it for the 4.0/4.01 axis regardless. A plain V2 service has nothing
   * of the sort to declare, so it keeps the public `ODataServiceOptions` unless `v2ResponseAsV4` actually
   * introduces the `AsV4` type parameter, in which case the options type has to keep up with it too.
   */
  private getServiceOptionsType(imports: ImportContainer) {
    if (this.version === ODataVersions.V4) {
      return imports.addServiceObject(this.version, ServiceImports.ODataServiceOptionsInternal);
    }
    return imports.addServiceObject(
      this.version,
      this.isV2AsV4() ? ServiceImports.ODataServiceOptionsInternalV2 : ServiceImports.ODataServiceOptions,
    );
  }

  public async generate(): Promise<void> {
    const mainServiceName = this.namingHelper.getMainServiceName();
    this.project.initServices();

    await Promise.all([
      this.generateMainService(mainServiceName),
      ...this.generateEntityTypeServices(),
      ...this.generateComplexTypeServices(),
    ]);

    return this.project.finalizeServices();
  }

  private async generateMainService(mainServiceName: string) {
    const mainServiceFile = this.project.getMainServiceFile();
    const importContainer = mainServiceFile.getImports();
    const container = this.dataModel.getEntityContainer();
    const unboundOperations = [...Object.values(container.functions), ...Object.values(container.actions)];

    const rootService = importContainer.addServiceObject(this.version, ServiceImports.ODataService);

    const { properties, methods }: PropsAndOps = deepmerge(
      this.generateMainServiceProperties(container, importContainer),
      this.generateMainServiceOperations(unboundOperations, importContainer),
    );

    const runtimeOptions = this.getRuntimeOptions();
    // the main service names the client type only where it declares a constructor of its own; without one
    // it inherits the base signature, and the import would sit there unused
    const httpClient = runtimeOptions.length ? importContainer.addClientApi(ClientApiImports.ODataHttpClient) : "";

    mainServiceFile.getFile().addClass({
      isExported: true,
      name: mainServiceName,
      extends: `${rootService}${this.getRootServiceVersionArg()}`,
      ctors: runtimeOptions.length
        ? [
            {
              parameters: [
                { name: "client", type: httpClient },
                { name: "basePath", type: "string" },
                {
                  name: "options",
                  // deliberately the public type, not getServiceOptionsType(): the fields merged in below
                  // are internal, decided by the generator - a caller of the main service never states them
                  type: importContainer.addServiceObject(this.version, ServiceImports.ODataServiceOptions),
                  hasQuestionToken: true,
                },
              ],
              statements: [
                // ODataService itself knows nothing about v2ResponseAsV4 - it is generic only over the V4
                // minor version, shared as it is between V2 and V4 main services - so passing it on to
                // every sub-service via this merge needs a cast where it is the field actually set
                `super(client, basePath, { ...options, ${runtimeOptions.join(", ")} }${this.isV2AsV4() ? " as any" : ""});`,
              ],
            },
          ]
        : [],
      properties,
      methods,
    });
  }

  private generateMainServiceProperties(
    container: EntityContainerModel,
    importContainer: ImportContainer,
  ): PropsAndOps {
    const result: PropsAndOps = { properties: [], methods: [] };

    Object.values(container.entitySets).forEach(({ name, odataName, entityType }) => {
      result.methods.push(
        this.generateRelatedServiceGetter(name, odataName, entityType, importContainer, this.getMainVersionArg()),
      );
    });

    Object.values(container.singletons).forEach((singleton) => {
      result.properties.push(this.generateSingletonProp(importContainer, singleton));
      result.methods.push(this.generateSingletonGetter(importContainer, singleton));
    });

    return result;
  }

  private generateMainServiceOperations(
    ops: Array<FunctionImportType | ActionImportType>,
    importContainer: ImportContainer,
  ): PropsAndOps {
    const result: PropsAndOps = { properties: [], methods: [] };

    ops.forEach((funcOrActionImport) => {
      const { operation, name } = funcOrActionImport;
      const op = this.dataModel.getUnboundOperationType(operation);
      if (!op) {
        throw new Error(`Operation "${operation}" not found!`);
      }
      // only a function import ever declares one - CSDL has no equivalent for an action import
      const entitySetOdataName = "entitySet" in funcOrActionImport ? funcOrActionImport.entitySet : undefined;

      result.properties.push(this.generateQOperationProp(op));
      result.methods.push(
        this.generateMethod(name, op, importContainer, "", this.getMainVersionArg(), false, entitySetOdataName),
      );
    });

    return result;
  }

  /**
   * `ownerFqName` distinguishes the two contexts this getter serves: `undefined` for an entity set on the
   * main service (the root of a route), a real FQ type for a navigation property reached from another
   * entity or complex type (a hop off `ownerFqName`'s `contained`/`odataPropName`).
   */
  private generateRelatedServiceGetter(
    propName: string,
    odataPropName: string,
    entityType: EntityType,
    imports: ImportContainer,
    versionArg: string,
    ownerFqName?: string,
    contained = false,
  ): OptionalKind<MethodDeclarationStructure> {
    const idName = imports.addGeneratedModel(entityType.id.fqName, entityType.id.modelName);
    const serviceName = imports.addGeneratedService(entityType.fqName, entityType.serviceName);
    const collectionName = imports.addGeneratedService(entityType.fqName, entityType.serviceCollectionName);
    const cacheKeyExpr =
      ownerFqName === undefined
        ? this.emitRootStateExpr(imports, entityType.fqName, "list")
        : this.emitNavHopExpr(imports, ownerFqName, odataPropName, entityType, true, contained);
    const cacheKeyDestructure = ownerFqName !== undefined && cacheKeyExpr ? ", cacheKeyState" : "";

    return {
      scope: Scope.Public,
      name: this.namingHelper.getRelatedServiceGetter(propName),
      parameters: [
        {
          name: "id",
          type: `${idName} | undefined`,
          hasQuestionToken: true,
        },
      ],
      overloads: [
        {
          parameters: [],
          returnType: `${collectionName}${versionArg}`,
        },
        {
          parameters: [
            {
              name: "id",
              type: idName,
            },
          ],
          returnType: `${serviceName}${versionArg}`,
        },
      ],
      statements: [
        `const fieldName = "${odataPropName}";`,
        `const { client, path, options${cacheKeyDestructure} } = this.__base;`,
        // the version argument is only spelled out on the constructor call for v2ResponseAsV4: without it,
        // "new Type(...)" infers AsV4's default (false), which mismatches the declared return type above
        // wherever it isn't itself the abstract AsV4 - concretely, on every getter of the main service,
        // which pins the literal true rather than passing an abstract type parameter along
        `const collection = new ${collectionName}${this.isV2AsV4() ? versionArg : ""}(client, path, fieldName, options${cacheKeyExpr ? `, ${cacheKeyExpr}` : ""});`,
        'return typeof id === "undefined" || id === null ? collection : collection.byId(id);',
      ],
    };
  }

  private generateSingletonProp(
    importContainer: ImportContainer,
    singleton: SingletonType,
  ): OptionalKind<PropertyDeclarationStructure> {
    const { name, entityType } = singleton;
    // Registered rather than merely named: where the singleton's type has an entity set of its own, the
    // import is already there from the entity set's getter, but a type reachable *only* as a singleton
    // has nothing else to bring it in - and unbundled output then references a class it never imported.
    const type = importContainer.addGeneratedService(entityType.fqName, entityType.serviceName);

    return {
      scope: Scope.Private,
      name: this.namingHelper.getPrivatePropName(name),
      type: `${type}${this.getMainVersionArg()}`,
      hasQuestionToken: true,
    };
  }

  private generateQOperationProp = (operation: OperationType) => {
    return {
      scope: Scope.Private,
      name: this.namingHelper.getPrivatePropName(operation.qName),
      type: operation.qName,
      hasQuestionToken: true,
    };
  };

  private generateSingletonGetter(
    importContainer: ImportContainer,
    singleton: SingletonType,
  ): OptionalKind<MethodDeclarationStructure> {
    const { name, odataName, entityType } = singleton;
    const propName = "this." + this.namingHelper.getPrivatePropName(name);
    // the registered name rather than the plain one: an import may have been aliased to avoid a clash,
    // and the property declaration above went through the same call, so the two agree
    const serviceType = importContainer.addGeneratedService(entityType.fqName, entityType.serviceName);
    // the entity's real key is not knowable client-side, so the marker takes its place - it cannot
    // collide with a real key value, since a key is never an object carrying `singleton`
    const cacheKeyExpr = this.emitRootStateExpr(
      importContainer,
      entityType.fqName,
      "detail",
      `{ singleton: "${odataName}" }`,
    );

    return {
      scope: Scope.Public,
      name: this.namingHelper.getRelatedServiceGetter(name),
      statements: [
        `if(!${propName}) {`,
        `  const { client, path, options } = this.__base;`,
        // prettier-ignore
        `  ${propName} = new ${serviceType}(client, path, "${odataName}", options${cacheKeyExpr ? `, ${cacheKeyExpr}` : ""})`,
        "}",
        `return ${propName}`,
      ],
    };
  }

  private generateEntityTypeService(file: FileHandler, model: ComplexType, isComplexType = false) {
    const importContainer = file.getImports();

    const operations = this.dataModel.getEntityTypeOperations(model.fqName);
    const props = [...model.baseProps, ...model.props];

    // a media entity's own representation is binary content, reachable via `$value` - that access is
    // what the specialized base class adds on top of the regular entity service. V2 calls the same thing
    // a media link entry and addresses it the same way.
    const isMediaEntity = !isComplexType && (model as EntityType).hasStream;

    const entityServiceType = importContainer.addServiceObject(
      this.version,
      this.version === ODataVersions.V2 && isComplexType
        ? ServiceImports.ComplexTypeService
        : isMediaEntity
          ? ServiceImports.MediaEntityService
          : ServiceImports.EntityTypeService,
    );
    const httpClient = importContainer.addClientApi(ClientApiImports.ODataHttpClient);

    // note: predictable first imports => no need to take renaming into account
    const modelName = importContainer.addGeneratedModel(model.fqName, model.modelName);
    const updatableModelName = importContainer.addGeneratedModel(model.fqName, this.resolveUpdatableModelName(model));
    const qName = importContainer.addGeneratedQObject(model.fqName, model.qName, true);
    const qObjectName = importContainer.addGeneratedQObject(model.fqName, firstCharLowerCase(model.qName));
    const serviceOptions = this.getServiceOptionsType(importContainer);

    const { properties, methods }: PropsAndOps = deepmerge(
      deepmerge(
        this.generateServiceProperties(importContainer, model.fqName, props),
        this.generateServiceOperations(importContainer, model, operations, true),
      ),
      this.generateCastOperations(importContainer, model, false),
    );

    // generate EntityTypeService
    file.getFile().addClass({
      isExported: true,
      name: model.serviceName,
      typeParameters: this.getServiceTypeParams(importContainer),
      extends:
        entityServiceType + `<${modelName}, ${updatableModelName}, ${qName}${this.getServiceVersionArgSuffix()}>`,
      ctors: [
        {
          parameters: [
            { name: "client", type: httpClient },
            { name: "basePath", type: "string" },
            { name: "name", type: "string" },
            {
              name: "options",
              type: `${serviceOptions}${this.getServiceVersionArg()}`,
              hasQuestionToken: true,
            },
          ],
          statements: [
            `super(client, basePath, name, ${qObjectName}, ${this.getServiceRuntimeOptions(model, isComplexType)});`,
          ],
        },
      ],
      properties,
      methods,
    });
  }

  private generateServiceProperties(
    importContainer: ImportContainer,
    ownerFqName: string,
    props: Array<PropertyModel>,
  ): PropsAndOps {
    const result: PropsAndOps = { properties: [], methods: [] };

    props.forEach((prop) => {
      // stream properties: binary content behind its own URL, so always a service of its own - the
      // enablePrimitivePropertyServices switch deliberately does not apply, since there is no other way
      // to reach the content at all
      if (prop.isStream) {
        result.properties.push(this.generateStreamProp(importContainer, prop));
        result.methods.push(this.generateStreamGetter(importContainer, prop));
      }
      // collection of ComplexTypes, ComplexTypes, or EntityTypes
      else if (
        (prop.dataType === DataTypes.ModelType && !prop.isCollection) ||
        prop.dataType === DataTypes.ComplexType
      ) {
        result.properties.push(this.generateModelProp(importContainer, prop));
        result.methods.push(this.generateModelPropGetter(importContainer, prop, ownerFqName));
      } else if (prop.isCollection) {
        // collection of EntityTypes
        if (prop.dataType === DataTypes.ModelType) {
          const entityType = this.dataModel.getEntityType(prop.fqType);
          if (!entityType) {
            throw new Error(`Entity type "${prop.fqType}" specified by property not found!`);
          }

          result.methods.push(
            this.generateRelatedServiceGetter(
              prop.name,
              prop.odataName,
              entityType,
              importContainer,
              this.getServiceVersionArg(),
              ownerFqName,
              prop.contained,
            ),
          );
        }
        // collection of primitive or enum types
        else {
          result.properties.push(this.generatePrimitiveCollectionProp(importContainer, prop));
          result.methods.push(this.generatePrimitiveCollectionGetter(importContainer, prop));
        }
      }
      // generation of services for each primitive property: turned off by default
      else if (this.options.enablePrimitivePropertyServices && prop.dataType === DataTypes.PrimitiveType) {
        result.properties.push(this.generatePrimitiveTypeProp(importContainer, prop));
        result.methods.push(this.generatePrimitiveTypeGetter(importContainer, prop));
      }
    });

    return result;
  }

  private generateServiceOperations(
    importContainer: ImportContainer,
    model: ComplexType,
    operations: Array<OperationType>,
    isEntityBound: boolean,
  ): PropsAndOps {
    const result: PropsAndOps = { properties: [], methods: [] };

    operations.forEach((operation) => {
      result.properties.push(this.generateQOperationProp(operation));
      result.methods.push(
        this.generateMethod(
          operation.name,
          operation,
          importContainer,
          model.fqName,
          this.getServiceVersionArg(),
          isEntityBound,
        ),
      );
    });

    return result;
  }

  private generateModelProp(imports: ImportContainer, prop: PropertyModel): PropertyDeclarationStructure {
    const propModel = this.dataModel.getModel(prop.fqType) as ComplexType;
    let propModelType: string;

    if (prop.isCollection) {
      const modelName = imports.addGeneratedModel(propModel.fqName, propModel.modelName);
      const editableModelName = imports.addGeneratedModel(propModel.fqName, propModel.editableName);
      const qModelName = imports.addGeneratedQObject(propModel.fqName, propModel.qName, true);
      const collectionServiceType = imports.addServiceObject(this.version, ServiceImports.CollectionService);

      propModelType = `${collectionServiceType}<${modelName}, ${qModelName}, ${editableModelName}${this.getServiceVersionArgSuffix()}>`;
    } else {
      const serviceName = imports.addGeneratedService(propModel.fqName, propModel.serviceName);
      propModelType = `${serviceName}${this.getServiceVersionArg()}`;
    }

    return {
      scope: Scope.Private,
      name: this.namingHelper.getPrivatePropName(prop.name),
      type: propModelType,
      hasQuestionToken: true,
    } as PropertyDeclarationStructure;
  }

  private generatePrimitiveCollectionProp(
    imports: ImportContainer,
    prop: PropertyModel,
  ): OptionalKind<PropertyDeclarationStructure> {
    if (!prop.qObject) {
      throw new Error("Illegal State: [qObject] must be provided for Collection types!");
    }

    const collectionServiceType = imports.addServiceObject(this.version, ServiceImports.CollectionService);
    const isEnum = prop.dataType === DataTypes.EnumType;
    const isNumericEnum = this.options.enumType === "numeric";
    let qType: string;
    let type: string;

    if (isEnum) {
      const propEnum = this.dataModel.getModel(prop.fqType)!;
      const propTypeModel = imports.addGeneratedModel(propEnum.fqName, propEnum.modelName, false);
      type = `${imports.addQObjectType(QueryObjectImports.EnumCollection)}<typeof ${propTypeModel}>`;
      qType = `${imports.addQObjectType(prop.qObject)}<typeof ${propTypeModel}>`;
    } else {
      // TODO refactor string concat
      type = imports.addQObjectType(`${upperCaseFirst(prop.type)}Collection`);
      qType = imports.addQObjectType(prop.qObject);
    }
    // the version is the last type param, so the defaulted primitive type has to be spelled out for it
    const versionArgs = this.getServiceVersionArg()
      ? `, ${imports.addServiceObject(this.version, ServiceImports.PrimitiveExtractor)}<${type}>, V`
      : "";
    const collectionType = `${collectionServiceType}<${type}, ${qType}${versionArgs}>`;

    return {
      scope: Scope.Private,
      name: this.namingHelper.getPrivatePropName(prop.name),
      type: `${collectionType}`,
      hasQuestionToken: true,
    };
  }

  private generatePrimitiveTypeProp(
    imports: ImportContainer,
    prop: PropertyModel,
  ): OptionalKind<PropertyDeclarationStructure> {
    const serviceType = imports.addServiceObject(this.version, ServiceImports.PrimitiveTypeService);
    const type = prop.typeModule ? imports.addCustomType(prop.typeModule, prop.type, true) : prop.type;

    return {
      scope: Scope.Private,
      name: this.namingHelper.getPrivatePropName(prop.name),
      type: `${serviceType}<${type}${this.getServiceVersionArgSuffix()}>`,
      hasQuestionToken: true,
    };
  }

  private generateStreamProp(
    imports: ImportContainer,
    prop: PropertyModel,
  ): OptionalKind<PropertyDeclarationStructure> {
    const serviceType = imports.addServiceObject(this.version, ServiceImports.StreamService);

    return {
      scope: Scope.Private,
      name: this.namingHelper.getPrivatePropName(prop.name),
      type: `${serviceType}${this.getServiceVersionArg()}`,
      hasQuestionToken: true,
    };
  }

  private generateStreamGetter(
    imports: ImportContainer,
    prop: PropertyModel,
  ): OptionalKind<MethodDeclarationStructure> {
    const serviceType = imports.addServiceObject(this.version, ServiceImports.StreamService);
    const propName = "this." + this.namingHelper.getPrivatePropName(prop.name);
    const cacheKeyExpr = this.emitStreamHopExpr(imports, prop.odataName);
    const cacheKeyDestructure = cacheKeyExpr ? ", cacheKeyState" : "";

    return {
      scope: Scope.Public,
      name: this.namingHelper.getRelatedServiceGetter(prop.name),
      statements: [
        `if(!${propName}) {`,
        `  const { client, path, options${cacheKeyDestructure} } = this.__base;`,
        `  ${propName} = new ${serviceType}(client, path, "${prop.odataName}", options${cacheKeyExpr ? `, ${cacheKeyExpr}` : ""})`,
        "}",
        `return ${propName}`,
      ],
    };
  }

  private generateModelPropGetter(
    imports: ImportContainer,
    prop: PropertyModel,
    ownerFqName: string,
  ): OptionalKind<MethodDeclarationStructure> {
    const model = this.dataModel.getModel(prop.fqType) as ComplexType;
    const isComplexCollection = prop.isCollection && model.dataType === DataTypes.ComplexType;
    // an entity navigation property (never a collection here - that shape goes through
    // generateRelatedServiceGetter instead) is grade-aware; a complex property never is, since a complex
    // value is never a navigation property and has no relation to derive
    const isEntityNav = model.dataType !== DataTypes.ComplexType;

    const type = isComplexCollection
      ? imports.addServiceObject(this.version, ServiceImports.CollectionService)
      : prop.isCollection
        ? model.serviceCollectionName
        : model.serviceName;
    const typeWithGenerics = isComplexCollection
      ? `${type}<${imports.addGeneratedModel(model.fqName, model.modelName)}, ${imports.addGeneratedQObject(
          model.fqName,
          model.qName,
          true,
        )}, ${imports.addGeneratedModel(model.fqName, model.editableName)}${this.getServiceVersionArgSuffix()}>`
      : `${type}${this.getServiceVersionArg()}`;

    const privateSrvProp = "this." + this.namingHelper.getPrivatePropName(prop.name);
    const cacheKeyExpr = isEntityNav
      ? this.emitNavHopExpr(imports, ownerFqName, prop.odataName, model as EntityType, false, !!prop.contained)
      : this.emitComplexHopExpr(imports, model.fqName, prop.isCollection, prop.odataName);
    const cacheKeyDestructure = cacheKeyExpr ? ", cacheKeyState" : "";

    return {
      scope: Scope.Public,
      name: this.namingHelper.getRelatedServiceGetter(prop.name),
      returnType: typeWithGenerics,
      statements: [
        `if(!${privateSrvProp}) {`,
        `  const { client, path, options${cacheKeyDestructure} } = this.__base;`,
        // prettier-ignore
        `  ${privateSrvProp} = new ${type}(client, path, "${prop.odataName}"${isComplexCollection ? `, ${imports.addGeneratedQObject(model.fqName, firstCharLowerCase(model.qName))}`: ""}, options${cacheKeyExpr ? `, ${cacheKeyExpr}` : ""})`,
        "}",
        `return ${privateSrvProp}`,
      ],
    };
  }

  private generatePrimitiveCollectionGetter(
    imports: ImportContainer,
    prop: PropertyModel,
  ): OptionalKind<MethodDeclarationStructure> {
    const collectionServiceType = imports.addServiceObject(this.version, ServiceImports.CollectionService);
    const qCollectionName = imports.addQObject(prop.qObject!);
    const enumName =
      prop.dataType === DataTypes.EnumType ? imports.addGeneratedModel(prop.fqType, prop.type) : undefined;

    const propName = "this." + this.namingHelper.getPrivatePropName(prop.name);
    const cacheKeyExpr = this.emitBareHopExpr(imports, prop.odataName);
    const cacheKeyDestructure = cacheKeyExpr ? ", cacheKeyState" : "";
    return {
      scope: Scope.Public,
      name: this.namingHelper.getRelatedServiceGetter(prop.name),
      statements: [
        `if(!${propName}) {`,
        `  const { client, path, options${cacheKeyDestructure} } = this.__base;`,
        // prettier-ignore
        `  ${propName} = new ${collectionServiceType}(client, path, "${prop.odataName}", new ${qCollectionName}(${enumName ?? ""}), options${cacheKeyExpr ? `, ${cacheKeyExpr}` : ""})`,
        "}",
        `return ${propName}`,
      ],
    };
  }

  private generatePrimitiveTypeGetter(
    imports: ImportContainer,
    prop: PropertyModel,
  ): OptionalKind<MethodDeclarationStructure> {
    const serviceType = imports.addServiceObject(this.version, ServiceImports.PrimitiveTypeService);
    const propName = "this." + this.namingHelper.getPrivatePropName(prop.name);
    // for V2: mapped name must be specified
    const v2MappedName =
      this.version === ODataVersions.V4 ? "" : prop.name !== prop.odataName ? `, "${prop.name}"` : ", undefined";
    const cacheKeyExpr = this.emitBareHopExpr(imports, prop.odataName);
    const cacheKeyDestructure = cacheKeyExpr ? ", cacheKeyState" : "";

    return {
      scope: Scope.Public,
      name: this.namingHelper.getRelatedServiceGetter(prop.name),
      statements: [
        `if(!${propName}) {`,
        `  const { client, path, qModel, options${cacheKeyDestructure} } = this.__base;`,
        `  ${propName} = new ${serviceType}(client, path, "${prop.odataName}", qModel.${prop.name}.converter${v2MappedName}, options${cacheKeyExpr ? `, ${cacheKeyExpr}` : ""})`,
        "}",
        `return ${propName}`,
      ],
    };
  }

  /**
   * The runtime options a generated service hands to its base class.
   *
   * Almost always just `options`, the argument its own constructor took. A type under optimistic
   * concurrency control adds a flag of its own, since that is decided per entity type rather than for the
   * service as a whole - the same shape `generateCastOperations` uses to pass `subtype: true`.
   */
  private getServiceRuntimeOptions(model: ComplexType, isComplexType = false): string {
    const isConcurrencyControlled = !isComplexType && (model as EntityType).concurrencyControlled;
    return isConcurrencyControlled ? "{ ...options, concurrencyControlled: true }" : "options";
  }

  private generateEntityCollectionService(file: FileHandler, model: EntityType) {
    const importContainer = file.getImports();
    // creation lives here, so this is the one service still typed on the EditableModel - and the one place
    // that registers its import: under strictOmit the entity service next to it imports the UpdatableModel
    // instead, so relying on that one to have pulled the name in leaves this class referencing nothing.
    const editableModelName = importContainer.addGeneratedModel(model.fqName, model.editableName);
    const qObjectName = firstCharLowerCase(model.qName);

    const entitySetServiceType = importContainer.addServiceObject(this.version, ServiceImports.EntitySetService);
    const paramsModelName = importContainer.addGeneratedModel(model.id.fqName, model.id.modelName);
    const qIdFunctionName = importContainer.addGeneratedQObject(model.id.fqName, model.id.qName);
    const serviceOptions = this.getServiceOptionsType(importContainer);
    const entityServiceName = importContainer.addGeneratedService(model.fqName, model.serviceName);
    const httpClient = importContainer.addClientApi(ClientApiImports.ODataHttpClient);

    const collectionOperations = this.dataModel.getEntitySetOperations(model.fqName);

    const { properties, methods } = deepmerge(
      this.generateServiceOperations(importContainer, model, collectionOperations, false),
      this.generateCastOperations(importContainer, model, true),
    );

    // Emitted whenever the feature is on: `invalidateQueries(["Library.Catalog.Medium"])` needs the FQN
    // *without* issuing a request, and hand-writing namespace strings across an application is exactly the
    // kind of typo no compiler catches.
    if (this.cacheKeyMode !== CacheKeyMode.off) {
      properties.push({
        scope: Scope.Public,
        isReadonly: true,
        name: "entityTypeName",
        initializer: `"${model.fqName}"`,
      });
    }

    file.getFile().addClass({
      isExported: true,
      name: model.serviceCollectionName,
      typeParameters: this.getServiceTypeParams(importContainer),
      extends:
        entitySetServiceType +
        `<${model.modelName}, ${editableModelName}, ${model.qName}, ${paramsModelName}, ${entityServiceName}${this.getServiceVersionArg()}${this.getServiceVersionArgSuffix()}>`,
      ctors: [
        {
          parameters: [
            { name: "client", type: httpClient },
            { name: "basePath", type: "string" },
            { name: "name", type: "string" },
            {
              name: "options",
              type: `${serviceOptions}${this.getServiceVersionArg()}`,
              hasQuestionToken: true,
            },
          ],
          statements: [
            `super(client, basePath, name, ${qObjectName}, new ${qIdFunctionName}(name), ${this.getServiceRuntimeOptions(model)});`,
          ],
        },
      ],
      properties,
      methods: [
        ...methods,
        {
          scope: Scope.Protected,
          name: "createEntityService",
          parameters: [
            { name: "client", type: httpClient },
            { name: "path", type: "string" },
            { name: "name", type: "string" },
            { name: "options", type: `${serviceOptions}${this.getServiceVersionArg()} | undefined` },
            // this base class's own `byId` computes the entity's cache-key state (see EntitySetServiceV4/V2);
            // this override only has to forward it, never compute it itself
            ...(this.cacheKeyMode !== CacheKeyMode.off
              ? [
                  {
                    name: "cacheKeyState",
                    type: importContainer.addServiceFunction("CacheKeyState", true),
                    hasQuestionToken: true,
                  },
                ]
              : []),
          ],
          statements: [
            `return new ${entityServiceName}${this.getServiceVersionArg()}(client, path, name, options${this.cacheKeyMode !== CacheKeyMode.off ? ", cacheKeyState" : ""});`,
          ],
        },
      ],
    });
  }

  private generateEntityTypeServices(): Array<Promise<void>> {
    // build service file for each entity, consisting of EntityTypeService & EntityCollectionService
    return this.dataModel
      .getEntityTypes()
      .filter((model) => model.genMode === Modes.service || model.genMode === Modes.all)
      .map((model) => {
        const file = this.project.createOrGetServiceFile(model.folderPath, model.serviceName, [
          model.serviceName,
          model.serviceCollectionName,
        ]);

        // entity type service
        this.generateEntityTypeService(file, model);
        // entity collection service if this entity specified keys at all
        if (model.keyNames.length) {
          this.generateEntityCollectionService(file, model);
        }

        return this.project.finalizeFile(file);
      });
  }

  private generateComplexTypeServices(): Array<Promise<void>> {
    // build service file for complex types
    return this.dataModel
      .getComplexTypes()
      .filter((model) => model.genMode === Modes.service || model.genMode === Modes.all)
      .map((model) => {
        const file = this.project.createOrGetServiceFile(model.folderPath, model.serviceName, [model.serviceName]);

        // entity type service
        this.generateEntityTypeService(file, model, true);

        return this.project.finalizeFile(file);
      });
  }

  private generateMethod(
    name: string,
    operation: OperationType,
    importContainer: ImportContainer,
    baseFqName: string,
    versionArg: string,
    isEntityBound = false,
    entitySetOdataName?: string,
  ): OptionalKind<MethodDeclarationStructure> {
    const isFunc = operation.type === OperationTypes.Function;
    const returnType = operation.returnType;
    // OData V4.01 Part 1, §8.3.1: an action bound to a resource carries `If-Match` for that resource,
    // just like patch, update and delete do (see ServiceStateHelperV4/V2#getConcurrencyOptions). A
    // function reads rather than writes, and a collection-bound or unbound operation addresses no
    // single resource, so neither carries the precondition.
    const withConcurrency = !isFunc && isEntityBound;
    const hasParams = operation.parameters.length > 0 || operation.overrides?.length;
    const isParamsOptional = !![operation.parameters, ...(operation.overrides ?? [])].find((pSet) => pSet.length === 0);
    const isComposable =
      operation.composable && returnType && returnType.fqType && returnType.dataType !== DataTypes.PrimitiveType;
    const responseServiceName =
      !isComposable || !returnType
        ? undefined
        : returnType.isCollection
          ? this.namingHelper.getCollectionServiceName(returnType.fqType)
          : this.namingHelper.getServiceName(returnType.fqType);
    const useUrlGetCmd = this.version === ODataVersions.V4 && isFunc && !operation.usePost;

    // importing dependencies
    const requestCmd = importContainer.addServiceObject(
      this.version,
      isComposable
        ? ServiceImports.ComposableUrlRequestCmd
        : useUrlGetCmd
          ? ServiceImports.UrlGetRequestCmd
          : ServiceImports.UrlRequestCmd,
    );
    const responseStructure = returnType
      ? importReturnType(this.version, importContainer, returnType, this.isV2AsV4())
      : undefined;
    const responseService = responseServiceName
      ? importContainer.addGeneratedService(returnType!.fqType, responseServiceName)
      : undefined;
    const qOperationName = importContainer.addGeneratedQObject(baseFqName, operation.qName);
    const rtType =
      returnType?.type && returnType.dataType !== DataTypes.PrimitiveType
        ? importContainer.addGeneratedModel(returnType.fqType, returnType.type)
        : returnType?.type;
    const paramsModelName = hasParams
      ? importContainer.addGeneratedModel(baseFqName, operation.paramsModelName)
      : undefined;

    const qOpProp = "this." + this.namingHelper.getPrivatePropName(operation.qName);

    // an unbound operation (baseFqName === "") roots the key at its declared EntitySet's type, or at
    // "$operation" where none is declared; a bound one is a hop off the resource it hangs on
    const cacheKeyExpr = !baseFqName
      ? this.emitUnboundOperationRootExpr(importContainer, operation, entitySetOdataName, !!hasParams)
      : this.emitBoundOperationHopExpr(importContainer, operation.fqName, returnType);
    const needsCacheKeyState = !!baseFqName && !!cacheKeyExpr;

    const optionStmt =
      `{ ` +
      `headers: getDefaultHeaders()` +
      (!isFunc && hasParams ? `, mainRequestConverter: ${qOpProp}.getRequestConverter()` : "") +
      (returnType ? `, mainResponseConverter: ${qOpProp}.getResponseConverter()` : "") +
      (withConcurrency ? `, concurrency: getConcurrencyOptions()` : "") +
      (cacheKeyExpr ? `, cacheKeyState: ${cacheKeyExpr}` : "") +
      `}`;
    const requestCmdStmt = isComposable
      ? `return new ${requestCmd}<${responseService}${versionArg}, ${responseStructure}<${rtType}>>(` +
        `client,` +
        `url,` +
        `(finalUrl: string) => new ${responseService}${versionArg}(client, finalUrl, "", options),` +
        optionStmt +
        `);`
      : `return new ${requestCmd}<${responseStructure ? `${responseStructure}<${rtType}>` : "undefined"}${!isFunc && hasParams ? ", " + paramsModelName : ""}>(` +
        `client,` +
        `${useUrlGetCmd ? "" : `${importContainer.addClientApi(ClientApiImports.ODataHttpMethods)}.${!isFunc || operation.usePost ? "Post" : "Get"},`}` +
        `url, ` +
        `${useUrlGetCmd ? "" : !isFunc && hasParams ? "params," : "undefined,"}` +
        optionStmt +
        `);`;

    return {
      scope: Scope.Public,
      name,
      parameters: hasParams
        ? [{ name: "params", type: paramsModelName, hasQuestionToken: isParamsOptional }]
        : undefined,
      statements: [
        `if(!${qOpProp}) {`,
        `  ${qOpProp} = new ${qOperationName}()`,
        "}",

        `const { addFullPath, client, getDefaultHeaders${isFunc ? `, isUrlNotEncoded${isComposable ? ", options" : ""}` : ""}${withConcurrency ? ", getConcurrencyOptions" : ""}${needsCacheKeyState ? ", cacheKeyState" : ""} } = this.__base;`,
        `const url = addFullPath(${qOpProp}.buildUrl(${!isFunc ? "" : hasParams ? "params, isUrlNotEncoded()" : "isUrlNotEncoded()"}));`,
        ``,
        requestCmdStmt,
      ],
    };
  }

  private generateCastOperations(
    importContainer: ImportContainer,
    model: ComplexType,
    isCollection: boolean,
  ): PropsAndOps {
    const result: PropsAndOps = { properties: [], methods: [] };

    if (this.version === ODataVersions.V4) {
      model.subtypes.forEach((subtype) => {
        const subClass = this.dataModel.getModel(subtype) as ComplexType;
        const serviceName = isCollection ? subClass.serviceCollectionName : subClass.serviceName;
        const serviceType = importContainer.addGeneratedService(subClass.fqName, serviceName);
        const cacheKeyExpr = this.emitCastParamsExpr(importContainer, subClass.fqName);
        const cacheKeyDestructure = cacheKeyExpr ? ", cacheKeyState" : "";
        result.methods.push({
          name: `as${upperCaseFirst(serviceName)}`,
          scope: Scope.Public,
          statements: [
            `const { client, path, options${cacheKeyDestructure} } = this.__base;`,
            `return new ${serviceType}(client, path, "${subClass.fqName}", { ...options, subtype: true }${cacheKeyExpr ? `, ${cacheKeyExpr}` : ""});`,
          ],
        });
      });
    }

    return result;
  }
}
