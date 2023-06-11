import { ODataVersions } from "@odata2ts/odata-core";
import { JSDocStructure, OptionalKind, SourceFile, StructureKind } from "ts-morph";

import { DataModel } from "../data-model/DataModel";
import { ComplexType, DataTypes, ModelType, OperationType, PropertyModel } from "../data-model/DataTypeModel";
import { NamingHelper } from "../data-model/NamingHelper";
import { EntityBasedGeneratorFunction, GeneratorFunctionOptions } from "../FactoryFunctionModel";
import { ImportContainer } from "./ImportContainer";

export const generateModels: EntityBasedGeneratorFunction = (dataModel, sourceFile, version, options, namingHelper) => {
  const generator = new ModelGenerator(dataModel, sourceFile, version, options, namingHelper);
  return generator.generate();
};

const DEFERRED_CONTENT = "DeferredContent";

class ModelGenerator {
  private importContainer!: ImportContainer;

  constructor(
    private dataModel: DataModel,
    private sourceFile: SourceFile,
    private version: ODataVersions,
    private options: GeneratorFunctionOptions,
    private namingHelper: NamingHelper
  ) {}

  public generate(): void {
    this.importContainer = new ImportContainer(this.namingHelper.getFileNames());

    this.generateEnums();
    this.generateModels();
    if (!this.options.skipOperations) {
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
      if (!this.options.skipIdModels) {
        this.generateIdModel(model);
      }
      if (!this.options.skipEditableModels) {
        this.generateEditableModel(model);
      }
      if (!this.options.skipOperations) {
        this.generateBoundOperationParams(model.name);
      }
    });
    this.dataModel.getComplexTypes().forEach((model) => {
      this.generateModel(model);
      if (!this.options.skipEditableModels) {
        this.generateEditableModel(model);
      }
    });

    this.sourceFile.addImportDeclarations(this.importContainer.getImportDeclarations());
  }

  private generateModel(model: ComplexType | ModelType) {
    this.sourceFile.addInterface({
      name: model.name,
      isExported: true,
      properties: model.props.map((p) => {
        const isEntity = p.dataType == DataTypes.ModelType;
        return {
          name: p.name,
          type: this.getPropType(p),
          // props for entities or entity collections are not added in V4 if not explicitly expanded
          hasQuestionToken: this.dataModel.isV4() && isEntity,
          docs: this.options.skipComments ? undefined : [this.generatePropDoc(p, model)],
        };
      }),
      extends: model.baseClasses,
    });
  }

  private generatePropDoc(prop: PropertyModel, model: ComplexType | ModelType): OptionalKind<JSDocStructure> {
    const isKeyProp = (model as ModelType).keyNames?.includes(prop.odataName);
    const baseAttribs: Array<string> = [];
    if (isKeyProp) {
      baseAttribs.push("**Key Property**: This is a key property used to identify the entity.");
    }
    if (prop.managed) {
      baseAttribs.push("**Managed**: This property is managed on the server side and cannot be edited.");
    }
    if (prop.converters?.length) {
      baseAttribs.push(`**Applied Converters**: ${prop.converters.map((c) => c.converterId).join(",")}.`);
    }

    const attributeTable: Array<[string, string]> = [
      ["Name", prop.odataName],
      ["Type", prop.odataType],
    ];
    if (prop.required) {
      attributeTable.push(["Nullable", "false"]);
    }

    const description =
      (baseAttribs ? baseAttribs.join("<br/>") + "\n\n" : "") +
      "OData Attributes:\n" +
      "|Attribute Name | Attribute Value |\n| --- | ---|\n" +
      attributeTable.map((row) => `| ${row[0]} | \`${row[1]}\` |`).join("\n");

    return { kind: StructureKind.JSDoc, description };
  }

  private getPropType(prop: PropertyModel): string {
    const isEntity = prop.dataType == DataTypes.ModelType;

    // V2 entity special: deferred content
    let suffix = "";
    if (isEntity && this.dataModel.isV2()) {
      this.importContainer.addFromCore(DEFERRED_CONTENT);
      suffix = ` | ${DEFERRED_CONTENT}`;
    }
    // custom types which require type imports => possible via converters
    else if (prop.typeModule) {
      this.importContainer.addCustomType(prop.typeModule, prop.type);
    }

    // Collections
    if (prop.isCollection) {
      const type = `Array<${prop.type}>`;
      if (this.dataModel.isV2() && this.options.v2ModelsWithExtraResultsWrapping) {
        return `{ results: ${type} }` + suffix;
      } else {
        return type + suffix;
      }
    }

    // primitive, enum & complex types
    return prop.type + (prop.required ? "" : " | null") + suffix;
  }

  private generateIdModel(model: ModelType) {
    if (!model.generateId) {
      return;
    }
    const singleType = model.keys.length === 1 ? `${model.keys[0].type} | ` : "";
    const keyTypes = model.keys.map((keyProp) => `${keyProp.name}: ${this.getPropType(keyProp)}`).join(",");
    const type = `${singleType}{${keyTypes}}`;

    this.sourceFile.addTypeAlias({
      name: model.idModelName,
      isExported: true,
      type,
    });
  }

  private generateEditableModel(model: ComplexType) {
    const entityTypes = [DataTypes.ModelType, DataTypes.ComplexType];
    const allProps = [...model.baseProps, ...model.props].filter((p) => !p.managed);

    const requiredProps = allProps
      .filter((p) => p.required && !entityTypes.includes(p.dataType))
      .map((p) => `"${p.name}"`)
      .join(" | ");
    const optionalProps = allProps
      .filter((p) => !p.required && !entityTypes.includes(p.dataType))
      .map((p) => `"${p.name}"`)
      .join(" | ");
    const complexProps = allProps.filter((p) => p.dataType === DataTypes.ComplexType);

    const extendsClause = [
      requiredProps ? `Pick<${model.name}, ${requiredProps}>` : null,
      optionalProps ? `Partial<Pick<${model.name}, ${optionalProps}>>` : null,
    ].filter((e): e is string => !!e);

    this.sourceFile.addInterface({
      name: model.editableName,
      isExported: true,
      extends: extendsClause,
      properties: !complexProps
        ? undefined
        : complexProps.map((p) => {
            return {
              name: p.name,
              type: this.getEditablePropType(p),
              // optional props don't need to be specified in editable model
              // also, entities would require deep insert func => we make it optional for now
              hasQuestionToken: !p.required || p.dataType === DataTypes.ModelType,
            };
          }),
    });
  }

  private getEditablePropType(prop: PropertyModel): string {
    const type =
      prop.dataType === DataTypes.ModelType
        ? this.dataModel.getModel(prop.type).editableName
        : prop.dataType === DataTypes.ComplexType
        ? this.dataModel.getComplexType(prop.type).editableName
        : prop.type;

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
    this.dataModel.getOperationTypeByEntityOrCollectionBinding(entityName).forEach((operation) => {
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
          name: p.name,
          type: this.getPropType(p),
          hasQuestionToken: !p.required,
        };
      }),
    });
  }
}
