import { createProjectManager } from "./project/ProjectManager";
import { generateModels, generateQueryObjects, generateServices } from "./generator";
import { SchemaV3 } from "./data-model/edmx/ODataEdmxModelV3";
import { SchemaV4 } from "./data-model/edmx/ODataEdmxModelV4";
import { digest as digestV2 } from "./data-model/DataModelDigestionV2";
import { digest as digestV4 } from "./data-model/DataModelDigestionV4";
import { ODataEdmxModelBase, Schema } from "./data-model/edmx/ODataEdmxModelBase";
import { Modes, RunOptions } from "./OptionModel";

export enum ODataVesions {
  V2,
  V4,
}

/**
 *
 * @param metadataJson metadata of a given OData service already parsed as JSON
 * @param options further options
 */
export async function runApp(metadataJson: ODataEdmxModelBase<any>, options: RunOptions): Promise<void> {
  // determine edmx edmxVersion attribute
  const edmxVersion = metadataJson["edmx:Edmx"].$.Version;
  const version = edmxVersion === "1.0" ? ODataVesions.V2 : ODataVesions.V4;

  // get file name based on service name
  const dataService = metadataJson["edmx:Edmx"]["edmx:DataServices"][0];

  // merge all schemas & take name from first schema
  // TODO only necessary for NorthwindModel => other use cases?
  const schemaRaw = dataService.Schema.reduce(
    (collector, schema) => ({
      ...schema,
      ...collector,
    }),
    {} as Schema<any, any>
  );

  // parse model information from edmx into something we can really work with
  // => that stuff is called dataModel!
  // prettier-ignore
  const dataModel = version === ODataVesions.V2
    ? await digestV2(schemaRaw as SchemaV3, options)
    : await digestV4(schemaRaw as SchemaV4, options);
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
    await generateServices(dataModel, project, version);
  }

  await project.writeFiles();
}
