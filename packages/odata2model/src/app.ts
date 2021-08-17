import { ProjectManager } from "./project/ProjectManager";
import { ServiceGenerator } from "./generator/ServiceGenerator";

import { DataModel } from "./data-model/DataModel";
import { ODataEdmxModel, Schema } from "./odata/ODataEdmxModel";
import { QueryObjectGenerator } from "./generator/QueryObjectGenerator";
import { ModelGenerator } from "./generator/ModelGenerator";
import { Modes, RunOptions } from "./OptionModel";

export class App {
  /**
   *
   * @param metadataJson metadata of a given OData service already parsed as JSON
   * @param options further options
   */
  public async run(metadataJson: ODataEdmxModel, options: RunOptions): Promise<void> {
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
    const project = new ProjectManager(dataModel, options);
    await project.init();

    // Generate Model Interfaces
    // supported edmx types: EntityType, ComplexType, EnumType
    const modelsFile = await project.createModelFile();
    new ModelGenerator(dataModel, modelsFile).generate();

    // await project.writeModelFile();

    // Generate Query Objects
    // supported edmx types: EntityType, ComplexType
    // supported edmx prop types: primitive types, enum types, primitive collection (incl enum types), entity collection, entity object, complex object
    if ([Modes.qobjects, Modes.service, Modes.all].includes(options.mode)) {
      const qFile = await project.createQObjectFile();
      new QueryObjectGenerator(dataModel, qFile).generate();

      // await project.writeQObjectFile();
    }

    // Generate Individual OData-Service
    if ([Modes.service, Modes.all].includes(options.mode)) {
      await new ServiceGenerator(project, dataModel).generate();
      // await project.writeServiceFiles();
    }

    project.writeFiles();
  }
}
