import { createProjectManager } from "./project/ProjectManager";
import { generateModels, generateQueryObjects, generateServices } from "./generator";

import { digest } from "./data-model/DataModelDigestion";
import { ODataEdmxModel, Schema } from "./data-model/edmx/ODataEdmxModel";
import { Modes, RunOptions } from "./OptionModel";

/**
 *
 * @param metadataJson metadata of a given OData service already parsed as JSON
 * @param options further options
 */
export async function runApp(metadataJson: ODataEdmxModel, options: RunOptions): Promise<void> {
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
  const dataModel = await digest(schema, options);
  const project = await createProjectManager(
    dataModel.getFileNames(),
    options.output,
    options.emitMode,
    options.prettier
  );

  // Generate Model Interfaces
  // supported edmx types: EntityType, ComplexType, EnumType
  const modelsFile = await project.createModelFile();
  generateModels(dataModel, modelsFile);

  // Generate Query Objects
  // supported edmx types: EntityType, ComplexType
  // supported edmx prop types: primitive types, enum types, primitive collection (incl enum types), entity collection, entity object, complex object
  if ([Modes.qobjects, Modes.service, Modes.all].includes(options.mode)) {
    const qFile = await project.createQObjectFile();
    generateQueryObjects(dataModel, qFile);
  }

  // Generate Individual OData-Service
  if ([Modes.service, Modes.all].includes(options.mode)) {
    await project.cleanServiceDir();
    await generateServices(dataModel, project);
  }

  await project.writeFiles();
}
