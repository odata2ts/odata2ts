import { ODataVersions } from "@odata2ts/odata-core";
import { JSDocStructure, OptionalKind, StructureKind } from "ts-morph";

import { DataModel } from "../data-model/DataModel";
import { ComplexType, DataTypes, EntityType, OperationType, PropertyModel } from "../data-model/DataTypeModel";
import { NamingHelper } from "../data-model/NamingHelper";
import { EntityBasedGeneratorFunction, GeneratorFunctionOptions } from "../FactoryFunctionModel";
import { FileWrapper } from "../project/FileWrapper";
import { ProjectManager } from "../project/ProjectManager";
import { ImportContainer } from "./ImportContainer";

export const generateModels: EntityBasedGeneratorFunction = (
  project: ProjectManager,
  dataModel,
  version,
  options,
  namingHelper
) => {
  const generator = new ModelGenerator(project, dataModel, version, options, namingHelper);
  return generator.generate();
};

const DEFERRED_CONTENT = "DeferredContent";

class ModelGenerator {
  constructor(
    private project: ProjectManager,
    private dataModel: DataModel,
    private version: ODataVersions,
    private options: GeneratorFunctionOptions,
    private namingHelper: NamingHelper
  ) {}

  public async generate(): Promise<void> {
    this.project.initModels();

    const promises: Array<Promise<void>> = [...this.generateEnums(), ...this.generateModels()];

    if (!this.options.skipOperations) {
      promises.push(...this.generateUnboundOperationParams());
    }

    await Promise.all(promises);

    return this.project.finalizeModels();
  }

  private generateEnums() {
    return this.dataModel.getEnums().map((et) => {
      const file = this.project.createOrGetModelFile(et.folderPath, et.modelName);

      file.getFile().addEnum({
        name: et.modelName,
        isExported: true,
        members: et.members.map((mem) => ({ name: mem, initializer: `"${mem}"` })),
      });

      return this.project.finalizeFile(file);
    });
  }

  private generateModels() {
    return [
      ...this.dataModel.getEntityTypes().map((model) => {
        const file = this.project.createOrGetModelFile(model.folderPath, model.modelName);

        this.generateModel(file, model);
        if (!this.options.skipIdModels && model.generateId) {
          this.generateIdModel(file, model);
        }
        if (!this.options.skipEditableModels && !model.abstract) {
          this.generateEditableModel(file, model);
        }
        if (!this.options.skipOperations) {
          this.generateBoundOperationParams(file, model.fqName);
        }

        return this.project.finalizeFile(file);
      }),
      ...this.dataModel.getComplexTypes().map((model) => {
        const file = this.project.createOrGetModelFile(model.folderPath, model.modelName);

        this.generateModel(file, model);
        if (!this.options.skipEditableModels && !model.abstract) {
          this.generateEditableModel(file, model);
        }

        return this.project.finalizeFile(file);
      }),
    ];
  }

  private generateModel(file: FileWrapper, model: ComplexType | EntityType) {
    const imports = file.getImports();
    let extendsClause = undefined;
    if (model.finalBaseClass) {
      const modelName = imports.addGeneratedModel(
        model.baseClasses[0],
        this.namingHelper.getModelName(model.finalBaseClass)
      );
      extendsClause = [modelName];
    }

    file.getFile().addInterface({
      name: model.modelName,
      isExported: true,
      properties: model.props.map((p) => {
        const isEntity = p.dataType == DataTypes.ModelType;
        return {
          name: p.name,
          type: this.getPropType(file.getImports(), p),
          // props for entities or entity collections are not added in V4 if not explicitly expanded
          hasQuestionToken: this.dataModel.isV4() && isEntity,
          docs: this.options.skipComments ? undefined : [this.generatePropDoc(p, model)],
        };
      }),
      extends: extendsClause,
    });
  }

  private generatePropDoc(prop: PropertyModel, model: ComplexType | EntityType): OptionalKind<JSDocStructure> {
    const isKeyProp = (model as EntityType).keyNames?.includes(prop.odataName);
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

  private getPropType(imports: ImportContainer, prop: PropertyModel): string {
    const isEntity = prop.dataType == DataTypes.ModelType;

    // V2 entity special: deferred content
    let suffix = "";
    if (isEntity && this.dataModel.isV2()) {
      imports.addFromCore(DEFERRED_CONTENT);
      suffix = ` | ${DEFERRED_CONTENT}`;
    }
    // custom types which require type imports => possible via converters
    else if (prop.typeModule) {
      imports.addCustomType(prop.typeModule, prop.type);
    }

    const safeTypeName =
      prop.dataType === DataTypes.PrimitiveType ? prop.type : imports.addGeneratedModel(prop.fqType, prop.type);

    // Collections
    if (prop.isCollection) {
      const type = `Array<${safeTypeName}>`;
      if (this.dataModel.isV2() && this.options.v2ModelsWithExtraResultsWrapping) {
        return `{ results: ${type} }` + suffix;
      } else {
        return type + suffix;
      }
    }

    // primitive, enum & complex types
    return safeTypeName + (prop.required ? "" : " | null") + suffix;
  }

  private generateIdModel(file: FileWrapper, model: EntityType) {
    const singleType = model.keys.length === 1 ? `${model.keys[0].type} | ` : "";
    const keyTypes = model.keys
      .map((keyProp) => `${keyProp.name}: ${this.getPropType(file.getImports(), keyProp)}`)
      .join(",");
    const type = `${singleType}{${keyTypes}}`;

    file.getFile().addTypeAlias({
      name: model.id.modelName,
      isExported: true,
      type,
    });
  }

  private generateEditableModel(file: FileWrapper, model: ComplexType) {
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
      requiredProps ? `Pick<${model.modelName}, ${requiredProps}>` : null,
      optionalProps ? `Partial<Pick<${model.modelName}, ${optionalProps}>>` : null,
    ].filter((e): e is string => !!e);

    file.getFile().addInterface({
      name: model.editableName,
      isExported: true,
      extends: extendsClause,
      properties: !complexProps
        ? undefined
        : complexProps.map((p) => {
            return {
              name: p.name,
              type: this.getEditablePropType(file.getImports(), p),
              // optional props don't need to be specified in editable model
              // also, entities would require deep insert func => we make it optional for now
              hasQuestionToken: !p.required || p.dataType === DataTypes.ModelType,
            };
          }),
    });
  }

  private getEditablePropType(imports: ImportContainer, prop: PropertyModel): string {
    const isModelType = [DataTypes.ModelType, DataTypes.ComplexType].includes(prop.dataType);

    let editableType = prop.type;
    if (isModelType) {
      const editName = this.dataModel.getComplexType(prop.fqType)!.editableName;
      editableType = imports.addGeneratedModel(prop.fqType, editName);
    }

    // Collections
    if (prop.isCollection) {
      return `Array<${editableType}>`;
    }

    // primitive, enum & complex types
    return editableType + (prop.required ? "" : " | null");
  }

  private generateUnboundOperationParams() {
    return this.dataModel.getUnboundOperationTypes().map((operation) => {
      const file = this.project.createOrGetModelFile(operation.folderPath, operation.paramsModelName);

      this.generateOperationParams(file, operation);

      return this.project.finalizeFile(file);
    });
  }

  private generateBoundOperationParams(file: FileWrapper, entityName: string) {
    [
      ...this.dataModel.getEntityTypeOperations(entityName),
      ...this.dataModel.getEntitySetOperations(entityName),
    ].forEach((operation) => {
      this.generateOperationParams(file, operation);
    });
  }

  private generateOperationParams(file: FileWrapper, operation: OperationType) {
    if (!operation.parameters.length) {
      return;
    }
    file.getFile().addInterface({
      name: operation.paramsModelName,
      isExported: true,
      properties: operation.parameters.map((p) => {
        return {
          name: p.name,
          type: this.getPropType(file.getImports(), p),
          hasQuestionToken: !p.required,
        };
      }),
    });
  }
}
