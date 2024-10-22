import { ValueConverterImport } from "@odata2ts/converter-runtime";
import { ODataVersions } from "@odata2ts/odata-core";
import {
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
import { FileHandler } from "../project/FileHandler.js";
import { ProjectManager } from "../project/ProjectManager.js";
import { QueryObjectImports } from "./import/ImportObjects.js";
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

class QueryObjectGenerator {
  constructor(
    private project: ProjectManager,
    private dataModel: DataModel,
    private version: ODataVersions,
    private options: GeneratorFunctionOptions,
    private namingHelper: NamingHelper,
  ) {}

  public async generate(): Promise<void> {
    this.project.initQObjects();

    // process EntityType & ComplexType
    const promises: Array<Promise<void>> = [...this.generateEntityTypes(), ...this.generateComplexTypes()];
    if (!this.options.skipOperations) {
      // process unbound operations
      promises.push(this.generateUnboundOperations());
    }

    await Promise.all(promises);

    return this.project.finalizeQObjects();
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

  private generateModel(file: FileHandler, model: ComplexType) {
    const imports = file.getImports();
    const properties = this.generateQueryObjectProps(file.getImports(), model.props);

    let extendsClause: string;
    if (model.baseClasses.length) {
      const baseClass = model.baseClasses[0];
      const baseModel = this.dataModel.getModel(baseClass) as ComplexType;
      if (!baseModel) {
        throw new Error(`Entity or complex type "${baseClass}" from baseClass attribute not found!`);
      }
      extendsClause = imports.addGeneratedQObject(baseClass, baseModel.qBaseName!);
    } else {
      extendsClause = imports.addQObject(QueryObjectImports.QueryObject);
    }

    if (model.qBaseName) {
      file.getFile().addClass({
        name: model.qBaseName,
        isExported: true,
        extends: extendsClause,
        properties,
      });

      file.getFile().addClass({
        name: model.qName,
        isExported: true,
        extends: model.qBaseName,
        properties: Array.from(model.subtypes).map((subtype) => {
          const subClass = this.dataModel.getModel(subtype) as ComplexType;
          return {
            name: `as${subClass.qName}`,
            scope: Scope.Public,
            isReadonly: true,
            initializer: `new ${subClass.qName}(this.withPrefix("${subClass.fqName}"))`,
          } as OptionalKind<PropertyDeclarationStructure>;
        }),
      });
    } else {
      file.getFile().addClass({
        name: model.qName,
        isExported: true,
        extends: extendsClause,
        properties: properties,
      });
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
    props: Array<PropertyModel>,
  ): Array<OptionalKind<PropertyDeclarationStructure>> {
    return props.map((prop) => {
      const { odataName } = prop;
      const name = this.namingHelper.getQPropName(prop.name);
      const isModelType = prop.dataType === DataTypes.ModelType || prop.dataType === DataTypes.ComplexType;
      const isEnumType = prop.dataType === DataTypes.EnumType;
      const isNumericEnum = this.options.numericEnums;

      let qPathInit: string;

      // factor in collections
      if (prop.isCollection) {
        const qPath = importContainer.addQObject(
          isModelType
            ? QueryObjectImports.QEntityCollectionPath
            : isEnumType
              ? isNumericEnum
                ? QueryObjectImports.QNumericEnumCollectionPath
                : QueryObjectImports.QEnumCollectionPath
              : QueryObjectImports.QCollectionPath,
        );
        const qObject = isModelType
          ? importContainer.addGeneratedQObject(prop.fqType, prop.qObject!)
          : isEnumType
            ? importContainer.addGeneratedModel(prop.fqType, prop.type, false)
            : importContainer.addQObject(prop.qObject!);

        qPathInit = `new ${qPath}(this.withPrefix("${odataName}"), ${isEnumType ? qObject : `() => ${qObject}`})`;
      } else {
        // add import for data type
        const qPath = importContainer.addQObject(prop.qPath);
        if (isModelType) {
          const qObject = importContainer.addGeneratedQObject(prop.fqType, prop.qObject!);
          qPathInit = `new ${qPath}(this.withPrefix("${odataName}"), () => ${qObject})`;
        } else if (isEnumType) {
          const qObject = importContainer.addGeneratedModel(prop.fqType, prop.type, false);
          qPathInit = `new ${qPath}(this.withPrefix("${odataName}"), ${qObject})`;
        } else {
          let converterStmt = this.generateConverterStmt(importContainer, prop.converters);
          qPathInit = `new ${qPath}(this.withPrefix("${odataName}")${converterStmt ? `, ${converterStmt}` : ""})`;
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
    const qOp = operation.type === OperationTypes.Action ? QueryObjectImports.QAction : QueryObjectImports.QFunction;
    const qOperation = imports.addQObject(qOp);
    const paramModelName = hasParams ? imports.addGeneratedModel(baseFqName, operation.paramsModelName) : undefined;

    let returnTypeOpStmt: string = "";
    if (returnType) {
      const collectionSuffix = returnType.isCollection ? "_COLLECTION" : "";
      if (returnType.dataType === DataTypes.ComplexType || returnType.dataType === DataTypes.ModelType) {
        if (returnType.qObject) {
          const opRt = imports.addQObject(QueryObjectImports.OperationReturnType);
          const rts = imports.addQObject(QueryObjectImports.ReturnTypes);
          const qComplexParam = imports.addQObject(QueryObjectImports.QComplexParam);
          const returnQName = imports.addGeneratedQObject(returnType.fqType, returnType.qObject);

          returnTypeOpStmt = `new ${opRt}(${rts}.COMPLEX${collectionSuffix}, new ${qComplexParam}("NONE", new ${returnQName}))`;
        }
      }
      // currently, it only makes sense to add the OperationReturnType if a converter is present
      else if (returnType.converters && returnType.qParam) {
        const rtClass = imports.addQObject(QueryObjectImports.OperationReturnType);
        const rtTypes = imports.addQObject(QueryObjectImports.ReturnTypes);
        const qParam = imports.addQObject(returnType.qParam);

        // TODO: some constants with string concat
        const rtKind = `${rtTypes}.VALUE${collectionSuffix}`;

        const converterParam = returnType.converters
          ? ", " + this.generateConverterStmt(imports, returnType.converters)
          : "";
        returnTypeOpStmt = `new ${rtClass}(${rtKind}, new ${qParam}("NONE", undefined${converterParam}))`;
      }
    }

    file.getFile().addClass({
      name: operation.qName,
      isExported: true,
      extends: qOperation + (hasParams ? `<${paramModelName}>` : ""),
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
          statements: [
            `super("${operation.odataName}"${returnTypeOpStmt ? ", " + returnTypeOpStmt : isV2 ? ", undefined" : ""}${
              isV2 ? ", { v2Mode: true }" : ""
            })`,
          ],
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
