import { upperCaseFirst } from "upper-case-first";
import { SourceFile, VariableDeclarationKind, Writers } from "ts-morph";

import { DataTypes, PropertyModel } from "../data-model/DataTypeModel";
import { DataModel } from "../data-model/DataModel";

const CORE_QCLASSES = ["QEntityModel"];
const Q_OBJECT_PACKAGE = "@odata2ts/odata-query-objects";

export function generateQueryObjects(dataModel: DataModel, sourceFile: SourceFile) {
  const generator = new QueryObjectGenerator(dataModel, sourceFile);
  return generator.generate();
}

class QueryObjectGenerator {
  constructor(private dataModel: DataModel, private sourceFile: SourceFile) {}

  public generate(): void {
    const enumNames = this.dataModel.getEnums().map((enumType) => enumType.name);
    const enumTypeUnion = enumNames.join(" | ");
    const qTypeImports = new Set<string>(CORE_QCLASSES);
    const modelImports = new Set<string>(enumNames);

    this.dataModel.getModels().forEach((model) => {
      // const keyRef = et.Key[0].PropertyRef.map((propRef) => `"${propRef.$.Name}"`).join(" | ");
      const propContainer = this.generateQueryObjectProps([...model.baseProps, ...model.props], qTypeImports);

      modelImports.add(model.name);

      this.sourceFile.addVariableStatement({
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

    if (modelImports.size) {
      this.sourceFile.addImportDeclaration({
        isTypeOnly: false,
        namedImports: [...qTypeImports],
        moduleSpecifier: Q_OBJECT_PACKAGE,
      });

      this.sourceFile.addImportDeclaration({
        isTypeOnly: true,
        namedImports: [...modelImports],
        moduleSpecifier: `./${this.dataModel.getFileNames().model}`,
      });
    }
  }

  private generateQueryObjectProps(props: Array<PropertyModel>, qTypeImports: Set<string>) {
    return props.reduce((collector, prop) => {
      const { name, odataName } = prop;
      const isModelType = prop.dataType === DataTypes.ModelType;
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
      } else if (isModelType) {
        qPathType = "QEntityPath";
        qPathInit = `new ${qPathType}("${odataName}", () => ${prop.qObject})`;
      } else {
        throw Error(`Unknonw DataType [${prop.dataType}] for prop with name [${name}]`);
      }

      // factor in collections
      if (prop.isCollection) {
        const cType = `Q${isModelType ? "Entity" : ""}CollectionPath`;
        const qObject = prop.qObject;

        if (!qObject) {
          throw Error("QObject for collection is missing!");
        }

        // workaround: force the typing to work by adding additional type infos fro primitive qObjects
        qPathInit = `new ${cType}("${odataName}", () => ${qObject})`;

        qTypeImports.add(cType);
        if (!isModelType) {
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
