import { ValueConverterImport } from "@odata2ts/converter-runtime";
import { ODataVersions } from "@odata2ts/odata-core";
import { OptionalKind, PropertyDeclarationStructure, Scope, VariableDeclarationKind } from "ts-morph";
import { firstCharLowerCase } from "xml2js/lib/processors";

import { DataModel } from "../data-model/DataModel";
import {
  ComplexType,
  DataTypes,
  EntityType,
  OperationType,
  OperationTypes,
  PropertyModel,
} from "../data-model/DataTypeModel";
import { NamingHelper } from "../data-model/NamingHelper";
import { EntityBasedGeneratorFunction, GeneratorFunctionOptions } from "../FactoryFunctionModel";
import { FileWrapper } from "../project/FileWrapper";
import { ProjectManager } from "../project/ProjectManager";
import { ImportContainer } from "./ImportContainer";

export const generateQueryObjects: EntityBasedGeneratorFunction = (
  project,
  dataModel,
  version,
  options,
  namingHelper
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
    private namingHelper: NamingHelper
  ) {}

  public async generate(): Promise<void> {
    this.project.initQObjects();

    // process EntityType & ComplexType
    const promises: Array<Promise<void>> = [...this.generateEntityTypes(), ...this.generateComplexTypes()];
    if (!this.options.skipOperations) {
      // process unbound operations
      promises.push(...this.generateUnboundOperations());
    }

    await Promise.all(promises);

    return this.project.finalizeQObjects();
  }

  private generateEntityTypes() {
    return this.dataModel.getEntityTypes().map((model) => {
      const file = this.project.createOrGetQObjectFile(model.folderPath, model.qName);

      this.generateModel(file, model);
      if (!this.options.skipIdModels && model.generateId) {
        this.generateIdFunction(file, model);
      }
      if (!this.options.skipOperations) {
        this.generateBoundOperations(file, model);
      }

      return this.project.finalizeFile(file);
    });
  }

  private generateComplexTypes() {
    return this.dataModel.getComplexTypes().map((model) => {
      const file = this.project.createOrGetQObjectFile(model.folderPath, model.qName);

      this.generateModel(file, model);

      return this.project.finalizeFile(file);
    });
  }

  private generateModel(file: FileWrapper, model: ComplexType) {
    const imports = file.getImports();

    let extendsClause: string;
    if (model.baseClasses.length) {
      const baseClass = model.baseClasses[0];
      const baseModel = this.dataModel.getModel(baseClass) as ComplexType;
      if (!baseModel) {
        throw new Error(`Entity or complex type "${baseClass}" from baseClass attribute not found!`);
      }
      extendsClause = imports.addGeneratedQObject(baseClass, baseModel.qName);
    } else {
      imports.addFromQObject("QueryObject");
      extendsClause = "QueryObject";
    }

    file.getFile().addClass({
      name: model.qName,
      isExported: true,
      extends: extendsClause,
      // isAbstract: model.abstract,
      properties: this.generateQueryObjectProps(file.getImports(), model.props),
    });

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
    props: Array<PropertyModel>
  ): Array<OptionalKind<PropertyDeclarationStructure>> {
    return props.map((prop) => {
      const { odataName } = prop;
      const name = this.namingHelper.getQPropName(prop.name);
      const isModelType = prop.dataType === DataTypes.ModelType || prop.dataType === DataTypes.ComplexType;
      let qPathInit: string;

      // factor in collections
      if (prop.isCollection) {
        const cType = `Q${isModelType ? "Entity" : ""}CollectionPath`;
        importContainer.addFromQObject(cType);
        let qObject: string;
        if (isModelType) {
          qObject = importContainer.addGeneratedQObject(prop.fqType, prop.qObject);
        } else {
          qObject = prop.qObject;
          importContainer.addFromQObject(qObject);
        }

        qPathInit = `new ${cType}(this.withPrefix("${odataName}"), () => ${qObject})`;
      } else {
        if (isModelType) {
          importContainer.addGeneratedQObject(prop.fqType, prop.qObject!);
          qPathInit = `new ${prop.qPath}(this.withPrefix("${odataName}"), () => ${prop.qObject!})`;
        } else {
          let converterStmt = this.generateConverterStmt(importContainer, prop.converters);
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

  private generateConverterStmt(importContainer: ImportContainer, converters: Array<ValueConverterImport> | undefined) {
    if (!converters?.length) {
      return undefined;
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

  private generateIdFunction(file: FileWrapper, model: EntityType) {
    const qFunc = "QId";
    const importContainer = file.getImports();
    importContainer.addFromQObject(qFunc);
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

  private getParamInitString(importContainer: ImportContainer, props: Array<PropertyModel>) {
    return `[${props
      .map((prop) => {
        const isComplexParam = prop.dataType === DataTypes.ModelType || prop.dataType === DataTypes.ComplexType;
        if (prop.qParam) {
          importContainer.addFromQObject(prop.qParam);
        }
        const isMappedNameNecessary = prop.odataName !== prop.name;
        const mappedName = isMappedNameNecessary ? `"${prop.name}"` : prop.converters?.length ? "undefined" : undefined;
        const converterStmt = this.generateConverterStmt(importContainer, prop.converters);
        const mappedNameParam = mappedName ? `, ${mappedName}` : "";
        const complexQParam = isComplexParam ? `, new ${prop.qObject}()` : "";
        const converterParam = converterStmt ? `, ${converterStmt}` : "";
        return `new ${prop.qParam}("${prop.odataName}"${complexQParam}${mappedNameParam}${converterParam})`;
      })
      .join(",")}]`;
  }

  private generateUnboundOperations() {
    return this.dataModel.getUnboundOperationTypes().map((operation) => {
      const file = this.project.createOrGetQObjectFile(operation.folderPath, operation.qName);

      this.generateOperation(file, operation, operation.fqName);

      return this.project.finalizeFile(file);
    });
  }

  private generateBoundOperations(file: FileWrapper, model: EntityType) {
    return [
      ...this.dataModel.getEntityTypeOperations(model.fqName),
      ...this.dataModel.getEntitySetOperations(model.fqName),
    ].map((operation) => {
      this.generateOperation(file, operation, model.fqName);
    });
  }

  private generateOperation(file: FileWrapper, operation: OperationType, baseFqName: string) {
    const imports = file.getImports();
    const isV2 = this.version === ODataVersions.V2;
    const qOperation = operation.type === OperationTypes.Action ? "QAction" : "QFunction";
    const returnType = operation.returnType;
    let returnTypeOpStmt: string = "";
    const hasParams = operation.parameters.length > 0;

    // imports
    const paramModelName = operation.parameters.length
      ? imports.addGeneratedModel(baseFqName, operation.paramsModelName)
      : undefined;

    imports.addFromQObject(qOperation);
    if (returnType) {
      if (returnType.dataType === DataTypes.ComplexType || returnType.dataType === DataTypes.ModelType) {
        if (returnType.qObject) {
          imports.addFromQObject("OperationReturnType", "ReturnTypes", "QComplexParam");
          const returnQName = imports.addGeneratedQObject(returnType.fqType, returnType.qObject);
          returnTypeOpStmt = `new OperationReturnType(ReturnTypes.COMPLEX${
            returnType.isCollection ? "_COLLECTION" : ""
          }, new QComplexParam("NONE", new ${returnQName}))`;
        }
      }
      // currently, it only makes sense to add the OperationReturnType if a converter is present
      else if (returnType.converters && returnType.qParam) {
        imports.addFromQObject("OperationReturnType", "ReturnTypes", returnType.qParam);
        const rtKind = "ReturnTypes.VALUE" + (returnType.isCollection ? "_COLLECTION" : "");
        const converterParam = returnType.converters
          ? ", " + this.generateConverterStmt(imports, returnType.converters)
          : "";
        returnTypeOpStmt = `new OperationReturnType(${rtKind}, new ${returnType.qParam}("NONE", undefined${converterParam}))`;
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
          type: operation.parameters?.length ? undefined : "[]",
          initializer: this.getParamInitString(imports, operation.parameters),
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
