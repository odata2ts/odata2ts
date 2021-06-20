import * as path from "path";
import { remove, writeFile } from "fs-extra";
import * as morph from "ts-morph";

import { Odata2tsOptions } from "./cli";
import { NoopFormatter } from "./formatter/NoopFormatter";
import { PrettierFormatter } from "./formatter/PrettierFormatter";
import { EntityType, ODataEdmxModel, OdataTypes, Schema } from "./odata/ODataEdmxModel";
import { BaseFormatter } from "./formatter/BaseFormatter";

export interface RunOptions extends Omit<Odata2tsOptions, "source" | "output"> {}

type TsPropType = morph.OptionalKind<morph.PropertySignatureStructure>;

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
    const project = new morph.Project({
      manipulationSettings: formatter.getSettings(),
      skipAddingFilesFromTsConfig: true,
    });

    // get file name based on service name
    const schema = metadataJson["edmx:Edmx"]["edmx:DataServices"][0].Schema[0];
    const serviceName = schema.$.Namespace;
    const fileName = path.join(outputPath, serviceName + ".ts");

    // create ts file which holds all model interfaces
    await remove(fileName);
    const serviceDefinition = project.createSourceFile(fileName);

    this.createStandardInterfaces(project, outputPath, formatter);
    this.generateModelInterfaces(serviceName, schema, serviceDefinition);

    this.formatAndWriteFile(fileName, serviceDefinition, formatter);

    // console.log(`Result [formatted: ${options.prettier}]`, formatted);
  }

  private async formatAndWriteFile(fileName: string, file: morph.SourceFile, formatter: BaseFormatter) {
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

  private async createStandardInterfaces(project: morph.Project, outputPath: string, formatter: BaseFormatter) {
    const typeFileName = path.join(outputPath, "ODataTypes.ts");
    await remove(typeFileName);
    const file = project.addSourceFileAtPath("src/types/ODataTypes.ts");

    this.formatAndWriteFile(typeFileName, file, formatter);
  }

  private generateModelInterfaces(serviceName: string, schema: Schema, serviceDefinition: morph.SourceFile) {
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
        moduleSpecifier: "./ODataTypes",
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
        return "number";
      case OdataTypes.String:
        return "string";
      case OdataTypes.Date:
        dtImports.add("DateString");
        return "DateString";
      case OdataTypes.Time:
        dtImports.add("TimeOfDayString");
        return "TimeOfDayString";
      case OdataTypes.DateTimeOffset:
        dtImports.add("DateTimeOffsetString");
        return "DateTimeOffsetString";
      default:
        return "any";
    }
  }

  private getTsNavType(type: string, serviceName: string): string {
    const pureType = type.replace(new RegExp(serviceName + "."), "");
    if (pureType.match(/^Collection\(/)) {
      return pureType.replace(/^Collection\(([^\)]+)\)/, "Array<$1>");
    }

    return pureType;
  }

  private async createFormatter(outputPath: string, isEnabled: boolean) {
    const formatter = isEnabled ? new PrettierFormatter(outputPath) : new NoopFormatter(outputPath);
    return await formatter.init();
  }
}
