import { ValueConverterImport } from "@odata2ts/converter-runtime";
import { ODataVersions } from "@odata2ts/odata-core";
import {
  GetAccessorDeclarationStructure,
  MethodDeclarationStructure,
  OptionalKind,
  PropertyDeclarationStructure,
  Scope,
  VariableDeclarationKind,
} from "ts-morph";
import { firstCharLowerCase } from "xml2js/lib/processors.js";
import { DataModel } from "../data-model/DataModel.js";
import {
  ComplexType,
  DataTypes,
  EntityType,
  OperationType,
  OperationTypes,
  PropertyModel,
} from "../data-model/DataTypeModel.js";
import { NamingHelper } from "../data-model/NamingHelper.js";
import { EntityBasedGeneratorFunction, GeneratorFunctionOptions } from "../FactoryFunctionModel.js";
import { Modes } from "../OptionModel.js";
import { FileHandler } from "../project/FileHandler.js";
import { ProjectManager } from "../project/ProjectManager.js";
import { QueryObjectImports } from "./import/ImportObjects.js";
import { importMainResponseConverter, importReturnType } from "./import/ImportResponseHelper.js";
import { ImportContainer } from "./ImportContainer.js";

export const generateQueryObjects: EntityBasedGeneratorFunction = (
  project,
  dataModel,
  version,
  options,
  namingHelper,
) => {
  const generator = new QueryObjectGenerator(project, dataModel, version, options, namingHelper);
  return generator.generate();
};

const OPTIONS_STATEMENT = "OPTS";

class QueryObjectGenerator {
  constructor(
    private project: ProjectManager,
    private dataModel: DataModel,
    private version: ODataVersions,
    private options: GeneratorFunctionOptions,
    private namingHelper: NamingHelper,
  ) {}

  private isV2AsV4() {
    return this.options.v2ResponseAsV4 && this.version === ODataVersions.V2;
  }

  public async generate(): Promise<void> {
    this.project.initQObjects();

    this.generateOptions();

    // process EntityType & ComplexType
    const promises: Array<Promise<void>> = [...this.generateEntityTypes(), ...this.generateComplexTypes()];
    if (!this.options.skipOperations) {
      // process unbound operations
      promises.push(this.generateUnboundOperations());
    }

    await Promise.all(promises);

    return this.project.finalizeQObjects();
  }

  private generateOptions() {
    const file = this.project.createOrGetMainQObjectFile();

    // for now assume only enableNativeInOperator requires options to be processed
    if (!this.options.enableNativeInOperator) {
      return;
    }

    // for now hardcode enableNativeInOperator
    file.getFile().addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      isExported: !this.options.bundledFileGeneration,
      declarations: [
        {
          name: OPTIONS_STATEMENT,
          initializer: `{ nativeIn: true }`,
        },
      ],
    });
  }

  private generateEntityTypes() {
    return this.dataModel.getEntityTypes().map((model) => {
      const file = this.project.createOrGetQObjectFile(model.folderPath, model.qName, [
        model.qName,
        firstCharLowerCase(model.qName),
        model.id.qName,
      ]);

      // q object
      this.generateModel(file, model);

      // qId function
      if (!this.options.skipIdModels && model.generateId) {
        this.generateIdFunction(file, model);
      }

      // bound q operations
      if (!this.options.skipOperations) {
        [
          ...this.dataModel.getEntityTypeOperations(model.fqName),
          ...this.dataModel.getEntitySetOperations(model.fqName),
        ].forEach((operation) => {
          this.generateOperation(file, operation, model.fqName);
        });
      }

      return this.project.finalizeFile(file);
    });
  }

  private generateComplexTypes() {
    return this.dataModel.getComplexTypes().map((model) => {
      const file = this.project.createOrGetQObjectFile(model.folderPath, model.qName, [
        model.qName,
        firstCharLowerCase(model.qName),
      ]);

      this.generateModel(file, model);

      return this.project.finalizeFile(file);
    });
  }

  private getExtendsClauseForQObjects(model: ComplexType, imports: ImportContainer) {
    if (model.baseClasses.length) {
      const baseClass = model.baseClasses[0];
      const baseModel = this.dataModel.getModel(baseClass) as ComplexType;
      if (!baseModel) {
        throw new Error(`Entity or complex type "${baseClass}" from baseClass attribute not found!`);
      }
      return imports.addGeneratedQBaseObject(baseModel);
    }

    return imports.addQObject(QueryObjectImports.QueryObject);
  }

  private generateModel(file: FileHandler, model: ComplexType) {
    const imports = file.getImports();

    if (!model.qBaseName) {
      file.getFile().addClass({
        name: model.qName,
        isExported: true,
        extends: this.getExtendsClauseForQObjects(model, imports),
        properties: this.generateQueryObjectProps(file.getImports(), model.fqName, model.props),
      });
    } else {
      // base class used for extension needs an own file
      const baseFile = this.project.createOrGetQObjectFile(model.folderPath, model.qBaseName, [model.qBaseName]);
      baseFile.getFile().addClass({
        name: model.qBaseName,
        isExported: true,
        extends: this.getExtendsClauseForQObjects(model, baseFile.getImports()),
        properties: this.generateQueryObjectProps(baseFile.getImports(), model.fqName, model.props),
      });
      this.project.finalizeFile(baseFile);

      const [props, getAccessors, methods, statements] = Array.from(model.subtypes).reduce<
        [
          Array<string>,
          OptionalKind<GetAccessorDeclarationStructure>[],
          OptionalKind<MethodDeclarationStructure>[],
          Array<string>,
        ]
      >(
        (collector, subtype) => {
          const subClass = this.dataModel.getModel(subtype) as ComplexType;
          const subClassName = imports.addGeneratedQObject(subClass.fqName, subClass.qName);
          const methodName = `__as${subClass.qName}`;
          const enumerablePropDef = imports.addQObject(QueryObjectImports.ENUMERABLE_PROP_DEFINITION);

          collector[0].push(`"${subClass.fqName}": "${subClass.qName}"`);

          subClass.props.forEach((prop) => {
            if (prop.isStream) {
              return;
            }
            const propName = this.namingHelper.getQPropName(prop.name);
            const fqPropName = `${subClass.qName}_${propName}`;
            collector[1].push({
              name: fqPropName,
              scope: Scope.Public,
              statements: `return this.${methodName}().${propName};`,
            });
            collector[3].push(`${fqPropName}: ${enumerablePropDef}`);
          });

          collector[2].push({
            name: methodName,
            scope: Scope.Private,
            statements: `return new ${subClassName}(this.withPrefix("${subClass.fqName}"))`,
          });

          return collector;
        },
        [[], [], [], []],
      );

      file.getFile().addClass({
        name: model.qName,
        isExported: true,
        extends: imports.addGeneratedQBaseObject(model),
        properties: [
          {
            name: "__subtypeMapping",
            scope: Scope.Protected,
            isReadonly: true,
            initializer: `{ ${props.join(",")} }`,
          },
        ],
        getAccessors,
        methods,
      });

      file.getFile().addStatements(`Object.defineProperties(${model.qName}.prototype, { ${statements.join(",")} });`);
    }

    file.getFile().addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      isExported: true,
      declarations: [
        {
          name: firstCharLowerCase(model.qName),
          initializer: `new ${model.qName}()`,
        },
      ],
    });
  }

  private generateQueryObjectProps(
    importContainer: ImportContainer,
    ownerFqName: string,
    allProps: Array<PropertyModel>,
  ): Array<OptionalKind<PropertyDeclarationStructure>> {
    // stream properties get no q-path: filtering, ordering and the like do not apply to binary content,
    // and it is not part of the payload a q-object converts
    const props = allProps.filter((prop) => !prop.isStream);
    const isEnumType = (prop: PropertyModel) => prop.dataType === DataTypes.EnumType;
    const isModelType = (prop: PropertyModel) =>
      prop.dataType === DataTypes.ModelType || prop.dataType === DataTypes.ComplexType;
    // QBinaryPath is the one path without any comparison operators at all - it extends QNoopPath, whose
    // constructor takes the path and a converter and nothing else. So it cannot be handed options, and
    // there would be no point either: there is no `in` to render natively.
    const takesOptions = (prop: PropertyModel) =>
      !prop.isCollection && !isModelType(prop) && !isEnumType(prop) && prop.qPath !== "QBinaryPath";
    const addOptions = this.options.enableNativeInOperator; // limited to hardcoded enableNativeIn for now

    if (addOptions && props.some(takesOptions)) {
      importContainer.addFromMainQObject(OPTIONS_STATEMENT);
    }

    return props.map((prop) => {
      const { odataName } = prop;
      const name = this.namingHelper.getQPropName(prop.name);

      let qPathInit: string;

      // factor in collections
      if (prop.isCollection) {
        const qPath = importContainer.addQObject(prop.qPath);
        const qObject = isModelType(prop)
          ? importContainer.addGeneratedQObject(prop.fqType, prop.qObject!)
          : isEnumType(prop)
            ? importContainer.addGeneratedModel(prop.fqType, prop.type, false)
            : importContainer.addQObject(prop.qObject!);

        const binding = isEnumType(prop) ? "" : this.generateBindingStmt(importContainer, ownerFqName, prop);
        qPathInit = `new ${qPath}(this.withPrefix("${odataName}"), ${isEnumType(prop) ? qObject : `() => ${qObject}`}${binding})`;
      } else {
        // add import for data type
        const qPath = importContainer.addQObject(prop.qPath);
        if (isModelType(prop)) {
          const qObject = importContainer.addGeneratedQObject(prop.fqType, prop.qObject!);
          const binding = this.generateBindingStmt(importContainer, ownerFqName, prop);
          qPathInit = `new ${qPath}(this.withPrefix("${odataName}"), () => ${qObject}${binding})`;
        } else if (isEnumType(prop)) {
          const qObject = importContainer.addGeneratedModel(prop.fqType, prop.type, false);
          qPathInit = `new ${qPath}(this.withPrefix("${odataName}"), ${qObject})`;
        } else {
          let converterStmt = this.generateConverterStmt(importContainer, prop.converters);
          const addConverter = !!converterStmt;
          converterStmt = converterStmt || "undefined";

          qPathInit = `new ${qPath}(this.withPrefix("${odataName}")${
            addOptions && takesOptions(prop)
              ? `, ${converterStmt}, ${OPTIONS_STATEMENT}`
              : addConverter
                ? `, ${converterStmt}`
                : ""
          })`;
        }
      }

      return {
        name,
        scope: Scope.Public,
        isReadonly: true,
        initializer: qPathInit,
      } as OptionalKind<PropertyDeclarationStructure>;
    });
  }

  /**
   * The binding of a navigation property, which is what allows the editable models to state a binding by
   * the key of the referenced entity: the query object turns that key into the URL the wire notation asks
   * for, using the id function of the entity set the navigation property points to.
   *
   * Only generated where a service is generated - without one nothing would ever call the conversion, and
   * the models state the binding as it goes on the wire instead (see the model generator).
   *
   * @returns the constructor argument including its leading comma, or an empty string
   */
  private generateBindingStmt(importContainer: ImportContainer, ownerFqName: string, prop: PropertyModel): string {
    const generatesService = this.options.mode === Modes.service || this.options.mode === Modes.all;
    if (
      !generatesService ||
      this.options.disableBindingProps ||
      this.options.skipIdModels ||
      prop.dataType !== DataTypes.ModelType
    ) {
      return "";
    }

    const target = this.dataModel.getEntityType(prop.fqType);
    const targetSet = this.dataModel.getNavPropBindingTarget(ownerFqName, prop.odataName);
    if (!target?.generateId || !target.keyNames.length || !targetSet) {
      return "";
    }

    const qBinding = importContainer.addQObject(QueryObjectImports.QBinding);
    const qId = importContainer.addGeneratedQObject(target.id.fqName, target.id.qName);
    const notation = this.version === ODataVersions.V2 ? "V2" : this.options.odataVersionV4 === "4.01" ? "4.01" : "4.0";

    return `, new ${qBinding}(() => new ${qId}("${targetSet.odataName}"), "${notation}")`;
  }

  private generateConverterStmt(importContainer: ImportContainer, converters: Array<ValueConverterImport> | undefined) {
    if (!converters?.length) {
      return undefined;
    }
    const converterIds = converters.map((converter) => {
      return importContainer.addCustomType(converter.package, converter.converterId);
    });

    if (converterIds.length === 1) {
      return converterIds[0];
    } else {
      const createChain = importContainer.addCustomType("@odata2ts/converter-runtime", "createChain");

      const [first, second, ...moreConverters] = converterIds;
      return moreConverters.reduce((stmt, convId) => `${stmt}.chain(${convId})`, `${createChain}(${first}, ${second})`);
    }
  }

  private generateIdFunction(file: FileHandler, model: EntityType) {
    const importContainer = file.getImports();
    const qFunc = importContainer.addQObject(QueryObjectImports.QId);
    const idModelName = importContainer.addGeneratedModel(model.fqName, model.id.modelName);

    file.getFile().addClass({
      name: model.id.qName,
      isExported: true,
      extends: `${qFunc}<${idModelName}>`,
      properties: [
        {
          name: "params",
          scope: Scope.Private,
          isReadonly: true,
          initializer: this.getParamInitString(importContainer, model.keys),
        },
      ],
      methods: [
        {
          name: "getParams",
          statements: ["return this.params"],
        },
      ],
    });
  }

  private getParamInitString(
    importContainer: ImportContainer,
    props: Array<PropertyModel>,
    overloads?: Array<Array<PropertyModel>>,
  ) {
    const allParams = [props, ...(overloads ?? [])].map((paramSet) => {
      const pString = paramSet
        .map((prop) => {
          let complexQParam = "";
          if (prop.dataType === DataTypes.ModelType || prop.dataType === DataTypes.ComplexType) {
            const importedQObject = importContainer.addGeneratedQObject(prop.fqType, prop.qObject!);
            complexQParam = `, new ${importedQObject}()`;
          }

          const qParam = importContainer.addQObject(prop.qParam!);
          const isMappedNameNecessary = prop.odataName !== prop.name;
          const mappedName = isMappedNameNecessary
            ? `"${prop.name}"`
            : prop.converters?.length
              ? "undefined"
              : undefined;
          const converterStmt = this.generateConverterStmt(importContainer, prop.converters);
          const mappedNameParam = mappedName ? `, ${mappedName}` : "";
          const converterParam = converterStmt ? `, ${converterStmt}` : "";
          return `new ${qParam}("${prop.odataName}"${complexQParam}${mappedNameParam}${converterParam})`;
        })
        .join(",");
      return `[${pString}]`;
    });

    return allParams.length === 1 ? allParams[0] : `[${allParams.join(",")}]`;
  }

  private async generateUnboundOperations() {
    const unboundOps = this.dataModel.getUnboundOperationTypes();
    const reservedNames = unboundOps.map((op) => op.qName);
    const file = this.project.createOrGetMainQObjectFile(reservedNames);

    unboundOps.forEach((operation) => {
      this.generateOperation(file, operation, "");
    });
  }

  private generateOperation(file: FileHandler, operation: OperationType, baseFqName: string) {
    const imports = file.getImports();
    const isV2 = this.version === ODataVersions.V2;
    const returnType = operation.returnType;
    const hasParams = operation.parameters.length > 0 || operation.overrides?.length;
    const isParamsOptional = !![operation.parameters, ...(operation.overrides ?? [])].find((pSet) => pSet.length === 0);

    // imports
    const qOp =
      operation.type === OperationTypes.Action
        ? QueryObjectImports.QAction
        : isV2
          ? QueryObjectImports.QFunctionV2
          : QueryObjectImports.QFunctionV4;
    const qOperation = imports.addQObject(qOp);
    const paramModelName = hasParams ? imports.addGeneratedModel(baseFqName, operation.paramsModelName) : undefined;
    const rtType = !returnType
      ? undefined
      : returnType.type && returnType.dataType !== DataTypes.PrimitiveType
        ? imports.addGeneratedModel(returnType.fqType, returnType.type)
        : // a converter may map a primitive onto a type that lives in a module of its own (BigNumber,
          // DateTime, ...); without this the name is emitted but never imported and the q-object file
          // does not compile. Same handling as ModelGenerator applies to a converted property.
          returnType.typeModule
          ? imports.addCustomType(returnType.typeModule, returnType.type, true)
          : returnType.type;
    const responseStructure = returnType
      ? importReturnType(this.version, imports, returnType, this.isV2AsV4())
      : undefined;
    const completeResponseStructure = responseStructure && rtType ? `${responseStructure}<${rtType}>` : undefined;

    const asV4Arg = this.isV2AsV4() ? ", true" : "";

    let returnTypeOpStmt: string = "";
    if (returnType) {
      if (returnType.dataType === DataTypes.ComplexType || returnType.dataType === DataTypes.ModelType) {
        // without converter no conversion
        if (returnType.qObject) {
          returnTypeOpStmt = `new ${importMainResponseConverter(this.version, imports, returnType)}(new ${imports.addGeneratedQObject(returnType.fqType, returnType.qObject)}${asV4Arg})`;
        }
      }
      // Primitive Types: without converter no conversion
      else if (returnType.converters) {
        returnTypeOpStmt = `new ${importMainResponseConverter(this.version, imports, returnType)}(${this.generateConverterStmt(imports, returnType.converters)}${asV4Arg})`;
      }
    }

    const classWithGenerics = `${qOperation}<${hasParams ? paramModelName : "undefined"}${returnType ? ", " + completeResponseStructure : ""}>`;

    file.getFile().addClass({
      name: operation.qName,
      isExported: true,
      extends: classWithGenerics,
      properties: [
        {
          name: "params",
          scope: Scope.Private,
          isReadonly: true,
          type: hasParams ? undefined : "[]",
          initializer: this.getParamInitString(imports, operation.parameters, operation.overrides),
        },
      ],
      ctors: [
        {
          statements: [`super("${operation.odataName}"${returnTypeOpStmt ? ", " + returnTypeOpStmt : ""})`],
        },
      ],
      methods: [
        {
          name: "getParams",
          statements: ["return this.params"],
        },
        // functions without params: add an overriding buildUrl() to not force users to have to pass undefined as param
        ...(operation.type === OperationTypes.Function && !hasParams
          ? [
              {
                name: "buildUrl",
                parameters: [
                  {
                    name: "notEncoded",
                    initializer: "false",
                  },
                ],
                statements: ["return super.buildUrl(undefined, notEncoded)"],
              } as OptionalKind<MethodDeclarationStructure>,
            ]
          : []),
      ],
    });
  }
}
