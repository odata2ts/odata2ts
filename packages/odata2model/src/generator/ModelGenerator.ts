import { SourceFile } from "ts-morph";
import { DataModel } from "./../data-model/DataModel";
import { TsGenerator } from "./GeneratorModel";

export class ModelGenerator implements TsGenerator {
  public generate(dataModel: DataModel, sourceFile: SourceFile): void {
    this.generateEnums(dataModel, sourceFile);
    this.generateModels(dataModel, sourceFile);

    // add import statements for additional primitive types, e.g. DateString or GuidString
    this.addDataTypeImports(dataModel.getPrimitiveTypeImports(), sourceFile);
  }

  private generateEnums(dataModel: DataModel, sourceFile: SourceFile) {
    dataModel.getEnums().forEach((et) => {
      sourceFile.addEnum({
        name: et.name,
        isExported: true,
        members: et.members.map((mem) => ({ name: mem, initializer: `"${mem}"` })),
      });
    });
  }

  private generateModels(dataModel: DataModel, sourceFile: SourceFile) {
    dataModel.getModels().forEach((model) => {
      sourceFile.addInterface({
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

  private addDataTypeImports(imports: Array<string>, sourceFile: SourceFile) {
    if (!imports || !imports.length) {
      return;
    }
    sourceFile.addImportDeclaration({
      isTypeOnly: true,
      namedImports: imports,
      moduleSpecifier: "@odata2ts/odata-query-objects",
    });
  }
}
