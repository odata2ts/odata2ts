import { ProjectManager } from "./project/ProjectManager";
import { ServiceGenerator } from "./generator/ServiceGenerator";
import { emptyDir, remove, writeFile } from "fs-extra";
import { Project, SourceFile } from "ts-morph";

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
    // get file name based on service name
    // TODO check edmx version attribute
    const dataService = metadataJson["edmx:Edmx"]["edmx:DataServices"][0];

    // merge all schemas & take name from first schema
    // TODO only necessary for NorthwindModel => other use cases?
    const schema = dataService.Schema.reduce(
      (collector, schema) => ({
        ...schema,
        ...collector,
      }),
      {} as Schema
    );

    // parse model information from edmx into something we can really work with
    // => that stuff is called dataModel!
    const dataModel = new DataModel(schema, options);
    const fileNames = dataModel.getFileNames();
    const project = new ProjectManager(dataModel, outputPath, options.prettier);
    await project.init();

    // Generate Model Interfaces
    // supported edmx types: EntityType, ComplexType, EnumType
    if (options.mode === "models" || options.mode === "all") {
      const modelsFile = await project.createModelFile();

      new ModelGenerator(dataModel, modelsFile).generate();

      await project.writeModelFile();
    }
    // Generate Query Objects
    // supported edmx types: EntityType, ComplexType
    // supported edmx prop types: primitive types, enum types, primitive collection (incl enum types), entity collection, entity object, complex object
    if (options.mode === "qobjects" || options.mode === "all") {
      const qFile = await project.createQObjectFile();

      new QueryObjectGenerator(dataModel, qFile).generate();

      await project.writeQObjectFile();
    }

    // Generate Individual OData-Service
    if (options.mode === "service" || options.mode === "all") {
      await project.createMainServiceFile();

      new ServiceGenerator(project, dataModel).generate();

      await project.writeServiceFiles();
    }
  }
}
