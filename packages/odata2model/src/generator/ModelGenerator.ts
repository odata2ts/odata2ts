import { SourceFile } from "ts-morph";
import { DataModel } from "../data-model/DataModel";
import { DataTypes, PropertyModel } from "../data-model/DataTypeModel";
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

  private generateModels() {
    const models = [...this.dataModel.getModels(), ...this.dataModel.getComplexTypes()];

    const importContainer = new ModelImportContainer();
    models.forEach((model) => {
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
    });

    this.sourceFile.addImportDeclarations(importContainer.getImportDeclarations());
  }
}
