import { OptionalKind, PropertyDeclarationStructure, Scope, SourceFile, VariableDeclarationKind } from "ts-morph";
import { firstCharLowerCase } from "xml2js/lib/processors";

import { DataModel } from "../data-model/DataModel";
import { DataTypes, PropertyModel } from "../data-model/DataTypeModel";
import { EntityBasedGeneratorFunction } from "../FactoryFunctionModel";

const CORE_QCLASSES = ["QueryObject"];
const Q_OBJECT_PACKAGE = "@odata2ts/odata-query-objects";

export const generateQueryObjects: EntityBasedGeneratorFunction = (dataModel, sourceFile) => {
  const generator = new QueryObjectGenerator(dataModel, sourceFile);
  return generator.generate();
};

class QueryObjectGenerator {
  constructor(private dataModel: DataModel, private sourceFile: SourceFile) {}

  public generate(): void {
    const qTypeImports = new Set<string>(CORE_QCLASSES);

    const models = [...this.dataModel.getModels(), ...this.dataModel.getComplexTypes()];
    models.forEach((model) => {
      this.sourceFile.addClass({
        name: model.qName,
        isExported: true,
        extends: "QueryObject",
        properties: this.generateQueryObjectProps([...model.baseProps, ...model.props], qTypeImports),
      });

      this.sourceFile.addVariableStatement({
        declarationKind: VariableDeclarationKind.Const,
        isExported: true,
        declarations: [
          {
            name: firstCharLowerCase(model.qName),
            initializer: `new ${model.qName}()`,
          },
        ],
      });
    });

    if (models.length) {
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
      const isModelType = prop.dataType === DataTypes.ModelType || prop.dataType === DataTypes.ComplexType;
      let qPathInit: string;

      if (isModelType) {
        qPathInit = `new ${prop.qPath}(this.withPrefix("${odataName}"), () => ${prop.qObject!})`;
      } else {
        qPathInit = `new ${prop.qPath}(this.withPrefix("${odataName}"))`;
      }

      // factor in collections
      if (prop.isCollection) {
        const cType = `Q${isModelType ? "Entity" : ""}CollectionPath`;
        const qObject = prop.qObject;

        if (!qObject) {
          throw new Error("QObject for collection is missing!");
        }

        qPathInit = `new ${cType}(this.withPrefix("${odataName}"), () => ${qObject})`;

        qTypeImports.add(cType);
        if (!isModelType) {
          qTypeImports.add(qObject);
        }
      }

      // add import for data type
      qTypeImports.add(prop.qPath);

      return {
        name,
        scope: Scope.Public,
        isReadonly: true,
        initializer: qPathInit,
      } as OptionalKind<PropertyDeclarationStructure>;
    });
  }
}
