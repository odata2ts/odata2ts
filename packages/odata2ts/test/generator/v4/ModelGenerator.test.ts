import { ODataTypesV4, ODataVersions } from "@odata2ts/odata-core";
import { beforeAll, beforeEach, describe, test } from "vitest";
import { digest } from "../../../src/data-model/DataModelDigestionV4.js";
import { generateModels } from "../../../src/generator/index.js";
import { EmitModes, ManagedPropertyDetection, Modes } from "../../../src/index.js";
import { createProjectManager } from "../../../src/project/ProjectManager.js";
import { allowedValues, core, corePermissions } from "../../data-model/builder/ODataAnnotationBuilder.js";
import { ODataModelBuilderV4 } from "../../data-model/builder/v4/ODataModelBuilderV4.js";
import {
  createHelper,
  EntityBasedGeneratorFunctionWithoutVersion,
  FixtureComparatorHelper,
} from "../comparator/FixtureComparatorHelper.js";
import { TestOptions } from "../TestTypes.js";
import { createEntityBasedGenerationTests, ENTITY_NAME, SERVICE_NAME } from "./EntityBasedGenerationTests.js";

describe("Model Generator Tests V4", () => {
  const TEST_SUITE_NAME = "Model Generator";
  const FIXTURE_BASE_PATH = "generator/model";
  const MODEL_FILE = "TesterModel";

  const GENERATE: EntityBasedGeneratorFunctionWithoutVersion = async (dataModel, genOptions, namingHelper) => {
    const projectManager = await createProjectManager("build/unitTest", EmitModes.ts, namingHelper, dataModel, {
      noOutput: true,
      bundledFileGeneration: true,
      allowTypeChecking: true,
    });
    await generateModels(projectManager, dataModel, ODataVersions.V4, genOptions, namingHelper);
    return projectManager;
  };

  let odataBuilder: ODataModelBuilderV4;
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
    odataBuilder = new ODataModelBuilderV4(SERVICE_NAME);
  });

  test(`${TEST_SUITE_NAME}: min function param model`, async () => {
    // given a simple function
    odataBuilder.addFunction("MinOperation", ODataTypesV4.String, false, (builder) =>
      builder.addParam("test", ODataTypesV4.String, false).addParam("optTest", ODataTypesV4.String, true),
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("operation-min.ts");
  });

  test(`${TEST_SUITE_NAME}: min action param model`, async () => {
    // given a simple action
    // @note: return type doesn't affect param model
    odataBuilder.addAction("MinOperation", ODataTypesV4.Guid, false, (builder) =>
      builder.addParam("test", ODataTypesV4.String, false).addParam("optTest", ODataTypesV4.String, true),
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("operation-min.ts");
  });

  test(`${TEST_SUITE_NAME}: max function param model`, async () => {
    // given a function
    odataBuilder.addFunction("maxOperation", ODataTypesV4.String, false, (builder) =>
      builder
        .addParam("test", ODataTypesV4.String, false)
        .addParam("testNumber", ODataTypesV4.Int32, false)
        .addParam("testBoolean", ODataTypesV4.Boolean, false)
        .addParam("testGuid", ODataTypesV4.Guid, false)
        .addParam("testTime", ODataTypesV4.TimeOfDay, false)
        .addParam("testDateOrDateTime", ODataTypesV4.Date, false)
        .addParam("testDateTimeOffset", ODataTypesV4.DateTimeOffset, false),
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("operation-max.ts");
  });

  test(`${TEST_SUITE_NAME}: max action param model`, async () => {
    // given an action
    odataBuilder.addAction("maxOperation", ODataTypesV4.String, false, (builder) =>
      builder
        .addParam("test", ODataTypesV4.String, false)
        .addParam("testNumber", ODataTypesV4.Int32, false)
        .addParam("testBoolean", ODataTypesV4.Boolean, false)
        .addParam("testGuid", ODataTypesV4.Guid, false)
        .addParam("testTime", ODataTypesV4.TimeOfDay, false)
        .addParam("testDateOrDateTime", ODataTypesV4.Date, false)
        .addParam("testDateTimeOffset", ODataTypesV4.DateTimeOffset, false),
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("operation-max.ts");
  });

  test(`${TEST_SUITE_NAME}: bound function`, async () => {
    // given one minimal model with bound function
    odataBuilder
      .addEntityType(ENTITY_NAME, undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.Boolean))
      .addFunction("MinOperation", ODataTypesV4.String, true, (builder) =>
        builder
          .addParam("book", `${withNs("Book")}`)
          .addParam("test", ODataTypesV4.String, false)
          .addParam("optTest", ODataTypesV4.String, true),
      );

    // when generating model
    // then match fixture text
    await generateAndCompare("operation-bound.ts");
  });

  test(`${TEST_SUITE_NAME}: collection bound function`, async () => {
    // given one minimal model with bound function
    odataBuilder
      .addEntityType(ENTITY_NAME, undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.Boolean))
      .addFunction("MinOperation", ODataTypesV4.String, true, (builder) =>
        builder
          .addParam("book", `Collection(${withNs("Book")})`)
          .addParam("test", ODataTypesV4.String, false)
          .addParam("optTest", ODataTypesV4.String, true),
      );

    // when generating model
    // then the params model is named after the *collection* binding: an operation bound to a single
    // instance and one bound to the collection are different overloads and must not share a name.
    await generateAndCompare("operation-bound-collection.ts");
  });

  test(`${TEST_SUITE_NAME}: Entity relationships`, async () => {
    // given one minimal model
    // given one minimal model
    odataBuilder
      .addEntityType("Author", undefined, (builder) =>
        builder.addKeyProp("id", ODataTypesV4.Int32).addProp("name", ODataTypesV4.Boolean, true),
      )
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV4.Int32)
          .addProp("author", `${withNs("Author")}`, false)
          .addProp("altAuthor", `${withNs("Author")}`, true)
          .addProp("relatedAuthors", `Collection(${withNs("Author")})`),
      );

    // when generating model
    // then match original fixture => config option has no effect
    await generateAndCompare("entity-relationships.ts", {
      disableBindingProps: true,
      disableDeepInsertProps: true,
      v2: { responseResultsWrapping: true },
      skipEditableModels: false,
      skipIdModels: false,
      managedPropertyDetection: ManagedPropertyDetection.annotation,
    });
  });

  test(`${TEST_SUITE_NAME}: model with comments`, async () => {
    // given one max model
    odataBuilder.addEntityType(ENTITY_NAME, undefined, (builder) =>
      builder
        .addKeyProp("id", ODataTypesV4.Guid)
        .addProp("truth", ODataTypesV4.Boolean, false)
        .addProp("time", ODataTypesV4.TimeOfDay)
        .addProp("multipleStrings", `Collection(${ODataTypesV4.String})`),
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("entity-with-comments.ts", {
      skipComments: false,
      converters: [{ module: "@odata2ts/test-converters", use: ["booleanToNumberConverter"] }],
      propertiesByName: [...["id"].map((name) => ({ name, managed: true }))],
    });
  });

  test(`${TEST_SUITE_NAME}: managed states from Core annotations`, async () => {
    /*
     * What each of the `Org.OData.Core.V1` terms does to the two models: `Computed` takes the property out
     * of the editable one, `Permissions` granting only `Write` out of the model itself, while
     * `ComputedDefaultValue` and `Immutable` leave it in both but never require it. The terms are spelled
     * out in full here, the way ASP.NET states them - aliases are the digester's business, not the
     * generator's.
     */
    odataBuilder.addEntityType(ENTITY_NAME, undefined, (builder) =>
      builder
        .addKeyProp("id", ODataTypesV4.Guid)
        .addProp("title", ODataTypesV4.String, false)
        .addProp("popularityScore", ODataTypesV4.Double, true)
        .addProp("createdAt", ODataTypesV4.DateTimeOffset, false)
        .addProp("isbnCode", ODataTypesV4.String, false)
        .addProp("secret", ODataTypesV4.String, false)
        .addPropAnnotations("popularityScore", [core("Computed", { bool: true, fullyQualified: true })])
        .addPropAnnotations("createdAt", [core("ComputedDefaultValue", { bool: true, fullyQualified: true })])
        .addPropAnnotations("isbnCode", [core("Immutable", { bool: true, fullyQualified: true })])
        .addPropAnnotations("secret", [corePermissions(["Write"], { fullyQualified: true })]),
    );

    await generateAndCompare("entity-managed-states.ts", {
      skipComments: false,
      skipEditableModels: false,
      skipIdModels: false,
    });
  });

  test(`${TEST_SUITE_NAME}: enums derived from allowed values`, async () => {
    /*
     * The shape CAP puts an enum in: the property keeps its primitive type and the members sit in a
     * `Validation.AllowedValues` annotation, each with its name in a nested `Core.SymbolicName`. Since the
     * service transmits the value rather than the name, a converter is generated next to the enum - unless
     * the members are generated as those very values, which `enumType: "numeric"` does.
     */
    /*
     * Rebuilt for each variant: the digester derives the enum by rewriting the metadata, exactly as it
     * unflattens complex types, so a model that has been through it once already carries the result.
     */
    const buildModel = () => {
      odataBuilder = new ODataModelBuilderV4(SERVICE_NAME);
      odataBuilder.addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV4.Guid)
          .addProp("status", ODataTypesV4.Byte, false)
          .addPropAnnotations("status", [
            allowedValues(
              [
                { name: "Available", value: 0 },
                { name: "OnLoan", value: 1 },
                { name: "Missing", value: 2 },
              ],
              { fullyQualified: true },
            ),
          ]),
      );
    };

    buildModel();
    await generateAndCompare("entity-enum-allowed-values.ts", { enumByAllowedValues: true, skipComments: false });
    buildModel();
    await generateAndCompare("entity-enum-allowed-values-numeric.ts", {
      enumByAllowedValues: true,
      enumType: "numeric",
    });
    buildModel();
    await generateAndCompare("entity-enum-allowed-values-string-union.ts", {
      enumByAllowedValues: true,
      enumType: "string-union",
    });
  });

  test(`${TEST_SUITE_NAME}: convert to a type living in a namespace`, async () => {
    /*
     * A converter may target a type that only exists inside a namespace - bignumber.js' instance type
     * really is `BigNumber.Instance`. Only the root of such a name can be imported, the qualifier has
     * to stay at the use site, so the import and the property type differ here.
     */
    odataBuilder.addEntityType(ENTITY_NAME, undefined, (builder) =>
      builder.addKeyProp("id", ODataTypesV4.Boolean).addProp("optional", ODataTypesV4.String, true),
    );

    await generateAndCompare("entity-converter-with-namespaced-model.ts", {
      converters: [{ module: "@odata2ts/test-converters", use: ["stringToNamespacedModelConverter"] }],
    });
  });

  test(`${TEST_SUITE_NAME}: overloaded function params`, async () => {
    const testFunc = "testFunc";

    // given two functions with same name but different set of parameters
    odataBuilder
      .addFunction(testFunc, ODataTypesV4.String, false, (pBuilder) =>
        pBuilder.addParam("anyParam", ODataTypesV4.Boolean, false),
      )
      .addFunction(testFunc, ODataTypesV4.String, false);

    // when generating parameter model
    // then match fixture text
    await generateAndCompare("function-overload.ts");
  });

  test(`${TEST_SUITE_NAME}: overloaded function params (changed order)`, async () => {
    const testFunc = "testFunc";

    // given two functions with same name but different set of parameters
    odataBuilder
      .addFunction(testFunc, ODataTypesV4.String, false)
      .addFunction(testFunc, ODataTypesV4.String, false, (pBuilder) =>
        pBuilder.addParam("anyParam", ODataTypesV4.Boolean, false),
      );

    // when generating parameter model
    // then match fixture text
    await generateAndCompare("function-overload.ts");
  });

  test(`${TEST_SUITE_NAME}: overloaded function params (multiple sets)`, async () => {
    const testFunc = "testFunc";

    // given two functions with same name but different set of parameters
    odataBuilder
      .addFunction(testFunc, ODataTypesV4.String, false, (pBuilder) => {
        pBuilder.addParam("myParam", ODataTypesV4.String, false);
      })
      .addFunction(testFunc, ODataTypesV4.String, false, (pBuilder) =>
        pBuilder.addParam("anyParam", ODataTypesV4.Boolean, false),
      )
      .addFunction(testFunc, ODataTypesV4.String, false, (pBuilder) =>
        pBuilder.addParam("x", ODataTypesV4.Int32, false).addParam("y", ODataTypesV4.Int32, true),
      );

    // when generating parameter model
    // then match fixture text
    await generateAndCompare("function-overload-multiple.ts", {});
  });

  test(`${TEST_SUITE_NAME}: binding notation of OData 4.01`, async () => {
    // given entities related to each other
    odataBuilder
      .addEntityType("Author", undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.Int32))
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV4.Int32)
          .addProp("author", withNs("Author"), false)
          .addProp("altAuthor", withNs("Author"), true)
          .addProp("relatedAuthors", `Collection(${withNs("Author")})`),
      );

    // when generating for 4.01 without a service
    // then the editable model uses the short form instead of the @odata.bind notation
    await generateAndCompare("entity-relationships-v401.ts", {
      disableDeepInsertProps: true,
      mode: Modes.models,
      v4: { odataVersion: "4.01" },
      skipEditableModels: false,
      skipIdModels: false,
      managedPropertyDetection: ManagedPropertyDetection.annotation,
    });
  });

  test(`${TEST_SUITE_NAME}: no binding props for OData 4.01 when switched off`, async () => {
    // given entities related to each other
    odataBuilder
      .addEntityType("Author", undefined, (builder) =>
        builder.addKeyProp("id", ODataTypesV4.Int32).addProp("name", ODataTypesV4.Boolean, true),
      )
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV4.Int32)
          .addProp("author", withNs("Author"), false)
          .addProp("altAuthor", withNs("Author"), true)
          .addProp("relatedAuthors", `Collection(${withNs("Author")})`),
      );

    // when generating for 4.01 with both switched off
    // then no binding prop at all: in 4.01 it goes by the name of the navigation property itself,
    // so it must be absent rather than show up with the binding type
    await generateAndCompare("entity-relationships.ts", {
      v4: { odataVersion: "4.01" },
      disableBindingProps: true,
      disableDeepInsertProps: true,
      skipEditableModels: false,
      skipIdModels: false,
      managedPropertyDetection: ManagedPropertyDetection.annotation,
    });
  });

  test(`${TEST_SUITE_NAME}: binding props of OData 4.0`, async () => {
    // given entities related to each other
    odataBuilder
      .addEntityType("Author", undefined, (builder) =>
        builder.addKeyProp("id", ODataTypesV4.Int32).addProp("name", ODataTypesV4.Boolean, true),
      )
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV4.Int32)
          .addProp("author", withNs("Author"), false)
          .addProp("altAuthor", withNs("Author"), true)
          .addProp("relatedAuthors", `Collection(${withNs("Author")})`),
      );

    // when opting into the binding props without a service
    // then the editable model allows to bind an existing entity via the @odata.bind notation
    await generateAndCompare("entity-relationships-binding.ts", {
      disableDeepInsertProps: true,
      mode: Modes.models,
      skipEditableModels: false,
      skipIdModels: false,
      managedPropertyDetection: ManagedPropertyDetection.annotation,
    });
  });

  function addRelatedEntities() {
    odataBuilder
      .addEntityType("Author", undefined, (builder) =>
        builder.addKeyProp("id", ODataTypesV4.Int32).addProp("name", ODataTypesV4.Boolean, true),
      )
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV4.Int32)
          .addProp("author", withNs("Author"), false)
          .addProp("altAuthor", withNs("Author"), true)
          .addProp("relatedAuthors", `Collection(${withNs("Author")})`),
      );
  }

  /**
   * The entity sets, plus the NavigationPropertyBindings which state where the navigation properties of
   * a book point to. Without them a binding cannot be expressed by key, since the URL of the referenced
   * entity is built from the entity set it lives in.
   */
  function addRelatedEntitySets() {
    odataBuilder.addEntitySet("Authors", withNs("Author")).addEntitySet("Books", withNs(ENTITY_NAME), [
      { path: "author", target: "Authors" },
      { path: "altAuthor", target: "Authors" },
      { path: "relatedAuthors", target: "Authors" },
    ]);
  }

  test(`${TEST_SUITE_NAME}: binding props by key`, async () => {
    // given entities related to each other, reachable through entity sets
    addRelatedEntities();
    addRelatedEntitySets();

    // when opting into the binding props while a service is generated
    // then the binding goes by the navigation property itself and carries the key of the entity to bind,
    // which the query objects turn into the URL the wire notation asks for
    await generateAndCompare("entity-relationships-binding-by-key.ts", {
      disableDeepInsertProps: true,
      skipEditableModels: false,
      skipIdModels: false,
      managedPropertyDetection: ManagedPropertyDetection.annotation,
    });
  });

  test(`${TEST_SUITE_NAME}: deep insert and binding props share the property when bound by key`, async () => {
    // given entities related to each other, reachable through entity sets
    addRelatedEntities();
    addRelatedEntitySets();

    // when opting into both while a service is generated
    // then the navigation property accepts either shape - a new entity or the key of an existing one -
    // and the "@id" property tells them apart
    await generateAndCompare("entity-relationships-deep-insert-binding-by-key.ts", {
      skipEditableModels: false,
      skipIdModels: false,
      managedPropertyDetection: ManagedPropertyDetection.annotation,
    });
  });

  test(`${TEST_SUITE_NAME}: no binding props by key without a NavigationPropertyBinding`, async () => {
    // given entities related to each other, but no entity set stating where the navigation leads
    addRelatedEntities();

    // when opting into the binding props while a service is generated
    // then no binding prop at all: the URL of the referenced entity could not be built
    await generateAndCompare("entity-relationships.ts", {
      disableBindingProps: true,
      disableDeepInsertProps: true,
      skipEditableModels: false,
      skipIdModels: false,
      managedPropertyDetection: ManagedPropertyDetection.annotation,
    });
  });

  test(`${TEST_SUITE_NAME}: deep insert props`, async () => {
    // given entities related to each other
    addRelatedEntities();

    // when opting into the deep insert props
    // then the navigation properties show up on the editable model, typed as the editable model of the
    // related entity - which is what travels within the payload of a deep insert or deep update
    await generateAndCompare("entity-relationships-deep-insert.ts", {
      disableBindingProps: true,
      skipEditableModels: false,
      skipIdModels: false,
      managedPropertyDetection: ManagedPropertyDetection.annotation,
    });
  });

  test(`${TEST_SUITE_NAME}: deep insert and binding props side by side (4.0)`, async () => {
    // given entities related to each other
    addRelatedEntities();

    // when opting into both
    // then both show up separately, since 4.0 spells a binding with a name of its own
    await generateAndCompare("entity-relationships-deep-insert-binding.ts", {
      mode: Modes.models,
      skipEditableModels: false,
      skipIdModels: false,
      managedPropertyDetection: ManagedPropertyDetection.annotation,
    });
  });

  test(`${TEST_SUITE_NAME}: deep insert and binding props share the property in 4.01`, async () => {
    // given entities related to each other
    addRelatedEntities();

    // when opting into both for 4.01
    // then the navigation property accepts either shape: a new entity or a reference to an existing one,
    // because 4.01 addresses a binding by the very name of the navigation property
    await generateAndCompare("entity-relationships-deep-insert-binding-v401.ts", {
      mode: Modes.models,
      v4: { odataVersion: "4.01" },
      skipEditableModels: false,
      skipIdModels: false,
      managedPropertyDetection: ManagedPropertyDetection.annotation,
    });
  });

  test(`${TEST_SUITE_NAME}: no extra results wrapping for deep insert props in V4`, async () => {
    // given entities related to each other
    addRelatedEntities();

    // when the V2 option is set on a V4 service
    // then it has no effect at all - the wrapping is a V2 speciality
    await generateAndCompare("entity-relationships-deep-insert.ts", {
      disableBindingProps: true,
      v2: { payloadResultsWrapping: true },
      skipEditableModels: false,
      skipIdModels: false,
      managedPropertyDetection: ManagedPropertyDetection.annotation,
    });
  });

  test(`${TEST_SUITE_NAME}: stream property is no part of any model`, async () => {
    // given an entity with a stream property
    odataBuilder.addEntityType("Audiobook", undefined, (builder) =>
      builder
        .addKeyProp("id", ODataTypesV4.Guid)
        .addProp("title", ODataTypesV4.String, false)
        .addProp("Sample", ODataTypesV4.Stream),
    );

    // when generating models
    // then `Sample` is absent from both models: binary content is not part of the JSON payload, so a
    // property of type string would promise a value no server ever sends - and it cannot be written
    // through create/update either, only through its own URL
    await generateAndCompare("entity-stream-property.ts", { skipEditableModels: false });
  });
});
