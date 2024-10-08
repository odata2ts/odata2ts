import { ODataVersions } from "@odata2ts/odata-core";
import { pascalCase } from "change-case";
import { NamespaceWithAlias } from "./data-model/DataModel.js";
import { digest as digestV2 } from "./data-model/DataModelDigestionV2.js";
import { digest as digestV4 } from "./data-model/DataModelDigestionV4.js";
import { ODataEdmxModelBase } from "./data-model/edmx/ODataEdmxModelBase.js";
import { SchemaV3 } from "./data-model/edmx/ODataEdmxModelV3.js";
import { SchemaV4 } from "./data-model/edmx/ODataEdmxModelV4.js";
import { NamingHelper } from "./data-model/NamingHelper.js";
import { generateModels, generateQueryObjects, generateServices } from "./generator/index.js";
import { Modes, RunOptions } from "./OptionModel.js";
import { createProjectManager } from "./project/ProjectManager.js";

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
          .join(", ")}`,
      );
    });

    if (options.disableAutomaticNameClashResolution) {
      throw new Error("Name validation failed: Multiple entities have the same name across different namespaces!");
    }
  }

  // handling the overall generation project
  const project = await createProjectManager(options.output, options.emitMode, namingHelper, dataModel, {
    usePrettier: options.prettier,
    tsConfigPath: options.tsconfig,
    bundledFileGeneration: options.bundledFileGeneration,
    allowTypeChecking: options.debug,
  });

  // const promises: Array<Promise<void>> = [
  // Generate Model Interfaces
  // generateModels(project, dataModel, version, options, namingHelper),
  // ];
  await generateModels(project, dataModel, version, options, namingHelper);
  console.log("Successfully generated models!");

  // Generate Query Objects
  // supported edmx types: EntityType, ComplexType
  // supported edmx prop types: primitive types, enum types, primitive collection (incl enum types), entity collection, entity object, complex object
  if (isQObjectGen(options.mode)) {
    // promises.push(generateQueryObjects(project, dataModel, version, options, namingHelper));
    await generateQueryObjects(project, dataModel, version, options, namingHelper);
    console.log("Successfully generated q-objects!");
  }

  // Generate Individual OData-Service
  if (isServiceGen(options.mode)) {
    // promises.push(generateServices(project, dataModel, version, namingHelper, options));
    await generateServices(project, dataModel, version, namingHelper, options);
    console.log("Successfully generated services!");
  }

  // await Promise.all(promises);
  console.log("Successfully finished!");
}
