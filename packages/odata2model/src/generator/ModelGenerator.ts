import { SourceFile } from "ts-morph";

import { ODataVesions } from "../app";
import { DataModel } from "../data-model/DataModel";
import { ComplexType, DataTypes, ModelType, OperationType, PropertyModel } from "../data-model/DataTypeModel";
import { EntityBasedGeneratorFunction } from "../FactoryFunctionModel";
import { GenerationOptions } from "../OptionModel";
import { ModelImportContainer } from "./ModelImportContainer";

export const generateModels: EntityBasedGeneratorFunction = (dataModel, sourceFile, version, options) => {
  const generator = new ModelGenerator(dataModel, sourceFile, version, options);
  return generator.generate();
};

const DEFERRED_CONTENT = "DeferredContent";

class ModelGenerator {
  constructor(
    private dataModel: DataModel,
    private sourceFile: SourceFile,
    private version: ODataVesions,
    private options: GenerationOptions | undefined
  ) {}

  public generate(): void {
    const importContainer = new ModelImportContainer();

    this.generateEnums();
    this.generateModels(importContainer);
    if (!this.options?.skipOperationModel) {
      this.generateUnboundOperationParams(importContainer);
    }
  }

  private generateEnums() {
    this.dataModel.getEnums().forEach((et) => {
      this.sourceFile.addEnum({
        name: et.name,
        isExported: true,
        members: et.members.map((mem) => ({ name: mem, initializer: `"${mem}"` })),
      });
    });
  }

  private generateModels(importContainer: ModelImportContainer) {
    this.dataModel.getModels().forEach((model) => {
      this.generateModel(model, importContainer);
      if (!this.options?.skipIdModel) {
        this.generateIdModel(model, importContainer);
      }
      if (!this.options?.skipEditableModel) {
        this.generateEditableModel(model, importContainer);
      }
      if (!this.options?.skipOperationModel) {
        this.generateBoundOperationParams(model.name, importContainer);
      }
    });
    this.dataModel.getComplexTypes().forEach((model) => {
      this.generateModel(model, importContainer);
      if (!this.options?.skipEditableModel) {
        this.generateEditableModel(model, importContainer);
      }
    });

    this.sourceFile.addImportDeclarations(importContainer.getImportDeclarations());
  }

  private generateModel(model: ComplexType, importContainer: ModelImportContainer) {
    this.sourceFile.addInterface({
      name: model.name,
      isExported: true,
      properties: model.props.map((p) => {
        const isEntity = p.dataType == DataTypes.ModelType;
        return {
          name: p.odataName, // todo: map to lowercase
          type: this.getPropType(p, importContainer),
          // props for entities or entity collections are not added in V4 if not explicitly expanded
          hasQuestionToken: this.dataModel.isV4() && isEntity,
        };
      }),
      extends: model.baseClasses,
    });
  }

  private getPropType(prop: PropertyModel, importContainer: ModelImportContainer): string {
    const isEntity = prop.dataType == DataTypes.ModelType;

    // V2 entity special: deferred content
    let suffix = "";
    if (isEntity && this.dataModel.isV2()) {
      importContainer.addFromService(DEFERRED_CONTENT);
      suffix = ` | ${DEFERRED_CONTENT}`;
    }

    // Collections
    if (prop.isCollection) {
      return `Array<${prop.type}>` + suffix;
    }

    // primitive, enum & complex types
    return prop.type + (prop.required ? "" : " | null") + suffix;
  }

  private generateIdModel(model: ModelType, importContainer: ModelImportContainer) {
    const singleType = model.keys.length === 1 ? `${model.keys[0].type} | ` : "";
    const keyTypes = model.keys
      .map((keyProp) => `${keyProp.odataName}: ${this.getPropType(keyProp, importContainer)}`)
      .join(",");
    const type = `${singleType}{${keyTypes}}`;

    this.sourceFile.addTypeAlias({
      name: model.idModelName,
      isExported: true,
      type,
    });
  }

  private generateEditableModel(model: ComplexType, importContainer: ModelImportContainer) {
    const entityTypes = [DataTypes.ModelType, DataTypes.ComplexType];
    const allProps = [...model.props, ...model.baseProps];

    const requiredProps = allProps
      .filter((p) => p.required && !entityTypes.includes(p.dataType))
      .map((p) => `"${p.odataName}"`)
      .join(" | ");
    const optionalProps = allProps
      .filter((p) => !p.required && !entityTypes.includes(p.dataType))
      .map((p) => `"${p.odataName}"`)
      .join(" | ");
    const complexProps = allProps.filter((p) => p.dataType === DataTypes.ComplexType);

    const extendsClause = [
      requiredProps ? `Pick<${model.name}, ${requiredProps}>` : null,
      optionalProps ? `Partial<Pick<${model.name}, ${optionalProps}>>` : null,
    ].filter((e): e is string => !!e);

    this.sourceFile.addInterface({
      name: this.dataModel.getEditableModelName(model.name),
      isExported: true,
      extends: extendsClause,
      properties: !complexProps
        ? undefined
        : complexProps.map((p) => {
            return {
              name: p.odataName,
              type: this.getEditablePropType(p, importContainer),
              // optional props don't need to be specified in editable model
              // also, entities would require deep insert func => we make it optional for now
              hasQuestionToken: !p.required || p.dataType === DataTypes.ModelType,
            };
          }),
    });
  }

  private getEditablePropType(prop: PropertyModel, importContainer: ModelImportContainer): string {
    const isEditableModel = [DataTypes.ModelType, DataTypes.ComplexType].includes(prop.dataType);
    let type = isEditableModel ? this.dataModel.getEditableModelName(prop.type) : prop.type;

    // Collections
    if (prop.isCollection) {
      return `Array<${type}>`;
    }

    // primitive, enum & complex types
    return type + (prop.required ? "" : " | null");
  }

  private generateUnboundOperationParams(importContainer: ModelImportContainer) {
    this.dataModel.getUnboundOperationTypes().forEach((operation) => {
      this.generateOperationParams(operation, importContainer);
    });
  }

  private generateBoundOperationParams(entityName: string, importContainer: ModelImportContainer) {
    this.dataModel.getOperationTypeByBinding(entityName).forEach((operation) => {
      this.generateOperationParams(operation, importContainer);
    });
  }

  private generateOperationParams(operation: OperationType, importContainer: ModelImportContainer) {
    if (!operation.parameters.length) {
      return;
    }
    this.sourceFile.addInterface({
      name: operation.paramsModelName,
      isExported: true,
      properties: operation.parameters.map((p) => {
        return {
          name: p.odataName,
          type: this.getPropType(p, importContainer),
          hasQuestionToken: !p.required,
        };
      }),
    });
  }
}
