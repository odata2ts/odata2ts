import { OptionalKind, PropertyDeclarationStructure, Scope, SourceFile, VariableDeclarationKind } from "ts-morph";
import { firstCharLowerCase } from "xml2js/lib/processors";

import { ODataVesions } from "../app";
import { DataModel } from "../data-model/DataModel";
import {
  ComplexType,
  DataTypes,
  ModelType,
  OperationType,
  OperationTypes,
  PropertyModel,
} from "../data-model/DataTypeModel";
import { EntityBasedGeneratorFunction } from "../FactoryFunctionModel";
import { GenerationOptions } from "../OptionModel";
import { ImportContainer } from "./ImportContainer";

export const generateQueryObjects: EntityBasedGeneratorFunction = (dataModel, sourceFile, version, options) => {
  const generator = new QueryObjectGenerator(dataModel, sourceFile, version, options);
  return generator.generate();
};

class QueryObjectGenerator {
  constructor(
    private dataModel: DataModel,
    private sourceFile: SourceFile,
    private version: ODataVesions,
    private options: GenerationOptions | undefined
  ) {}

  public generate(): void {
    const importContainer = new ImportContainer(this.dataModel);

    this.generateModels(importContainer);
    if (!this.options?.skipOperationModel) {
      this.generateUnboundOperations(importContainer);
    }

    this.sourceFile.addImportDeclarations(importContainer.getImportDeclarations(false));
  }

  private generateModels(importContainer: ImportContainer) {
    this.dataModel.getModels().forEach((model) => {
      this.generateModel(model, importContainer);
      if (!this.options?.skipIdModel) {
        this.generateIdFunction(model, importContainer);
      }
      if (!this.options?.skipOperationModel) {
        this.generateBoundOperations(model.odataName, importContainer);
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
    this.sourceFile.addClass({
      name: model.qName,
      isExported: true,
      extends: "QueryObject",
      properties: this.generateQueryObjectProps([...model.baseProps, ...model.props], importContainer),
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
      const { name, odataName } = prop;
      const isModelType = prop.dataType === DataTypes.ModelType || prop.dataType === DataTypes.ComplexType;
      let qPathInit: string;

      if (isModelType) {
        qPathInit = `new ${prop.qPath}(this.withPrefix("${odataName}"), () => ${prop.qObject!})`;
      } else {
        qPathInit = `new ${prop.qPath}(this.withPrefix("${odataName}"))`;
      }

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
      }

      // add import for data type
      importContainer.addFromQObject(prop.qPath);

      return {
        name,
        scope: Scope.Public,
        isReadonly: true,
        initializer: qPathInit,
      } as OptionalKind<PropertyDeclarationStructure>;
    });
  }

  private generateIdFunction(model: ModelType, importContainer: ImportContainer) {
    const qFunc = "QFunction";
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
      ctors: [
        {
          parameters: [{ name: "path", type: "string" }],
          statements: [`super(path, "${model.odataName}"${this.version === ODataVesions.V2 ? ", true" : ""})`],
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
        if (prop.qParam) {
          importContainer.addFromQObject(prop.qParam);
        }
        const isMappedNameNecessary = prop.odataName !== prop.name;
        return `new ${prop.qParam}("${prop.odataName}"${isMappedNameNecessary ? `, "${prop.name}"` : ""})`;
      })
      .join(",")}]`;
  }

  private generateUnboundOperations(importContainer: ImportContainer) {
    this.dataModel.getUnboundOperationTypes().forEach((operation) => {
      this.generateOperation(operation, importContainer);
    });
  }

  private generateBoundOperations(bindingName: string, importContainer: ImportContainer) {
    this.dataModel.getOperationTypeByBinding(bindingName).forEach((operation) => {
      this.generateOperation(operation, importContainer);
    });
  }

  private generateOperation(operation: OperationType, importContainer: ImportContainer) {
    const qOperation = operation.type === OperationTypes.Action ? "QAction" : "QFunction";
    const hasParams = operation.parameters.length > 0;
    importContainer.addFromQObject(qOperation);
    if (hasParams) {
      importContainer.addGeneratedModel(operation.paramsModelName);
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
          initializer: this.getParamInitString(operation.parameters, importContainer),
        },
      ],
      ctors: [
        {
          parameters: [{ name: "path", type: "string" }],
          statements: [`super(path, "${operation.odataName}"${this.version === ODataVesions.V2 ? ", true" : ""})`],
        },
      ],
      methods: [
        {
          name: "getParams",
          statements: ["return this.params"],
        },
        ...(hasParams
          ? []
          : [
              {
                name: "buildUrl",
                statements: ["return super.buildUrl(undefined)"],
              },
            ]),
      ],
    });
  }
}
