import { ODataVersions } from "@odata2ts/odata-core";

import { digest as digestV2 } from "./data-model/DataModelDigestionV2";
import { digest as digestV4 } from "./data-model/DataModelDigestionV4";
import { ODataEdmxModelBase, Schema } from "./data-model/edmx/ODataEdmxModelBase";
import { SchemaV3 } from "./data-model/edmx/ODataEdmxModelV3";
import { SchemaV4 } from "./data-model/edmx/ODataEdmxModelV4";
import { NamingHelper } from "./data-model/NamingHelper";
import { generateModels, generateQueryObjects, generateServices } from "./generator";
import { Modes, RunOptions } from "./OptionModel";
import { createProjectManager } from "./project/ProjectManager";

function isQObjectGen(mode: Modes) {
  return [Modes.qobjects, Modes.service, Modes.all].includes(mode);
}

function isServiceGen(mode: Modes) {
  return [Modes.service, Modes.all].includes(mode);
}

/**
 *
 * @param metadataJson metadata of a given OData service already parsed as JSON
 * @param options further options
 */
export async function runApp(metadataJson: ODataEdmxModelBase<any>, options: RunOptions): Promise<void> {
  // determine edmx edmxVersion attribute
  const edmxVersion = metadataJson["edmx:Edmx"].$.Version;
  const version = edmxVersion === "1.0" ? ODataVersions.V2 : ODataVersions.V4;

  const dataService = metadataJson["edmx:Edmx"]["edmx:DataServices"][0];

  // handling multiple schemas => merge them
  // const schemaRaw = dataService.Schema.reduce(
  //   (collector, schema) => ({
  //     ...schema,
  //     ...collector,
  //   }),
  //   {} as Schema<any, any>
  // );
  const detectedServiceName =
    dataService.Schema.length === 1
      ? dataService.Schema[0].$.Namespace
      : dataService.Schema.find((schema) => !schema.EntityContainer)?.$.Namespace;
  const serviceNames = dataService.Schema.map((s) => s.$.Namespace);

  // encapsulate the whole naming logic
  const namingHelper = new NamingHelper(options, options.serviceName || detectedServiceName, serviceNames);
  // parse model information from edmx into something we can really work with
  // => that stuff is called dataModel!
  const dataModel =
    version === ODataVersions.V2
      ? await digestV2(dataService.Schema as Array<SchemaV3>, options, namingHelper)
      : await digestV4(dataService.Schema as Array<SchemaV4>, options, namingHelper);
  // handling the overall generation project
  const project = await createProjectManager(
    namingHelper.getFileNames(),
    options.output,
    options.emitMode,
    options.prettier,
    options.tsconfig
  );

  // Generate Model Interfaces
  // supported edmx types: EntityType, ComplexType, EnumType
  const modelsFile = await project.createModelFile();
  generateModels(dataModel, modelsFile, version, options, namingHelper);

  // Generate Query Objects
  // supported edmx types: EntityType, ComplexType
  // supported edmx prop types: primitive types, enum types, primitive collection (incl enum types), entity collection, entity object, complex object
  if (isQObjectGen(options.mode)) {
    const qFile = await project.createQObjectFile();
    generateQueryObjects(dataModel, qFile, version, options, namingHelper);
  }

  // Generate Individual OData-Service
  if (isServiceGen(options.mode)) {
    await project.cleanServiceDir();
    await generateServices(dataModel, project, version, namingHelper);
  }

  await project.writeFiles();
}
