import { ODataVersions } from "@odata2ts/odata-core";
import { pascalCase } from "pascal-case";

import { NamespaceWithAlias } from "./data-model/DataModel";
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

function getServiceName(options: RunOptions, schemas: Array<SchemaV3 | SchemaV4>) {
  if (options.serviceName) {
    return options.serviceName;
  }

  // auto-detection of first namespace with defined EntityTypes
  // NOTE: we make use of PascalCase here to enforce valid class names
  const detectedSchema = schemas.find((schema) => schema.$.Namespace && schema.EntityType?.length) || schemas[0];
  const serviceName = detectedSchema.$.Namespace;
  return pascalCase(serviceName);
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
  const schemas = dataService.Schema as Array<SchemaV3 | SchemaV4>;

  const serviceName = getServiceName(options, schemas);

  const namespaces = schemas.map<NamespaceWithAlias>((schema) => [schema.$.Namespace, schema.$.Alias]);

  // encapsulate the whole naming logic
  const namingHelper = new NamingHelper(options, serviceName, namespaces);
  // parse model information from edmx into something we can really work with
  // => that stuff is called dataModel!
  const dataModel =
    version === ODataVersions.V2
      ? await digestV2(dataService.Schema as Array<SchemaV3>, options, namingHelper)
      : await digestV4(dataService.Schema as Array<SchemaV4>, options, namingHelper);

  // Validation of entity names: the same name might be used across different namespaces
  const validationErrors = dataModel.getNameValidation();
  if (validationErrors.size) {
    console.log("---");
    validationErrors.forEach((errors, name) => {
      console.log(
        `Duplicate name: ${name} - Fully Qualified Names: ${errors
          .map((error) => error.fqName + (error.renamedTo ? ` (renamed to: ${error.renamedTo})` : ""))
          .join(", ")}`
      );
    });

    if (options.disableAutomaticNameClashResolution) {
      throw new Error("Name validation failed: Multiple entities have the same name across different namespaces!");
    }
  }

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
    await generateServices(dataModel, project, version, namingHelper, options);
  }

  await project.writeFiles();
}
