import * as path from "path";
import { remove, writeFile } from "fs-extra";
import { Project, SourceFile, VariableDeclarationKind, Writers } from "ts-morph";
import { upperCaseFirst } from "upper-case-first";

import { DataModel } from "./data-model/DataModel";
import { Odata2tsOptions } from "./cli";
import { NoopFormatter } from "./formatter/NoopFormatter";
import { PrettierFormatter } from "./formatter/PrettierFormatter";
import { ODataEdmxModel, Schema } from "./odata/ODataEdmxModel";
import { BaseFormatter } from "./formatter/BaseFormatter";
import { DataTypes, PropertyModel, ModelType } from "./data-model/DataTypeModel";

export interface RunOptions extends Omit<Odata2tsOptions, "source" | "output"> {}

export class App {
  /**
   *
   * @param metadataJson metadata of a given OData service already parsed as JSON
   * @param outputPath path to the target folder
   * @param options further options
   */
  public async run(metadataJson: ODataEdmxModel, outputPath: string, options: RunOptions): Promise<void> {
    const formatter = await this.createFormatter(outputPath, options.prettier);

    // Create ts-morph project
    const project = new Project({
      manipulationSettings: formatter.getSettings(),
      skipAddingFilesFromTsConfig: true,
    });

    // get file name based on service name
    // TODO check edmx version attribute
    const dataService = metadataJson["edmx:Edmx"]["edmx:DataServices"][0];
    const serviceName = upperCaseFirst(dataService.Schema[0].$.Namespace);
    const fileNameTypes = path.join(outputPath, serviceName + ".ts");

    // merge all schemas & take name from first schema
    // TODO only necessary for NorthwindModel => other use cases?
    const schema = dataService.Schema.reduce((collector, schema, index) => {
      return {
        ...schema,
        ...collector,
      };
    }, {} as Schema);

    const dataModel = new DataModel(schema, options);

    // create ts file which holds all model interfaces
    if (options.mode === "models" || options.mode === "all") {
      await remove(fileNameTypes);
      const serviceDefinition = project.createSourceFile(fileNameTypes);

      // generate
      this.generateModelInterfaces(dataModel, serviceDefinition);
      this.formatAndWriteFile(fileNameTypes, serviceDefinition, formatter);
    }
    if (options.mode === "qobjects" || options.mode === "all") {
      // create ts file which holds query objects
      const fileNameQObjects = path.join(outputPath, `Q${serviceName}.ts`);
      await remove(fileNameQObjects);
      const qDefinition = project.createSourceFile(fileNameQObjects);

      // generate
      this.generateQueryObjects(dataModel, qDefinition);
      this.formatAndWriteFile(fileNameQObjects, qDefinition, formatter);
    }
  }

  private async formatAndWriteFile(fileName: string, file: SourceFile, formatter: BaseFormatter) {
    const raw = file.getFullText();

    const formatted = await formatter.format(raw).catch(async (error: Error) => {
      console.error("Formatting failed");
      await writeFile("error.log", error);
      process.exit(99);
    });

    console.log(`Writing file: ${fileName}`);
    writeFile(fileName, formatted).catch((error: Error) => {
      console.error(`Failed to write file [/${fileName}]`, error);
      process.exit(3);
    });
  }

  private generateModelInterfaces(dataModel: DataModel, serviceDefinition: SourceFile) {
    // Enum Types
    dataModel.getEnums().forEach((et) => {
      serviceDefinition.addEnum({
        name: et.name,
        isExported: true,
        members: et.members.map((mem) => ({ name: mem, initializer: `"${mem}"` })),
      });
    });

    // Entity Types & Complex Types
    dataModel.getModels().forEach((model) => {
      serviceDefinition.addInterface({
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

    /* schema.Function?.forEach((fn) => {
      serviceDefinition.addTypeAlias({
        name: fn.$.Name,
        isExported: true,

        members: fn..map((mem) => ({ name: mem.$.Name}))
      })
    })
 */

    // add import statements for additional primitive types, e.g. DateString or GuidString
    const imports = dataModel.getPrimitiveTypeImports();
    if (imports.length) {
      serviceDefinition.addImportDeclaration({
        isTypeOnly: true,
        namedImports: imports,
        moduleSpecifier: "@odata2ts/odata-query-objects",
      });
    }
  }

  private generateQueryObjects(dataModel: DataModel, serviceDefinition: SourceFile) {
    const enumNames = dataModel.getEnums().map((enumType) => enumType.name);
    const enumTypeUnion = enumNames.join(" | ");
    const qTypeImports = new Set<string>(["QEntityModel"]);
    const modelImports = new Set<string>(enumNames);

    dataModel.getModels().forEach((model) => {
      // const keyRef = et.Key[0].PropertyRef.map((propRef) => `"${propRef.$.Name}"`).join(" | ");
      const propContainer = this.generateQueryObjectProps(
        [...this.collectBaseClassProps(dataModel, model), ...model.props],
        qTypeImports
      );

      modelImports.add(model.name);

      serviceDefinition.addVariableStatement({
        declarationKind: VariableDeclarationKind.Const,
        isExported: true,
        declarations: [
          {
            name: `q${model.name}`,
            type: `QEntityModel<${model.name}, ${enumTypeUnion}>`,
            initializer: Writers.object(propContainer),
          },
        ],
        //properties: this.generateProps(serviceName, et, dataTypeImports),
      });
    });

    serviceDefinition.addImportDeclaration({
      isTypeOnly: false,
      namedImports: [...qTypeImports],
      moduleSpecifier: "@odata2ts/odata-query-objects",
    });

    if (modelImports.size) {
      serviceDefinition.addImportDeclaration({
        isTypeOnly: true,
        namedImports: [...modelImports],
        moduleSpecifier: `./${dataModel.getServiceName()}`,
      });
    }
  }

  private collectBaseClassProps(dataModel: DataModel, model: ModelType): Array<PropertyModel> {
    return model.baseClasses.reduce((collector, bc) => {
      const baseModel = dataModel.getModel(bc);
      if (baseModel.baseClasses.length) {
        collector.push(...this.collectBaseClassProps(dataModel, baseModel));
      }

      collector.push(...baseModel.props);
      return collector;
    }, [] as Array<PropertyModel>);
  }

  private generateQueryObjectProps(props: Array<PropertyModel>, qTypeImports: Set<string>) {
    return props.reduce((collector, prop) => {
      const name = prop.odataName;
      // determine matching QPath type
      let qPathType: string | null = null;
      let qPathInit: string;

      if (prop.dataType === DataTypes.EnumType) {
        qPathType = "QEnumPath";
        qPathInit = `new ${qPathType}("${name}")`;
      } else if (prop.dataType === DataTypes.PrimitiveType) {
        // Custom primitive types like DateString or GuidString end on suffix 'String' => remove that
        const baseType = prop.type.replace(/String$/, "");
        qPathType = `Q${upperCaseFirst(baseType)}Path`;
        qPathInit = `new ${qPathType}("${name}")`;
      } else if (prop.dataType === DataTypes.ModelType) {
        qPathType = "QEntityPath";
        qPathInit = `new ${qPathType}("${name}", () => q${upperCaseFirst(prop.type)})`;
      } else {
        throw Error(`Unknonw DataType [${prop.dataType}] for prop with name [${name}]`);
      }

      // factor in collections
      if (prop.isCollection) {
        const cType = `QCollectionPath`;
        const qObject =
          prop.dataType === DataTypes.ModelType
            ? `q${upperCaseFirst(prop.type)}`
            : prop.dataType === DataTypes.EnumType
            ? `qEnumCollection`
            : `q${upperCaseFirst(prop.type)}Collection`;
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

  private async createFormatter(outputPath: string, isEnabled: boolean) {
    const formatter = isEnabled ? new PrettierFormatter(outputPath) : new NoopFormatter(outputPath);
    return await formatter.init();
  }
}
