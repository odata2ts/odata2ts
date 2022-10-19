import { ODataVersions } from "@odata2ts/odata-core";
import { SourceFile } from "ts-morph";

import { DataModel } from "../data-model/DataModel";
import { ComplexType, DataTypes, ModelType, OperationType, PropertyModel } from "../data-model/DataTypeModel";
import { EntityBasedGeneratorFunction } from "../FactoryFunctionModel";
import { GenerationOptions } from "../OptionModel";
import { ImportContainer } from "./ImportContainer";

export const generateModels: EntityBasedGeneratorFunction = (dataModel, sourceFile, version, options) => {
  const generator = new ModelGenerator(dataModel, sourceFile, version, options);
  return generator.generate();
};

const DEFERRED_CONTENT = "DeferredContent";

class ModelGenerator {
  private importContainer!: ImportContainer;

  constructor(
    private dataModel: DataModel,
    private sourceFile: SourceFile,
    private version: ODataVersions,
    private options: GenerationOptions | undefined
  ) {}

  public generate(): void {
    this.importContainer = new ImportContainer(this.dataModel.getFileNames());

    this.generateEnums();
    this.generateModels();
    if (!this.options?.skipOperationModel) {
      this.generateUnboundOperationParams();
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

  private generateModels() {
    this.dataModel.getModels().forEach((model) => {
      this.generateModel(model);
      if (!this.options?.skipIdModel) {
        this.generateIdModel(model);
      }
      if (!this.options?.skipEditableModel) {
        this.generateEditableModel(model);
      }
      if (!this.options?.skipOperationModel) {
        this.generateBoundOperationParams(model.name);
      }
    });
    this.dataModel.getComplexTypes().forEach((model) => {
      this.generateModel(model);
      if (!this.options?.skipEditableModel) {
        this.generateEditableModel(model);
      }
    });

    this.sourceFile.addImportDeclarations(this.importContainer.getImportDeclarations());
  }

  private generateModel(model: ComplexType) {
    this.sourceFile.addInterface({
      name: model.name,
      isExported: true,
      properties: model.props.map((p) => {
        const isEntity = p.dataType == DataTypes.ModelType;
        return {
          name: p.odataName, // todo: map to lowercase
          type: this.getPropType(p),
          // props for entities or entity collections are not added in V4 if not explicitly expanded
          hasQuestionToken: this.dataModel.isV4() && isEntity,
        };
      }),
      extends: model.baseClasses,
    });
  }

  private getPropType(prop: PropertyModel): string {
    const isEntity = prop.dataType == DataTypes.ModelType;

    // V2 entity special: deferred content
    let suffix = "";
    if (isEntity && this.dataModel.isV2()) {
      this.importContainer.addFromService(DEFERRED_CONTENT);
      suffix = ` | ${DEFERRED_CONTENT}`;
    }
    // custom types which require type imports => possible via converters
    else if (prop.typeModule) {
      this.importContainer.addCustomType(prop.typeModule, prop.type);
    }

    // Collections
    if (prop.isCollection) {
      return `Array<${prop.type}>` + suffix;
    }

    // primitive, enum & complex types
    return prop.type + (prop.required ? "" : " | null") + suffix;
  }

  private generateIdModel(model: ModelType) {
    if (!model.generateId) {
      return;
    }
    const singleType = model.keys.length === 1 ? `${model.keys[0].type} | ` : "";
    const keyTypes = model.keys.map((keyProp) => `${keyProp.odataName}: ${this.getPropType(keyProp)}`).join(",");
    const type = `${singleType}{${keyTypes}}`;

    this.sourceFile.addTypeAlias({
      name: model.idModelName,
      isExported: true,
      type,
    });
  }

  private generateEditableModel(model: ComplexType) {
    const entityTypes = [DataTypes.ModelType, DataTypes.ComplexType];
    const allProps = [...model.baseProps, ...model.props];

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
              type: this.getEditablePropType(p),
              // optional props don't need to be specified in editable model
              // also, entities would require deep insert func => we make it optional for now
              hasQuestionToken: !p.required || p.dataType === DataTypes.ModelType,
            };
          }),
    });
  }

  private getEditablePropType(prop: PropertyModel): string {
    const isEditableModel = [DataTypes.ModelType, DataTypes.ComplexType].includes(prop.dataType);
    let type = isEditableModel ? this.dataModel.getEditableModelName(prop.type) : prop.type;

    // Collections
    if (prop.isCollection) {
      return `Array<${type}>`;
    }

    // primitive, enum & complex types
    return type + (prop.required ? "" : " | null");
  }

  private generateUnboundOperationParams() {
    this.dataModel.getUnboundOperationTypes().forEach((operation) => {
      this.generateOperationParams(operation);
    });
  }

  private generateBoundOperationParams(entityName: string) {
    this.dataModel.getOperationTypeByBinding(entityName).forEach((operation) => {
      this.generateOperationParams(operation);
    });
  }

  private generateOperationParams(operation: OperationType) {
    if (!operation.parameters.length) {
      return;
    }
    this.sourceFile.addInterface({
      name: operation.paramsModelName,
      isExported: true,
      properties: operation.parameters.map((p) => {
        return {
          name: p.odataName, //TODO: mappedName
          type: this.getPropType(p),
          hasQuestionToken: !p.required,
        };
      }),
    });
  }
}
