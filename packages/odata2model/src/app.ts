import * as path from "path";
import { remove, writeFile } from "fs-extra";
// import * as morph from "ts-morph";
import {
  OptionalKind,
  Project,
  PropertySignatureStructure,
  SourceFile,
  VariableDeclarationKind,
  Writers,
} from "ts-morph";
import { upperCaseFirst } from "upper-case-first";

import { Odata2tsOptions } from "./cli";
import { NoopFormatter } from "./formatter/NoopFormatter";
import { PrettierFormatter } from "./formatter/PrettierFormatter";
import { EntityType, NavigationProperty, ODataEdmxModel, OdataTypes, Property, Schema } from "./odata/ODataEdmxModel";
import { BaseFormatter } from "./formatter/BaseFormatter";

export interface RunOptions extends Omit<Odata2tsOptions, "source" | "output"> {}

type TsPropType = OptionalKind<PropertySignatureStructure>;

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
      if (index === 0) {
        collector.$ = schema.$;
      }
      const ec = collector.EntityContainer ?? [];
      const et = collector.EntityType ?? [];

      if (schema.EntityContainer) {
        ec.push(...schema.EntityContainer);
      }
      if (schema.EntityType) {
        et.push(...schema.EntityType);
      }

      collector.EntityContainer = ec;
      collector.EntityType = et;

      return collector;
    }, {} as Schema);

    // create ts file which holds all model interfaces
    if (options.mode === "models" || options.mode === "all") {
      await remove(fileNameTypes);
      const serviceDefinition = project.createSourceFile(fileNameTypes);

      this.generateModelInterfaces(serviceName, schema, serviceDefinition);

      this.formatAndWriteFile(fileNameTypes, serviceDefinition, formatter);
    }
    if (options.mode === "qobjects" || options.mode === "all") {
      // create ts file which holds query objects
      const fileNameQObjects = path.join(outputPath, `Q${serviceName}.ts`);
      await remove(fileNameQObjects);
      const qDefinition = project.createSourceFile(fileNameQObjects);

      // generate
      this.generateQueryObjects(serviceName, schema, qDefinition);
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

  private generateModelInterfaces(serviceName: string, schema: Schema, serviceDefinition: SourceFile) {
    const dataTypeImports = new Set<string>();

    schema.EntityType.forEach((et) => {
      serviceDefinition.addInterface({
        name: et.$.Name,
        isExported: true,
        properties: this.generateProps(serviceName, et, dataTypeImports),
      });
    });

    if (dataTypeImports.size) {
      serviceDefinition.addImportDeclaration({
        isTypeOnly: true,
        namedImports: [...dataTypeImports],
        moduleSpecifier: "@odata2ts/odata-query-objects",
      });
    }
  }

  private generateProps(serviceName: string, et: EntityType, dtImports: Set<string>): Array<TsPropType> {
    const props = !et.Property
      ? []
      : et.Property.map(
          (prop) =>
            ({
              name: prop.$.Name,
              type: this.getTsType(prop.$.Type, dtImports),
              hasQuestionToken: prop.$.Nullable !== "false",
            } as TsPropType)
        );
    const navProps = !et.NavigationProperty
      ? []
      : et.NavigationProperty.map(
          (prop) =>
            ({
              name: prop.$.Name,
              type: this.getTsNavType(prop.$.Type, serviceName),
              hasQuestionToken: prop.$.Nullable !== "false",
            } as TsPropType)
        );

    return [...props, ...navProps];
  }

  private getTsType(odataType: OdataTypes, dtImports: Set<string>): string {
    switch (odataType) {
      case OdataTypes.Boolean:
        return "boolean";
      case OdataTypes.Byte:
      case OdataTypes.SByte:
      case OdataTypes.Int16:
      case OdataTypes.Int32:
      case OdataTypes.Int64:
      case OdataTypes.Decimal:
      case OdataTypes.Double:
      case OdataTypes.Single:
        return "number";
      case OdataTypes.String:
        return "string";
      case OdataTypes.Date:
        const dateType = "DateString";
        dtImports.add(dateType);
        return dateType;
      case OdataTypes.Time:
        const timeType = "TimeOfDayString";
        dtImports.add(timeType);
        return timeType;
      case OdataTypes.DateTimeOffset:
        const dateTimeType = "DateTimeOffsetString";
        dtImports.add(dateTimeType);
        return dateTimeType;
      case OdataTypes.Binary:
        const binaryType = "BinaryString";
        dtImports.add(binaryType);
        return binaryType;
      case OdataTypes.Guid:
        const guidType = "GuidString";
        dtImports.add(guidType);
        return guidType;
      default:
        return "string";
    }
  }

  private stripServiceName(name: string, serviceName: string) {
    return name.replace(new RegExp(serviceName + "."), "");
  }

  private getTsNavType(type: string, serviceName: string): string {
    const pureType = this.stripServiceName(type, serviceName);
    if (pureType.match(/^Collection\(/)) {
      return pureType.replace(/^Collection\(([^\)]+)\)/, "Array<$1>");
    }

    return pureType;
  }

  private generateQueryObjects(serviceName: string, schema: Schema, serviceDefinition: SourceFile) {
    const qTypeImports = new Set<string>(["QEntityModel", "QEntityPath", "QEntityCollectionPath"]);
    const dtImports = new Set<string>();

    const collectionNames = schema.EntityContainer[0].EntitySet.reduce((collector, es) => {
      collector[this.stripServiceName(es.$.EntityType, serviceName)] = es.$.Name;
      return collector;
    }, {} as { [key: string]: string });

    schema.EntityType.forEach((et) => {
      const name = upperCaseFirst(et.$.Name);
      const keyRef = et.Key[0].PropertyRef.map((propRef) => `"${propRef.$.Name}"`).join(" | ");
      const propContainer = this.generateQPathProps(serviceName, et, qTypeImports);
      propContainer.__collectionPath = `"${collectionNames[name]}"`;

      dtImports.add(name);

      serviceDefinition.addVariableStatement({
        declarationKind: VariableDeclarationKind.Const,
        isExported: true,
        declarations: [
          {
            name: `q${name}`,
            type: `QEntityModel<${name}, ${keyRef}>`,
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

    if (dtImports.size) {
      serviceDefinition.addImportDeclaration({
        isTypeOnly: true,
        namedImports: [...dtImports],
        moduleSpecifier: `./${serviceName}`,
      });
    }
  }

  private generateQPathProps(serviceName: string, entityType: EntityType, qPathObjectImports: Set<string>) {
    const dataTypeImports = new Set<any>();
    const props = !entityType.Property
      ? {}
      : entityType.Property.reduce((container, prop) => {
          const name = prop.$.Name;
          // transform TS type to QPathObject type
          const qType = this.getQPathByType(this.getTsType(prop.$.Type, dataTypeImports));

          qPathObjectImports.add(qType);

          container[name] = `new ${qType}("${name}")`;
          return container;
        }, {} as { [key: string]: string });

    const navProps = !entityType.NavigationProperty
      ? {}
      : entityType.NavigationProperty.reduce((container, navProp) => {
          const name = navProp.$.Name;
          const [entType, qObj] = this.getQPathEntity(this.getTsNavType(navProp.$.Type, serviceName));
          container[name] = `new ${entType}("${name}", () => ${qObj})`;
          return container;
        }, {} as { [key: string]: string });

    return { ...props, ...navProps };
  }

  private getQPathByType(dataType: string) {
    // Date, TimeOfDay, and DateTimeOffset end on suffix 'String' => remove that
    const cleanedTypeName = dataType.replace(/String$/, "");
    return `Q${upperCaseFirst(cleanedTypeName)}Path`;
  }

  private getQPathEntity(tsType: string) {
    const collectionFound = tsType.match(/^Array<([^>]+)>/);
    const entType = collectionFound ? "QEntityCollectionPath" : "QEntityPath";
    const type = collectionFound ? collectionFound[1] : tsType;

    return [entType, `q${upperCaseFirst(type)}`];
  }

  private async createFormatter(outputPath: string, isEnabled: boolean) {
    const formatter = isEnabled ? new PrettierFormatter(outputPath) : new NoopFormatter(outputPath);
    return await formatter.init();
  }
}
