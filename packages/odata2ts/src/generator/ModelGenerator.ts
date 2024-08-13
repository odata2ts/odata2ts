import { ODataVersions } from "@odata2ts/odata-core";
import { JSDocStructure, OptionalKind, StructureKind } from "ts-morph";

import { DataModel } from "../data-model/DataModel.js";
import { ComplexType, DataTypes, EntityType, OperationType, PropertyModel } from "../data-model/DataTypeModel.js";
import { NamingHelper } from "../data-model/NamingHelper.js";
import { EntityBasedGeneratorFunction, GeneratorFunctionOptions } from "../FactoryFunctionModel.js";
import { FileHandler } from "../project/FileHandler.js";
import { ProjectManager } from "../project/ProjectManager.js";
import { CoreImports } from "./import/ImportObjects.js";
import { ImportContainer } from "./ImportContainer.js";

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

    const promises: Array<Promise<void>> = [
      ...this.generateEnums(),
      ...this.generateEntityTypeModels(),
      ...this.generateComplexTypeModels(),
    ];

    if (!this.options.skipOperations) {
      promises.push(this.generateUnboundOperationParams());
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

  private generateEntityTypeModels() {
    return this.dataModel.getEntityTypes().map((model) => {
      const file = this.project.createOrGetModelFile(model.folderPath, model.modelName, [
        model.modelName,
        model.id.modelName,
        model.editableName,
      ]);

      // query model
      this.generateModel(file, model);

      // key model
      if (!this.options.skipIdModels && model.generateId) {
        this.generateIdModel(file, model);
      }

      // editable model
      if (!this.options.skipEditableModels) {
        this.generateEditableModel(file, model);
      }

      // param models for bound operations
      if (!this.options.skipOperations) {
        [
          ...this.dataModel.getEntityTypeOperations(model.fqName),
          ...this.dataModel.getEntitySetOperations(model.fqName),
        ].forEach((operation) => {
          this.generateOperationParams(file, operation);
        });
      }

      return this.project.finalizeFile(file);
    });
  }

  private generateComplexTypeModels() {
    return this.dataModel.getComplexTypes().map((model) => {
      const file = this.project.createOrGetModelFile(model.folderPath, model.modelName, [
        model.modelName,
        model.editableName,
      ]);

      // query model
      this.generateModel(file, model);

      // editable model
      if (!this.options.skipEditableModels) {
        this.generateEditableModel(file, model);
      }

      return this.project.finalizeFile(file);
    });
  }

  private generateModel(file: FileHandler, model: ComplexType | EntityType) {
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
    // V2 entity special: deferred content
    let suffix = "";
    if (this.dataModel.isV2() && prop.dataType == DataTypes.ModelType) {
      const defContent = imports.addCoreLib(this.version, CoreImports.DeferredContent);
      suffix = ` | ${defContent}`;
    }

    let typeName: string;
    if (prop.dataType === DataTypes.PrimitiveType) {
      // custom types which require type imports => possible via converters
      typeName = prop.typeModule ? imports.addCustomType(prop.typeModule, prop.type, true) : prop.type;
    } else {
      typeName = imports.addGeneratedModel(prop.fqType, prop.type);
    }

    // Collections
    if (prop.isCollection) {
      const type = `Array<${typeName}>`;
      if (this.dataModel.isV2() && this.options.v2ModelsWithExtraResultsWrapping) {
        return `{ results: ${type} }` + suffix;
      } else {
        return type + suffix;
      }
    }

    // primitive, enum & complex types
    return typeName + (prop.required ? "" : " | null") + suffix;
  }

  private generateIdModel(file: FileHandler, model: EntityType) {
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

  private generateEditableModel(file: FileHandler, model: ComplexType) {
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

  private async generateUnboundOperationParams() {
    const unboundOps = this.dataModel.getUnboundOperationTypes();
    const reservedNames = unboundOps.map((op) => op.paramsModelName);
    const file = this.project.createOrGetMainModelFile(reservedNames);

    unboundOps.forEach((operation) => {
      this.generateOperationParams(file, operation);
    });
  }

  private generateOperationParams(file: FileHandler, operation: OperationType) {
    const paramSets = [operation.parameters, ...(operation.overrides ?? [])].filter((pSet) => !!pSet.length);

    // standard: one interface for parameters
    if (paramSets.length === 1) {
      file.getFile().addInterface({
        name: operation.paramsModelName,
        isExported: true,
        properties: paramSets[0].map((p) => {
          return {
            name: p.name,
            type: this.getPropType(file.getImports(), p),
            hasQuestionToken: !p.required,
          };
        }),
      });
    }
    // function overload: one type with intersections of different param models
    else if (paramSets.length > 1) {
      file.getFile().addTypeAlias({
        name: operation.paramsModelName,
        isExported: true,
        type: (writer) => {
          paramSets.forEach((pSet, index) => {
            writer.block(() => {
              pSet.forEach((param, index) => {
                const paramType = this.getPropType(file.getImports(), param);
                writer.write(`${param.name}${param.required ? "" : "?"}: ${paramType}`);
                if (index < pSet.length - 1) {
                  writer.write(",");
                }
              });
            });
            if (index < paramSets.length - 1) {
              writer.write(" | ");
            }
          });
        },
      });
    }
  }
}
