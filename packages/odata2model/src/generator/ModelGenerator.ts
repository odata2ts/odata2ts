import { SourceFile } from "ts-morph";
import { DataModel } from "../data-model/DataModel";
import { ComplexType, DataTypes, PropertyModel } from "../data-model/DataTypeModel";
import { ModelImportContainer } from "./ModelImportContainer";

export function generateModels(dataModel: DataModel, sourceFile: SourceFile) {
  const generator = new ModelGenerator(dataModel, sourceFile);
  return generator.generate();
}

const DEFERRED_CONTENT = "DeferredContent";

class ModelGenerator {
  constructor(private dataModel: DataModel, private sourceFile: SourceFile) {}

  public generate(): void {
    this.generateEnums();
    this.generateModels();
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
    const importContainer = new ModelImportContainer();
    const models = [...this.dataModel.getModels(), ...this.dataModel.getComplexTypes()];

    models.forEach((model) => {
      this.generateModel(model, importContainer);
      this.generateEditableModel(model, importContainer);
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
    const complexProps = allProps.filter((p) =>
      this.dataModel.isV2() ? p.dataType === DataTypes.ComplexType : entityTypes.includes(p.dataType)
    );

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
        : complexProps
            // TODO entity types => assumes deep insert capabilities
            // V2 => link reference to entity ({ uri: "..." }) should work for create, update and patch
            // V4 =>
            //   - 4.0 @odata.bind and 4.01 @id should work: https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html#sec_LinktoRelatedEntitiesWhenCreatinganE
            //   - deep insert: https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html#sec_CreateRelatedEntitiesWhenCreatinganE
            .map((p) => {
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
}
