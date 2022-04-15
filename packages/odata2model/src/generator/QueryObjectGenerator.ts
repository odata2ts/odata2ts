import { upperCaseFirst } from "upper-case-first";
import {
  ConstructorDeclarationStructure,
  OptionalKind,
  PropertyDeclarationStructure,
  Scope,
  SourceFile,
  VariableDeclarationKind,
} from "ts-morph";

import { DataTypes, PropertyModel } from "../data-model/DataTypeModel";
import { DataModel } from "../data-model/DataModel";

const CORE_QCLASSES = ["QueryObject"];
const Q_OBJECT_PACKAGE = "@odata2ts/odata-query-objects";
const Q_OBJECT_CONSTRUCTOR: OptionalKind<ConstructorDeclarationStructure> = {
  parameters: [
    {
      name: "path",
      hasQuestionToken: true,
      type: "string",
    },
  ],
  statements: "super(path);",
}

export function generateQueryObjects(dataModel: DataModel, sourceFile: SourceFile) {
  const generator = new QueryObjectGenerator(dataModel, sourceFile);
  return generator.generate();
}



class QueryObjectGenerator {
  constructor(private dataModel: DataModel, private sourceFile: SourceFile) {}

  public generate(): void {
    const qTypeImports = new Set<string>(CORE_QCLASSES);

    this.dataModel.getModels().forEach((model) => {
      this.sourceFile.addClass({
        name: upperCaseFirst(model.qName),
        isExported: true,
        extends: "QueryObject",
        ctors: [Q_OBJECT_CONSTRUCTOR],
        properties: this.generateQueryObjectProps([...model.baseProps, ...model.props], qTypeImports),
      });

      this.sourceFile.addVariableStatement({
        declarationKind: VariableDeclarationKind.Const,
        isExported: true,
        declarations: [
          {
            name: model.qName,
            initializer: `new ${upperCaseFirst(model.qName)}()`,
          },
        ],
      });
    });

    if (this.dataModel.getModels().length) {
      this.sourceFile.addImportDeclaration({
        isTypeOnly: false,
        namedImports: [...qTypeImports],
        moduleSpecifier: Q_OBJECT_PACKAGE,
      });
    }
  }

  private generateQueryObjectProps(
    props: Array<PropertyModel>,
    qTypeImports: Set<string>
  ): Array<OptionalKind<PropertyDeclarationStructure>> {
    return props.map((prop) => {
      const { name, odataName } = prop;
      const isModelType = prop.dataType === DataTypes.ModelType;
      // determine matching QPath type
      let qPathType: string;
      let qPathInit: string;

      if (prop.dataType === DataTypes.EnumType) {
        qPathType = "QEnumPath";
        qPathInit = `new ${qPathType}(this.withPrefix("${odataName}"))`;
      } else if (prop.dataType === DataTypes.PrimitiveType) {
        // Custom primitive types like DateString or GuidString end on suffix 'String' => remove that
        qPathType = `Q${upperCaseFirst(prop.type.replace(/String$/, ""))}Path`;
        qPathInit = `new ${qPathType}(this.withPrefix("${odataName}"))`;
      } else if (isModelType) {
        qPathType = "QEntityPath";
        qPathInit = `new ${qPathType}(this.withPrefix("${odataName}"), () => ${upperCaseFirst(prop.qObject!)})`;
      } else {
        throw Error(`Unknown DataType [${prop.dataType}] for prop with name [${name}]`);
      }

      // factor in collections
      if (prop.isCollection) {
        const cType = `Q${isModelType ? "Entity" : ""}CollectionPath`;
        const qObject = prop.qObject;

        if (!qObject) {
          throw Error("QObject for collection is missing!");
        }

        qPathInit = `new ${cType}(this.withPrefix("${odataName}"), () => ${upperCaseFirst(qObject)})`;

        qTypeImports.add(cType);
        if (!isModelType) {
          qTypeImports.add(upperCaseFirst(qObject));
        }
      }

      // add import for data type
      qTypeImports.add(qPathType);

      return {
        name,
        scope: Scope.Public,
        isReadonly: true,
        initializer: qPathInit,
      } as OptionalKind<PropertyDeclarationStructure>;
    });
  }
}
