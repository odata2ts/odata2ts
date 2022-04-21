import { SourceFile } from "ts-morph";
import { DataModel } from "../data-model/DataModel";

export function generateModels(dataModel: DataModel, sourceFile: SourceFile) {
  const generator = new ModelGenerator(dataModel, sourceFile);
  return generator.generate();
}

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
    this.dataModel.getModels().forEach((model) => {
      this.sourceFile.addInterface({
        name: model.name,
        isExported: true,
        properties: model.props.map((p) => ({
          name: p.odataName, // todo: map to lowercase
          type: p.isCollection ? `Array<${p.type}>` : p.type,
          hasQuestionToken: !p.required,
        })),
        extends: model.baseClasses,
      });
    });
  }
}
