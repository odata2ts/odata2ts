import { SourceFile } from "ts-morph";
import { DataModel } from "./../data-model/DataModel";

export class ModelGenerator {
  constructor(private dataModel: DataModel, private sourceFile: SourceFile) {}

  public generate(): void {
    this.generateEnums();
    this.generateModels();

    // add import statements for additional primitive types, e.g. DateString or GuidString
    this.addDataTypeImports(this.dataModel.getPrimitiveTypeImports());
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

  private addDataTypeImports(imports: Array<string>) {
    if (!imports || !imports.length) {
      return;
    }
    this.sourceFile.addImportDeclaration({
      isTypeOnly: true,
      namedImports: imports,
      moduleSpecifier: "@odata2ts/odata-query-objects",
    });
  }
}
