import { ServiceGenerator } from "./generator/ServiceGenerator";
import * as path from "path";
import { remove, writeFile } from "fs-extra";
import { Project, SourceFile } from "ts-morph";
import { upperCaseFirst } from "upper-case-first";

import { DataModel } from "./data-model/DataModel";
import { Odata2tsOptions } from "./cli";
import { NoopFormatter } from "./formatter/NoopFormatter";
import { PrettierFormatter } from "./formatter/PrettierFormatter";
import { ODataEdmxModel, Schema } from "./odata/ODataEdmxModel";
import { BaseFormatter } from "./formatter/BaseFormatter";
import { QueryObjectGenerator } from "./generator/QueryObjectGenerator";
import { ModelGenerator } from "./generator/ModelGenerator";

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

    // merge all schemas & take name from first schema
    // TODO only necessary for NorthwindModel => other use cases?
    const schema = dataService.Schema.reduce((collector, schema, index) => {
      return {
        ...schema,
        ...collector,
      };
    }, {} as Schema);

    // parse model information from edmx into something we can really work with
    // => that stuff is called dataModel!
    const dataModel = new DataModel(schema, options);
    const fileNames = dataModel.getFileNames();

    // Generate Model Interfaces
    // supported edmx types: EntityType, ComplexType, EnumType
    if (options.mode === "models" || options.mode === "all") {
      const fileName = this.getTsFilePath(outputPath, fileNames.model);
      await remove(fileName);
      const serviceDefinition = project.createSourceFile(fileName);

      // generate
      new ModelGenerator().generate(dataModel, serviceDefinition);
      this.formatAndWriteFile(fileName, serviceDefinition, formatter);
    }
    // Generate Query Objects
    // supported edmx types: EntityType, ComplexType
    // supported edmx prop types: primitive types, enum types, primitive collection (incl enum types), entity collection, entity object, complex object
    if (options.mode === "qobjects" || options.mode === "all") {
      const fileNameQObjects = this.getTsFilePath(outputPath, fileNames.qObject);

      await remove(fileNameQObjects);
      const qDefinition = project.createSourceFile(fileNameQObjects);

      // generate
      new QueryObjectGenerator().generate(dataModel, qDefinition);
      this.formatAndWriteFile(fileNameQObjects, qDefinition, formatter);
    }

    // Generate Individual OData-Service
    if (options.mode === "service" || options.mode === "all") {
      const fileNameService = this.getTsFilePath(outputPath, fileNames.service);
      await remove(fileNameService);
      const qDefinition = project.createSourceFile(fileNameService);

      new ServiceGenerator().generate(dataModel, qDefinition);
      this.formatAndWriteFile(fileNameService, qDefinition, formatter);
    }
  }

  private getTsFilePath(outputPath: string, name: string): string {
    return path.join(outputPath, `${name}.ts`);
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

  private async createFormatter(outputPath: string, isEnabled: boolean) {
    const formatter = isEnabled ? new PrettierFormatter(outputPath) : new NoopFormatter(outputPath);
    return await formatter.init();
  }
}
