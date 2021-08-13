import { upperCaseFirst } from "upper-case-first";
import { SourceFile, VariableDeclarationKind, Writers } from "ts-morph";

import { DataTypes, ModelType, PropertyModel } from "./../data-model/DataTypeModel";
import { DataModel } from "./../data-model/DataModel";
import { TsGenerator } from "./GeneratorModel";

const CORE_QCLASSES = ["QEntityModel"];
const Q_OBJECT_PACKAGE = "@odata2ts/odata-query-objects";

export class QueryObjectGenerator implements TsGenerator {
  public generate(dataModel: DataModel, sourceFile: SourceFile): void {
    const enumNames = dataModel.getEnums().map((enumType) => enumType.name);
    const enumTypeUnion = enumNames.join(" | ");
    const qTypeImports = new Set<string>(CORE_QCLASSES);
    const modelImports = new Set<string>(enumNames);

    dataModel.getModels().forEach((model) => {
      // const keyRef = et.Key[0].PropertyRef.map((propRef) => `"${propRef.$.Name}"`).join(" | ");
      const propContainer = this.generateQueryObjectProps([...model.baseProps, ...model.props], qTypeImports);

      modelImports.add(model.name);

      sourceFile.addVariableStatement({
        declarationKind: VariableDeclarationKind.Const,
        isExported: true,
        declarations: [
          {
            name: model.qName,
            type: `QEntityModel<${model.name}, ${enumTypeUnion}>`,
            initializer: Writers.object(propContainer),
          },
        ],
        //properties: this.generateProps(serviceName, et, dataTypeImports),
      });
    });

    sourceFile.addImportDeclaration({
      isTypeOnly: false,
      namedImports: [...qTypeImports],
      moduleSpecifier: Q_OBJECT_PACKAGE,
    });

    if (modelImports.size) {
      sourceFile.addImportDeclaration({
        isTypeOnly: true,
        namedImports: [...modelImports],
        moduleSpecifier: `./${dataModel.getFileNames().model}`,
      });
    }
  }

  private generateQueryObjectProps(props: Array<PropertyModel>, qTypeImports: Set<string>) {
    return props.reduce((collector, prop) => {
      const { name, odataName } = prop;
      // determine matching QPath type
      let qPathType: string;
      let qPathInit: string;

      if (prop.dataType === DataTypes.EnumType) {
        qPathType = "QEnumPath";
        qPathInit = `new ${qPathType}("${odataName}")`;
      } else if (prop.dataType === DataTypes.PrimitiveType) {
        // Custom primitive types like DateString or GuidString end on suffix 'String' => remove that
        qPathType = `Q${upperCaseFirst(prop.type.replace(/String$/, ""))}Path`;
        qPathInit = `new ${qPathType}("${odataName}")`;
      } else if (prop.dataType === DataTypes.ModelType) {
        qPathType = "QEntityPath";
        qPathInit = `new ${qPathType}("${odataName}", () => ${prop.qObject})`;
      } else {
        throw Error(`Unknonw DataType [${prop.dataType}] for prop with name [${name}]`);
      }

      // factor in collections
      if (prop.isCollection) {
        const cType = `QCollectionPath`;
        const qObject = prop.qObject;

        if (!qObject) {
          throw Error("QObject for collection is missing!");
        }

        // workaround: force the typing to work by adding additional type infos fro primitive qObjects
        const typeAddition = prop.dataType === DataTypes.PrimitiveType ? `<{it: ${prop.type}}>` : "";
        qPathInit = `new ${cType}${typeAddition}("${name}", () => ${qObject})`;

        qTypeImports.add(cType);
        if (prop.dataType !== DataTypes.ModelType) {
          qTypeImports.add(qObject);
        }
      }

      // add import for data type
      qTypeImports.add(qPathType);

      collector[name] = qPathInit;
      return collector;
    }, {} as { [key: string]: string });
  }
}
