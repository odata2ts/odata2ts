import { ValueConverterImport } from "@odata2ts/converter-runtime";
import { ODataVersions } from "@odata2ts/odata-core";
import { OptionalKind, PropertyDeclarationStructure, Scope, SourceFile, VariableDeclarationKind } from "ts-morph";
import { firstCharLowerCase } from "xml2js/lib/processors";

import { DataModel } from "../data-model/DataModel";
import {
  ComplexType,
  DataTypes,
  ModelType,
  OperationType,
  OperationTypes,
  PropertyModel,
} from "../data-model/DataTypeModel";
import { NamingHelper } from "../data-model/NamingHelper";
import { EntityBasedGeneratorFunction, GeneratorFunctionOptions } from "../FactoryFunctionModel";
import { ImportContainer } from "./ImportContainer";

export const generateQueryObjects: EntityBasedGeneratorFunction = (
  dataModel,
  sourceFile,
  version,
  options,
  namingHelper
) => {
  const generator = new QueryObjectGenerator(dataModel, sourceFile, version, options, namingHelper);
  return generator.generate();
};

class QueryObjectGenerator {
  constructor(
    private dataModel: DataModel,
    private sourceFile: SourceFile,
    private version: ODataVersions,
    private options: GeneratorFunctionOptions,
    private namingHelper: NamingHelper
  ) {}

  public generate(): void {
    const importContainer = new ImportContainer(this.namingHelper.getFileNames());

    this.generateModels(importContainer);
    if (!this.options.skipOperations) {
      this.generateUnboundOperations(importContainer);
    }

    this.sourceFile.addImportDeclarations(importContainer.getImportDeclarations(false));
  }

  private generateModels(importContainer: ImportContainer) {
    this.dataModel.getModels().forEach((model) => {
      this.generateModel(model, importContainer);
      if (!this.options.skipIdModels) {
        this.generateIdFunction(model, importContainer);
      }
      if (!this.options.skipOperations) {
        this.generateBoundOperations(model.name, importContainer);
      }
    });
    this.dataModel.getComplexTypes().forEach((model) => {
      this.generateModel(model, importContainer);
    });

    if (this.dataModel.getModels().length || this.dataModel.getComplexTypes().length) {
      importContainer.addFromQObject("QueryObject");
    }
  }

  private generateModel(model: ComplexType, importContainer: ImportContainer) {
    let extendsClause = "QueryObject";
    if (model.baseClasses.length) {
      const baseClass = model.baseClasses[0];
      const baseModel = this.dataModel.getModel(baseClass) || this.dataModel.getComplexType(baseClass);
      extendsClause = baseModel.qName;
    }

    this.sourceFile.addClass({
      name: model.qName,
      isExported: true,
      extends: extendsClause,
      properties: this.generateQueryObjectProps(model.props, importContainer),
    });

    this.sourceFile.addVariableStatement({
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
    props: Array<PropertyModel>,
    importContainer: ImportContainer
  ): Array<OptionalKind<PropertyDeclarationStructure>> {
    return props.map((prop) => {
      const { odataName } = prop;
      const name = this.namingHelper.getQPropName(prop.name);
      const isModelType = prop.dataType === DataTypes.ModelType || prop.dataType === DataTypes.ComplexType;
      let qPathInit: string;

      // factor in collections
      if (prop.isCollection) {
        const cType = `Q${isModelType ? "Entity" : ""}CollectionPath`;
        const qObject = prop.qObject;

        if (!qObject) {
          throw new Error("QObject for collection is missing!");
        }

        qPathInit = `new ${cType}(this.withPrefix("${odataName}"), () => ${qObject})`;

        importContainer.addFromQObject(cType);
        if (!isModelType) {
          importContainer.addFromQObject(qObject);
        }
      } else {
        if (isModelType) {
          qPathInit = `new ${prop.qPath}(this.withPrefix("${odataName}"), () => ${prop.qObject!})`;
        } else {
          let converterStmt = this.generateConverterStmt(prop.converters, importContainer);
          qPathInit = `new ${prop.qPath}(this.withPrefix("${odataName}")${converterStmt ? `, ${converterStmt}` : ""})`;
        }
        // add import for data type
        importContainer.addFromQObject(prop.qPath);
      }

      return {
        name,
        scope: Scope.Public,
        isReadonly: true,
        initializer: qPathInit,
      } as OptionalKind<PropertyDeclarationStructure>;
    });
  }

  private generateConverterStmt(converters: Array<ValueConverterImport> | undefined, importContainer: ImportContainer) {
    if (!converters?.length) {
      return;
    }
    converters.forEach((converter) => {
      importContainer.addCustomType(converter.package, converter.converterId);
    });

    if (converters.length === 1) {
      return converters[0].converterId;
    } else {
      importContainer.addCustomType("@odata2ts/converter-runtime", "createChain");

      const [first, second, ...moreConverters] = converters;
      return moreConverters.reduce(
        (stmt, conv) => `${stmt}.chain(${conv.converterId})`,
        `createChain(${first.converterId}, ${second.converterId})`
      );
    }
  }

  private generateIdFunction(model: ModelType, importContainer: ImportContainer) {
    if (!model.generateId) {
      return;
    }

    const qFunc = "QId";
    importContainer.addFromQObject(qFunc);
    importContainer.addGeneratedModel(model.idModelName);

    this.sourceFile.addClass({
      name: model.qIdFunctionName,
      isExported: true,
      extends: `${qFunc}<${model.idModelName}>`,
      properties: [
        {
          name: "params",
          scope: Scope.Private,
          isReadonly: true,
          initializer: this.getParamInitString(model.keys, importContainer),
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

  private getParamInitString(props: Array<PropertyModel>, importContainer: ImportContainer) {
    return `[${props
      .map((prop) => {
        const isComplexParam = prop.dataType === DataTypes.ModelType || prop.dataType === DataTypes.ComplexType;
        if (prop.qParam) {
          importContainer.addFromQObject(prop.qParam);
        }
        const isMappedNameNecessary = prop.odataName !== prop.name;
        const mappedName = isMappedNameNecessary ? `"${prop.name}"` : prop.converters?.length ? "undefined" : undefined;
        const converterStmt = this.generateConverterStmt(prop.converters, importContainer);
        const mappedNameParam = mappedName ? `, ${mappedName}` : "";
        const complexQParam = isComplexParam ? `, new ${prop.qObject}()` : "";
        const converterParam = converterStmt ? `, ${converterStmt}` : "";
        return `new ${prop.qParam}("${prop.odataName}"${complexQParam}${mappedNameParam}${converterParam})`;
      })
      .join(",")}]`;
  }

  private generateUnboundOperations(importContainer: ImportContainer) {
    this.dataModel.getUnboundOperationTypes().forEach((operation) => {
      this.generateOperation(operation, importContainer);
    });
  }

  private generateBoundOperations(bindingName: string, importContainer: ImportContainer) {
    this.dataModel.getOperationTypeByEntityOrCollectionBinding(bindingName).forEach((operation) => {
      this.generateOperation(operation, importContainer);
    });
  }

  private generateOperation(operation: OperationType, importContainer: ImportContainer) {
    const isV2 = this.version === ODataVersions.V2;
    const qOperation = operation.type === OperationTypes.Action ? "QAction" : "QFunction";
    const returnType = operation.returnType;
    let returnTypeOpStmt: string = "";
    const hasParams = operation.parameters.length > 0;
    importContainer.addFromQObject(qOperation);
    if (hasParams) {
      importContainer.addGeneratedModel(operation.paramsModelName);
    }
    if (returnType) {
      if (returnType.dataType === DataTypes.ComplexType || returnType.dataType === DataTypes.ModelType) {
        if (returnType.qObject) {
          importContainer.addFromQObject("OperationReturnType", "ReturnTypes", "QComplexParam");
          returnTypeOpStmt = `new OperationReturnType(ReturnTypes.COMPLEX${
            returnType.isCollection ? "_COLLECTION" : ""
          }, new QComplexParam("NONE", new ${returnType.qObject}))`;
        }
      }
      // currently, it only makes sense to add the OperationReturnType if a converter is present
      else if (returnType.converters && returnType.qParam) {
        importContainer.addFromQObject("OperationReturnType", "ReturnTypes", returnType.qParam);
        const rtKind = "ReturnTypes.VALUE" + (returnType.isCollection ? "_COLLECTION" : "");
        const converterParam = returnType.converters
          ? ", " + this.generateConverterStmt(returnType.converters, importContainer)
          : "";
        returnTypeOpStmt = `new OperationReturnType(${rtKind}, new ${returnType.qParam}("NONE", undefined${converterParam}))`;
      }
    }

    this.sourceFile.addClass({
      name: operation.qName,
      isExported: true,
      extends: qOperation + (hasParams ? `<${operation.paramsModelName}>` : ""),
      properties: [
        {
          name: "params",
          scope: Scope.Private,
          isReadonly: true,
          type: operation.parameters?.length ? undefined : "[]",
          initializer: this.getParamInitString(operation.parameters, importContainer),
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
                statements: ["return super.buildUrl(undefined)"],
              },
            ]
          : []),
      ],
    });
  }
}
