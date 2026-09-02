import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ODataVersions } from "@odata2ts/odata-core";
import { pascalCase } from "change-case";
import { parseStringPromise } from "xml2js";
import { DataModel, NamespaceWithAlias } from "../../../src/data-model/DataModel.js";
import { digest as digestV2 } from "../../../src/data-model/DataModelDigestionV2.js";
import { digest as digestV4 } from "../../../src/data-model/DataModelDigestionV4.js";
import { ODataEdmxModelBase } from "../../../src/data-model/edmx/ODataEdmxModelBase.js";
import { SchemaV3 } from "../../../src/data-model/edmx/ODataEdmxModelV3.js";
import { SchemaV4 } from "../../../src/data-model/edmx/ODataEdmxModelV4.js";
import { NamingHelper } from "../../../src/data-model/NamingHelper.js";
import { resolveV2Annotations } from "../../../src/data-model/V2AnnotationResolver.js";
import { getTestConfig } from "../../test.config.js";

// The int-test fixtures (`int-test/<server>/resource/library.xml`) live outside this package, at the
// workspace repo's root - not under `packages/odata2ts`. Resolving against this file's own location
// rather than the process cwd is what keeps the path correct regardless of where vitest is invoked from.
const REPO_ROOT = fileURLToPath(new URL("../../../../../", import.meta.url));

/**
 * Digests a real metadata file from disk exactly the way the CLI does it (see
 * `src/cli/serviceGenerationRun.ts` and `src/app.ts`): parse with xml2js, then hand the schemas to the
 * version-specific digester. Exists so tests can exercise the data model against a server's actual
 * declarations instead of a hand-built fixture, which is the whole point where a rule depends on what a
 * real service happens to state in its metadata.
 *
 * @param relativePath path to the metadata file, relative to the repo root, e.g.
 *   `"int-test/asp-net/resource/library.xml"`
 */
export async function digestMetadataFile(relativePath: string): Promise<DataModel> {
  const metadataXml = await readFile(path.join(REPO_ROOT, relativePath));
  const metadataJson = (await parseStringPromise(metadataXml)) as ODataEdmxModelBase<any>;

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

  const namespaces = schemas.map<NamespaceWithAlias>((schema) => [schema.$.Namespace, schema.$.Alias]);
  const detectedSchema = schemas.find((schema) => schema.$.Namespace && schema.EntityType?.length) || schemas[0];
  const serviceName = pascalCase(detectedSchema.$.Namespace);

  const config = getTestConfig();
  // asp-net's real metadata declares both `Location_` (the shelf mark) and `Location` (a navigation
  // property to the branch an item sits in) on `Copy`; camelCase collapses both onto `location`, which
  // `getTestConfig()`'s `allowRenaming: true` turns into a hard digestion error. `int-test/asp-net`'s own
  // `libraryRenamed` service carries the identical fix - see its `odata2ts.config.ts`.
  config.propertiesByName = [{ name: "Location_", mappedName: "shelfLocation" }];
  const namingHelper = new NamingHelper(config, serviceName, namespaces);

  return version === ODataVersions.V2
    ? digestV2(schemas as Array<SchemaV3>, config, namingHelper, references)
    : digestV4(schemas as Array<SchemaV4>, config, namingHelper, references);
}
