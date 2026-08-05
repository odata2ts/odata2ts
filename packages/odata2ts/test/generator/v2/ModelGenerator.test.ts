import { ODataTypesV2, ODataVersions } from "@odata2ts/odata-core";
import { beforeAll, beforeEach, describe, test } from "vitest";
import { digest } from "../../../src/data-model/DataModelDigestionV2.js";
import { generateModels } from "../../../src/generator/index.js";
import { EmitModes, Modes } from "../../../src/index.js";
import { createProjectManager } from "../../../src/project/ProjectManager.js";
import { ODataModelBuilderV2 } from "../../data-model/builder/v2/ODataModelBuilderV2.js";
import {
  createHelper,
  EntityBasedGeneratorFunctionWithoutVersion,
  FixtureComparatorHelper,
} from "../comparator/FixtureComparatorHelper.js";
import { TestOptions } from "../TestTypes.js";
import { createEntityBasedGenerationTests, ENTITY_NAME, SERVICE_NAME } from "./EntityBasedGenerationTests.js";

describe("Model Generator Tests V2", () => {
  const TEST_SUITE_NAME = "Model Generator";
  const FIXTURE_BASE_PATH = "generator/model";
  const MODEL_FILE = "TesterModel";

  const GENERATE: EntityBasedGeneratorFunctionWithoutVersion = async (dataModel, genOptions, namingHelper) => {
    const projectManager = await createProjectManager("build/unitTest", EmitModes.ts, namingHelper, dataModel, {
      noOutput: true,
      bundledFileGeneration: true,
      allowTypeChecking: true,
    });
    await generateModels(projectManager, dataModel, ODataVersions.V2, genOptions, namingHelper);
    return projectManager;
  };

  let odataBuilder: ODataModelBuilderV2;
  let fixtureComparatorHelper: FixtureComparatorHelper;

  function withNs(name: string) {
    return `${SERVICE_NAME}.${name}`;
  }

  createEntityBasedGenerationTests(TEST_SUITE_NAME, FIXTURE_BASE_PATH, MODEL_FILE, GENERATE);

  async function generateAndCompare(fixturePath: string, genOptions?: TestOptions) {
    await fixtureComparatorHelper.generateAndCompare(MODEL_FILE, fixturePath, odataBuilder.getSchemas(), genOptions);
  }

  beforeAll(async () => {
    fixtureComparatorHelper = await createHelper(FIXTURE_BASE_PATH, digest, GENERATE);
  });

  beforeEach(() => {
    odataBuilder = new ODataModelBuilderV2(SERVICE_NAME);
  });

  test(`${TEST_SUITE_NAME}: min function param model`, async () => {
    // given a simple function
    odataBuilder.addFunctionImport("MinOperation", ODataTypesV2.String, (builder) =>
      builder.addParam("test", ODataTypesV2.String, false).addParam("optTest", ODataTypesV2.String, true),
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("operation-min.ts");
  });

  test(`${TEST_SUITE_NAME}: max function param model`, async () => {
    odataBuilder.addFunctionImport("maxOperation", ODataTypesV2.String, (builder) =>
      builder
        .addParam("test", ODataTypesV2.String, false)
        .addParam("testNumber", ODataTypesV2.Int32, false)
        .addParam("testBoolean", ODataTypesV2.Boolean, false)
        .addParam("testGuid", ODataTypesV2.Guid, false)
        .addParam("testTime", ODataTypesV2.Time, false)
        .addParam("testDateOrDateTime", ODataTypesV2.DateTime, false)
        .addParam("testDateTimeOffset", ODataTypesV2.DateTimeOffset, false),
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("operation-max.ts");
  });

  test(`${TEST_SUITE_NAME}: extra results wrapping`, async () => {
    // given one minimal model
    odataBuilder
      .addEntityType("Author", undefined, (builder) =>
        builder.addKeyProp("id", ODataTypesV2.Int32).addProp("name", ODataTypesV2.Boolean, true),
      )
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder.addKeyProp("id", ODataTypesV2.Int32).addProp("relatedAuthors", `Collection(${withNs("Author")})`),
      );

    // when generating model
    // then match fixture text
    await generateAndCompare("entity-relationships-v2-extra-wrapping.ts", {
      v2ResponseResultsWrapping: true,
    });
  });

  test(`${TEST_SUITE_NAME}: the extra results wrapping is an entity collection's business`, async () => {
    // given a model whose collections are of a primitive and of a complex type
    odataBuilder
      .addComplexType("Address", undefined, (builder) => builder.addProp("street", ODataTypesV2.String))
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV2.Int32)
          .addProp("keywords", `Collection(${ODataTypesV2.String})`)
          .addProp("previousAddresses", `Collection(${withNs("Address")})`),
      );

    // when opting into the extra wrapping
    // then both stay plain arrays: the `results` object is how V2 serialises a feed, so it belongs to an
    // entity collection alone - CAP's V2 adapter wraps an expanded navigation property and hands over a
    // primitive or complex collection bare
    await generateAndCompare("entity-collections-v2-extra-wrapping.ts", {
      v2ResponseResultsWrapping: true,
      v2PayloadResultsWrapping: true,
      skipEditableModels: false,
    });
  });

  test(`${TEST_SUITE_NAME}: binding notation of V2`, async () => {
    // given entities related to each other by an association, which is how V2 expresses it
    odataBuilder
      .addEntityType("Author", undefined, (builder) => builder.addKeyProp("id", ODataTypesV2.Int32))
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV2.Int32)
          .addNavProp("author", withNs("Author"), "Book_Author", "1")
          .addNavProp("relatedAuthors", withNs("Author"), "Book_RelatedAuthors", "*"),
      );

    // when generating without a service
    // then the editable model uses the __metadata uri notation
    await generateAndCompare("entity-relationships-binding-v2.ts", {
      disableDeepInsertProps: true,
      mode: Modes.models,
      skipEditableModels: false,
      skipIdModels: false,
      disableAutoManagedKey: true,
    });
  });

  function addRelatedEntities() {
    odataBuilder
      .addEntityType("Author", undefined, (builder) => builder.addKeyProp("id", ODataTypesV2.Int32))
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV2.Int32)
          .addNavProp("author", withNs("Author"), "Book_Author", "1")
          .addNavProp("relatedAuthors", withNs("Author"), "Book_RelatedAuthors", "*"),
      );
  }

  test(`${TEST_SUITE_NAME}: deep insert props`, async () => {
    // given entities related to each other
    addRelatedEntities();

    // when opting into the deep insert props
    // then the navigation properties show up on the editable model, typed as the editable model of the
    // related entity
    await generateAndCompare("entity-relationships-deep-insert-v2.ts", {
      skipEditableModels: false,
      skipIdModels: false,
      disableAutoManagedKey: true,
    });
  });

  test(`${TEST_SUITE_NAME}: deep insert props with extra results wrapping`, async () => {
    // given entities related to each other
    addRelatedEntities();

    // when opting into the extra wrapping for editable models
    // then only the collection valued navigation property carries the extra results object
    await generateAndCompare("entity-relationships-deep-insert-v2-extra-wrapping.ts", {
      v2PayloadResultsWrapping: true,
      skipEditableModels: false,
      skipIdModels: false,
      disableAutoManagedKey: true,
    });
  });

  test(`${TEST_SUITE_NAME}: the wrapping of the readable models does not reach the editable ones`, async () => {
    // given entities related to each other
    addRelatedEntities();

    // when only the readable models are asked to carry the extra wrapping
    // then the deep insert props stay unwrapped: a service answering with the wrapping does not
    // necessarily expect it in a request payload, see issue #237
    await generateAndCompare("entity-relationships-deep-insert-v2-response-wrapping.ts", {
      v2ResponseResultsWrapping: true,
      skipEditableModels: false,
      skipIdModels: false,
      disableAutoManagedKey: true,
    });
  });

  test(`${TEST_SUITE_NAME}: deep insert and binding props share the property in V2`, async () => {
    // given entities related to each other
    addRelatedEntities();

    // when opting into both
    // then the navigation property accepts either shape, since V2 addresses a binding by the very name
    // of the navigation property
    await generateAndCompare("entity-relationships-deep-insert-binding-v2.ts", {
      mode: Modes.models,
      skipEditableModels: false,
      skipIdModels: false,
      disableAutoManagedKey: true,
    });
  });
  /**
   * The entity sets, plus the AssociationSets which state by which of them the ends of the associations
   * are realized - the V2 counterpart of a NavigationPropertyBinding. Without them a binding cannot be
   * expressed by key, since the URL of the referenced entity is built from that entity set.
   */
  function addRelatedEntitySets() {
    odataBuilder
      .addEntitySet("Books", withNs(ENTITY_NAME))
      .addEntitySet("Authors", withNs("Author"))
      .addAssociationSet("Book_Author_Set", "Book_Author", [
        { role: "Book_Author", entitySet: "Books" },
        { role: "Author_Book", entitySet: "Authors" },
      ])
      .addAssociationSet("Book_RelatedAuthors_Set", "Book_RelatedAuthors", [
        { role: "Book_Author", entitySet: "Books" },
        { role: "Author_Book", entitySet: "Authors" },
      ]);
  }

  test(`${TEST_SUITE_NAME}: binding props by key`, async () => {
    // given entities related to each other, reachable through entity sets
    addRelatedEntities();
    addRelatedEntitySets();

    // when opting into the binding props while a service is generated
    // then the binding goes by the navigation property itself and carries the key of the entity to bind,
    // which the query objects turn into the __metadata uri notation
    await generateAndCompare("entity-relationships-binding-by-key-v2.ts", {
      disableDeepInsertProps: true,
      skipEditableModels: false,
      skipIdModels: false,
      disableAutoManagedKey: true,
    });
  });

  test(`${TEST_SUITE_NAME}: deep insert and binding props share the property when bound by key`, async () => {
    // given entities related to each other, reachable through entity sets
    addRelatedEntities();
    addRelatedEntitySets();

    // when opting into both while a service is generated
    // then the navigation property accepts either shape - a new entity or the key of an existing one -
    // and the "@id" property tells them apart
    await generateAndCompare("entity-relationships-deep-insert-binding-by-key-v2.ts", {
      skipEditableModels: false,
      skipIdModels: false,
      disableAutoManagedKey: true,
    });
  });
});
