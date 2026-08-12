import { ODataVersions } from "@odata2ts/odata-core";
import { pascalCase } from "change-case";
import { NamespaceWithAlias } from "./data-model/DataModel.js";
import { digest as digestV2 } from "./data-model/DataModelDigestionV2.js";
import { digest as digestV4 } from "./data-model/DataModelDigestionV4.js";
import { ODataEdmxModelBase } from "./data-model/edmx/ODataEdmxModelBase.js";
import { SchemaV3 } from "./data-model/edmx/ODataEdmxModelV3.js";
import { SchemaV4 } from "./data-model/edmx/ODataEdmxModelV4.js";
import { NamingHelper } from "./data-model/NamingHelper.js";
import { resolveV2Annotations } from "./data-model/V2AnnotationResolver.js";
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

  // the vocabularies the document draws annotation terms from; they sit outside of the schemas
  const references = metadataJson["edmx:Edmx"]["edmx:Reference"];

  // V2 states what V4 says with a vocabulary term as an attribute in a foreign namespace; translated
  // here, against the whole document, because resolving those namespaces needs the root element
  if (version === ODataVersions.V2) {
    resolveV2Annotations(metadataJson);
  }

  const serviceName = getServiceName(options, schemas);

  const namespaces = schemas.map<NamespaceWithAlias>((schema) => [schema.$.Namespace, schema.$.Alias]);

  // encapsulate the whole naming logic
  const namingHelper = new NamingHelper(options, serviceName, namespaces);
  // parse model information from edmx into something we can really work with
  // => that stuff is called dataModel!
  const dataModel =
    version === ODataVersions.V2
      ? await digestV2(dataService.Schema as Array<SchemaV3>, options, namingHelper, references)
      : await digestV4(dataService.Schema as Array<SchemaV4>, options, namingHelper, references);

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
      const clashes = [...validationErrors.entries()]
        .map(([name, errors]) => `"${name}" (${errors.map((error) => error.fqName).join(", ")})`)
        .join("; ");
      throw new Error(
        `Name validation failed: multiple types have the same name across different namespaces: ${clashes}! ` +
          `Automatic name clash resolution is disabled, so give one of them a name of its own, e.g. ` +
          `byTypeAndName: [{ name: "<fully qualified name>", type: TypeModel.EntityType, mappedName: "SomeOtherName" }].`,
      );
    }
  }

  // handling the overall generation project
  const project = await createProjectManager(options.output, options.emitMode, namingHelper, dataModel, {
    usePrettier: options.prettier,
    tsConfigPath: options.tsconfig,
    bundledFileGeneration: options.bundledFileGeneration,
    allowTypeChecking: options.debug,
    odataVersionV4: options.v4.odataVersion,
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

  // barrels come last: they list what has actually been written
  await project.generateIndexFiles();
  console.log("Successfully generated index files!");

  console.log("Successfully finished!");
}
