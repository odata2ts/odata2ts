import path from "path";
import { ODataTypesV4, ODataVersions } from "@odata2ts/odata-core";
import deepmerge from "deepmerge";
import { beforeAll, beforeEach, describe, expect, test } from "vitest";
import { digest } from "../../../src/data-model/DataModelDigestionV4.js";
import { NamingHelper } from "../../../src/data-model/NamingHelper.js";
import {
  ConfigFileOptions,
  EmitModes,
  KeyProperties,
  ManagedPropertyMode,
  NamingStrategies,
  OverridableNamingOptions,
  RunOptions,
} from "../../../src/index.js";
import { createProjectManager, ProjectManager } from "../../../src/project/ProjectManager.js";
import { propertyPaths } from "../../data-model/builder/ODataAnnotationBuilder.js";
import { ODataModelBuilderV4 } from "../../data-model/builder/v4/ODataModelBuilderV4.js";
import { getTestConfig } from "../../test.config.js";
import { createServiceHelper } from "../comparator/FixtureComparatorHelper.js";
import { ServiceFixtureComparatorHelper } from "../comparator/ServiceFixtureComparatorHelper.js";

describe("Service Generator Tests V4", () => {
  const FIXTURE_PATH = "generator/service";
  const SERVICE_NAME = "Tester";

  let runOptions: Omit<RunOptions, "source" | "output">;
  let odataBuilder: ODataModelBuilderV4;
  let projectManager: ProjectManager;
  let fixtureComparatorHelper: ServiceFixtureComparatorHelper;

  function withNs(name: string) {
    return `${SERVICE_NAME}.${name}`;
  }

  beforeAll(async () => {
    fixtureComparatorHelper = await createServiceHelper(FIXTURE_PATH, digest, ODataVersions.V4);
  });

  beforeEach(async () => {
    odataBuilder = new ODataModelBuilderV4(SERVICE_NAME);
    runOptions = getTestConfig();
  });

  /**
   * The fixtures are bundled output, where every service class sits in the file being compared and no
   * import is needed to reach it. `bundled: false` is for the cases where that is precisely what hides
   * the thing under test - see the unbundled singleton case below.
   */
  async function doGenerate(options?: ConfigFileOptions, { bundled = true }: { bundled?: boolean } = {}) {
    runOptions = options ? deepmerge(runOptions, options) : runOptions;
    const namingHelper = new NamingHelper(runOptions, SERVICE_NAME);
    const dataModel = await fixtureComparatorHelper.createDataModel(
      odataBuilder.getSchemas(),
      namingHelper,
      runOptions,
    );
    projectManager = await createProjectManager("build", EmitModes.ts, namingHelper, dataModel, {
      bundledFileGeneration: bundled,
      noOutput: true,
      allowTypeChecking: true,
    });

    await fixtureComparatorHelper.generateService(projectManager, namingHelper, runOptions);
  }

  async function compareMainService(fixture: string) {
    await fixtureComparatorHelper.compareService(
      "v4" + path.sep + fixture,
      projectManager.getMainServiceFile().getFile(),
    );
  }

  describe("Optimistic concurrency", () => {
    /**
     * The flag is per entity type rather than per service run, so it is emitted into the individual
     * `super` call rather than into the shared runtime options. Asserted on the generated text directly:
     * a fixture would pin the whole file, and what matters here is one argument in two constructors.
     */
    function generatedText() {
      return projectManager.getMainServiceFile().getFile().getFullText();
    }

    function addCopy(concurrencyControlled: boolean) {
      // fully qualified, the way ASP.NET states it: the fixture helper digests without the document's
      // references, so an aliased term would have nothing to resolve against
      odataBuilder
        .addEntityType("Copy", undefined, (builder) => {
          builder.addKeyProp("id", ODataTypesV4.String);
          builder.addProp("condition", ODataTypesV4.Byte);
        })
        .addEntitySet(
          "Copies",
          withNs("Copy"),
          [],
          concurrencyControlled
            ? [propertyPaths("core", "OptimisticConcurrency", [], { fullyQualified: true })]
            : undefined,
        );
    }

    test("a controlled type states the flag in both of its services", async () => {
      addCopy(true);

      await doGenerate();

      const text = generatedText();
      expect(text).toContain("super(client, basePath, name, qCopy, { ...options, concurrencyControlled: true });");
      expect(text).toContain(
        "super(client, basePath, name, qCopy, new QCopyId(name), { ...options, concurrencyControlled: true });",
      );
    });

    test("an uncontrolled type hands its options straight through", async () => {
      addCopy(false);

      await doGenerate();

      const text = generatedText();
      expect(text).toContain("super(client, basePath, name, qCopy, options);");
      expect(text).toContain("super(client, basePath, name, qCopy, new QCopyId(name), options);");
      expect(text).not.toContain("concurrencyControlled");
    });

    test("the disable switch takes the flag away again", async () => {
      addCopy(true);

      await doGenerate({ annotations: { disableOptimisticConcurrency: true } });

      expect(generatedText()).not.toContain("concurrencyControlled");
    });
  });

  test("Service Generator: Min Case", async () => {
    // given nothing in particular

    // when generating
    await doGenerate();

    // then main service file has been generated but no individual ones
    await compareMainService("min.ts");
  });

  test("Service Generator: Min Big Number", async () => {
    // given big numbers setting
    const options: ConfigFileOptions = { v4: { bigNumberAsString: true } };

    // when generating
    await doGenerate(options);

    // then main service file has been generated but no individual ones
    await compareMainService("min-big-numbers.ts");
  });

  test("Service Generator: Min OData 4.01", async () => {
    // given the 4.01 setting
    const options: ConfigFileOptions = { v4: { odataVersion: "4.01" } };

    // when generating
    await doGenerate(options);

    // then the version is set on the main service, since it only takes effect at runtime
    await compareMainService("min-v401.ts");
  });

  test("Service Generator: One EntitySet", async () => {
    // given one EntitySet
    odataBuilder
      .addEntityType("TestEntity", undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV4.Guid)
          .addKeyProp("age", ODataTypesV4.Int32)
          .addKeyProp("deceased", ODataTypesV4.Boolean)
          .addKeyProp("desc", ODataTypesV4.String),
      )
      .addEntitySet("Ents", withNs("TestEntity"));

    // when generating
    await doGenerate({
      enablePrimitivePropertyServices: true,
      converters: [{ module: "@odata2ts/test-converters", use: ["guidToGuidStringConverter"] }],
    });

    // then main service file lists an entity set
    await compareMainService("one-entityset.ts");
  });

  test("Service Generator: one singleton", async () => {
    // given one singleton
    odataBuilder
      .addEntityType("TestEntity", undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.String))
      .addSingleton("CURRENT_USER", withNs("TestEntity"));

    // when generating
    await doGenerate();

    // then main service file encompasses a singleton
    await compareMainService("singleton.ts");
  });

  test("Service Generator: unbundled, a singleton brings in its own service", async () => {
    // given a singleton whose entity type has no entity set, so nothing else refers to that service
    odataBuilder
      .addEntityType("TestEntity", undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.String))
      .addSingleton("CURRENT_USER", withNs("TestEntity"));

    // when generating one file per model instead of one bundle
    await doGenerate(undefined, { bundled: false });

    // then the main service imports the service class it instantiates. Bundled output cannot show this:
    // the class is declared in the very file, so a missing import is invisible there.
    await compareMainService("singleton-unbundled.ts");
  });

  test("Service Generator: bound & unbound functions", async () => {
    // given two functions: one without and one with params
    odataBuilder
      .addEntityType("TestEntity", undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.String))
      .addEntitySet("tests", withNs("TestEntity"))
      .addFunction("getBestsellers", `Collection(${withNs("TestEntity")})`, false)
      .addFunctionImport("mostPop", withNs("getBestsellers"), "none")
      .addFunction("firstBook", withNs("TestEntity"), false, (builder) =>
        builder.addParam("testString", ODataTypesV4.String, false).addParam("testNumber", ODataTypesV4.Double),
      )
      .addFunctionImport("bestBook", withNs("firstBook"), "none");

    // when generating
    await doGenerate();

    // then main service file encompasses unbound functions
    await compareMainService("function-bound-unbound.ts");
  });

  test("Service Generator: bound & unbound action", async () => {
    // given one EntitySet
    odataBuilder
      .addEntityType("TestEntity", undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.String))
      .addEntitySet("tests", withNs("TestEntity"))
      .addAction("ping", undefined, false)
      .addActionImport("keepAlive", withNs("ping"))
      .addAction("vote", withNs("TestEntity"), false, (builder) =>
        builder.addParam("rating", ODataTypesV4.Int16, false).addParam("comment", ODataTypesV4.String),
      )
      .addActionImport("DoLike", withNs("vote"));

    // when generating
    await doGenerate();

    // then main service file encompasses an unbound function
    await compareMainService("action-bound-unbound.ts");
  });

  test("Service Generator: operation with primitive return types", async () => {
    // given one EntitySet
    odataBuilder
      .addEntityType("TestEntity", undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.String))
      .addEntitySet("tests", withNs("TestEntity"))
      .addAction("pingString", ODataTypesV4.String, false)
      .addAction("pingNumber", ODataTypesV4.Int16, false)
      .addActionImport("pingString", withNs("pingString"))
      .addActionImport("pingNumber", withNs("pingNumber"))
      .addAction("pingCollection", `Collection(${ODataTypesV4.DateTimeOffset})`, false)
      .addActionImport("pingCollection", withNs("pingCollection"));

    // when generating
    await doGenerate();

    await compareMainService("action-rt-primitive.ts");
  });

  test("Service Generator: function with complex return type", async () => {
    // given one EntitySet
    odataBuilder
      .addEntityType("Book", undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.String))
      .addEntitySet("books", withNs("Book"))
      // complex return type
      .addComplexType("Review", undefined, (builder) => builder.addProp("content", ODataTypesV4.String))
      .addFunction("BestReview", withNs("Review"), true, (builder) => {
        builder.addParam("book", withNs("Book"));
      })
      // collection of complex return type
      .addFunction("filterReviews", `Collection(${withNs("Review")})`, true, (builder) =>
        builder
          .addParam("Book", `Collection(${withNs("Book")})`)
          .addParam("MIN_RATING", ODataTypesV4.Int16, false)
          .addParam("MinCreated", ODataTypesV4.Date),
      );

    // when generating
    await doGenerate();

    // then service has those functions
    await compareMainService("function-rt-complex.ts");
  });

  test("Service Generator: composable function", async () => {
    odataBuilder
      .addComplexType("Review", undefined, (builder) => builder.addProp("content", ODataTypesV4.String))
      .addEntityType("Book", undefined, (builder) =>
        builder.addKeyProp("id", ODataTypesV4.String).addProp("review", withNs("Review")),
      )
      .addEntitySet("Books", withNs("Book"))
      // .addComplexType("Review", undefined, (builder) => builder.addProp("content", ODataTypesV4.String))
      .addComposableFunction("getBest", withNs("Book"))
      .addFunctionImport("BestBook", withNs("getBest"), "none")
      .addComposableFunction("getTop10", `Collection(${withNs("Book")})`)
      .addFunctionImport("Top10", withNs("getTop10"), "none")
      .addComposableFunction("getBestReview", withNs("Review"))
      .addFunctionImport("BestReview", withNs("getBestReview"), "none");

    // when generating
    await doGenerate();

    // then service has those functions
    await compareMainService("function-composable.ts");
  });

  test("Service Generator: action with enum return type", async () => {
    // given one EntitySet
    odataBuilder
      .addEntityType("Book", undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.String))
      .addEntitySet("books", withNs("Book"))
      .addEnumType("Rating", [
        { name: "1", value: 1 },
        { name: "9", value: 2 },
      ])
      // no return type
      .addAction("like", undefined, true, (builder) => builder.addParam("book", withNs("Book")))
      // enum return type,
      .addAction("rate", withNs("Rating"), true, (builder) =>
        builder.addParam("book", withNs("Book")).addParam("rating", withNs("Rating")),
      )
      // return type: collection of enums
      .addAction("ratings", `Collection(${withNs("Rating")})`, true, (builder) =>
        builder
          .addParam("book", `Collection(${withNs("Book")})`)
          .addParam("ratings", `Collection(${withNs("Rating")})`),
      );

    // when generating
    await doGenerate();

    // then service has actions
    await compareMainService("action-rt-enum.ts");
  });

  test("Service Generator: big number return types", async () => {
    // given one EntitySet
    odataBuilder
      .addEntityType("TestEntity", undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.String))
      .addEntitySet("tests", withNs("TestEntity"))
      .addAction("pingBigNumber", ODataTypesV4.Int64, false)
      .addAction("pingDecimal", ODataTypesV4.Decimal, false)
      .addActionImport("pingBigNumber", withNs("pingBigNumber"))
      .addActionImport("pingDecimal", withNs("pingDecimal"))
      .addAction("pingDecimalCollection", `Collection(${ODataTypesV4.Decimal})`, false)
      .addActionImport("pingDecimalCollection", withNs("pingDecimalCollection"));

    // when generating
    await doGenerate({ v4: { bigNumberAsString: true } });

    await compareMainService("big-number-return-types.ts");
  });

  test("Service Generator: Services with Naming", async () => {
    // given one EntitySet
    odataBuilder
      .addEntityType("TestEntity", undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV4.Guid)
          // simple props don't make a difference
          .addProp("test", ODataTypesV4.String),
      )
      .addEntitySet("list", withNs("TestEntity"));
    const naming: OverridableNamingOptions = {
      minimalDefaults: true,
      models: {
        namingStrategy: NamingStrategies.CONSTANT_CASE,
      },
      queryObjects: {
        namingStrategy: NamingStrategies.CONSTANT_CASE,
      },
      services: {
        prefix: "",
        suffix: "srv",
        namingStrategy: NamingStrategies.CONSTANT_CASE,
        main: {
          applyServiceNaming: false,
          namingStrategy: NamingStrategies.SNAKE_CASE,
        },
        privateProps: {
          namingStrategy: NamingStrategies.CONSTANT_CASE,
          prefix: "",
          suffix: "_",
        },
        relatedServiceGetter: {
          namingStrategy: NamingStrategies.CONSTANT_CASE,
          prefix: "navigateTo",
          suffix: "",
        },
        operations: {
          namingStrategy: NamingStrategies.CONSTANT_CASE,
          function: {
            prefix: "",
            suffix: "Function",
          },
          action: {
            prefix: "",
            suffix: "Action",
          },
        },
      },
    };

    // when generating
    await doGenerate({ naming });

    // then main service file lists an entity set
    await compareMainService("naming.ts");
  });

  test("Service Generator: EntityService with Relationships", async () => {
    // given one EntitySet
    odataBuilder
      .addEntityType("Author", undefined, (builder) =>
        builder.addKeyProp("ID", ODataTypesV4.Guid).addProp("name", ODataTypesV4.String, false),
      )
      .addEntityType("Book", undefined, (builder) =>
        builder
          .addKeyProp("ID", ODataTypesV4.Guid)
          .addProp("AUTHOR", withNs("Author"))
          .addProp("RelatedAuthors", `Collection(${withNs("Author")})`),
      )
      .addEntitySet("books", withNs("Book"));

    // when generating
    await doGenerate({ enablePrimitivePropertyServices: true });

    // then we get two additional service file
    await compareMainService("entity-relationships.ts");
  });

  test("Service Generator: EntityService with Complex Type", async () => {
    // given one EntitySet
    odataBuilder
      .addComplexType("Reviewer", undefined, (builder) => builder.addProp("name", ODataTypesV4.String, false))
      .addEntityType("Book", undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV4.String)
          .addProp("lector", withNs("Reviewer"))
          .addProp("reviewers", `Collection(${withNs("Reviewer")})`),
      )
      .addEntitySet("Books", withNs("Book"));

    // when generating
    await doGenerate();

    // then we get two additional service file
    await compareMainService("complex-type.ts");
  });

  test("Service Generator: EntityService with Enum Type", async () => {
    // given one EntitySet
    odataBuilder
      .addEnumType("Choice", [
        { name: "A", value: 1 },
        { name: "B", value: 2 },
      ])
      .addEntityType("Book", undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV4.String)
          .addProp("myChoice", withNs("Choice"))
          .addProp("altChoices", `Collection(${withNs("Choice")})`),
      )
      .addEntitySet("books", withNs("Book"));

    // when generating
    await doGenerate();

    // then we get two additional service file
    await compareMainService("enum-type.ts");

    runOptions.enumType = "numeric";
    await doGenerate();
    await compareMainService("enum-numeric-type.ts");
  });

  test("Service Generator: big number types", async () => {
    // given one EntitySet
    odataBuilder
      .addEntityType("TestEntity", undefined, (builder) =>
        builder
          .addKeyProp("decimal", ODataTypesV4.Decimal)
          .addProp("int64", ODataTypesV4.Int64)
          .addProp("bigNumberCollection", `Collection(${ODataTypesV4.Decimal})`),
      )
      .addEntitySet("Ents", withNs("TestEntity"));

    // when generating
    await doGenerate({ v4: { bigNumberAsString: true } });

    // then we get one additional service file
    await compareMainService("big-numbers.ts");
  });

  test("Service Generator: abstract and open type", async () => {
    // given one EntitySet
    odataBuilder
      .addEntityType("AbstractEntity", { abstract: true }, () => {})
      .addEntityType("OpenEntity", { open: true, baseType: withNs("AbstractEntity") }, () => {})
      .addEntityType("ExtendedFromAbstract", { baseType: withNs("AbstractEntity") }, (builder) => {
        return builder.addKeyProp("id", ODataTypesV4.String);
      })
      .addEntityType("ExtendedFromOpen", { baseType: withNs("OpenEntity") }, (builder) => {
        return builder.addKeyProp("id", ODataTypesV4.String);
      })
      .addEntitySet("FromAbstract", withNs("ExtendedFromAbstract"))
      .addEntitySet("FromOpen", withNs("ExtendedFromOpen"));

    // when generating
    await doGenerate();

    // then we get services for all types including abstract and open
    await compareMainService("abstract-and-open-types.ts");
  });

  test("Service Generator: abstract type with inheritance", async () => {
    // given one EntitySet
    odataBuilder
      .addEntityType("AbstractEntity", { abstract: true }, (builder) => {
        builder.addKeyProp("baseId", ODataTypesV4.Int32).addProp("test", ODataTypesV4.String);
      })
      .addEntityType("TestEntity", { baseType: withNs("AbstractEntity") }, () => {})
      .addEntitySet("Testing", withNs("TestEntity"));

    // when generating
    await doGenerate();

    // then the generated TestEntityService must use the AbstractEntityId => there's no TestEntityId interface
    await compareMainService("abstract-with-inheritance.ts");
  });

  test("Service Generator: function overloads", async () => {
    // given function overloads
    odataBuilder
      // given one function definition without params
      .addFunction("BestReview", ODataTypesV4.String, false, (builder) =>
        builder.addParam("myParam", ODataTypesV4.Boolean, false),
      )
      // same function with different params
      .addFunction("BestReview", ODataTypesV4.String, false, (builder) =>
        builder.addParam("minRating", ODataTypesV4.Int16, false),
      )
      .addFunctionImport("BestReview", withNs("BestReview"));

    // when generating
    await doGenerate();

    // then service has one function with multiple parameter types
    await compareMainService("function-overload.ts");
  });

  test("Service Generator: function overloads optional params", async () => {
    // given function overloads
    odataBuilder
      // given one function definition without params
      .addFunction("BestReview", ODataTypesV4.String, false)
      // same function with different params
      .addFunction("BestReview", ODataTypesV4.String, false, (builder) =>
        builder.addParam("minRating", ODataTypesV4.Int16, false),
      )
      .addFunctionImport("BestReview", withNs("BestReview"));

    // when generating
    await doGenerate();

    // then service has one function with multiple parameter types
    await compareMainService("function-overload-optional.ts");
  });

  test("Service Generator: stream property", async () => {
    // given an entity with a stream property
    odataBuilder
      .addEntityType("Audiobook", undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV4.Guid)
          .addProp("title", ODataTypesV4.String, false)
          .addProp("Sample", ODataTypesV4.Stream),
      )
      .addEntitySet("Audiobooks", withNs("Audiobook"));

    // when generating - note: no enablePrimitivePropertyServices, that switch must not apply here,
    // since the stream service is the only way to reach the content at all
    await doGenerate();

    // then the entity service hands out a stream service for the property
    await compareMainService("stream-property.ts");
  });

  test("Service Generator: media entity", async () => {
    // given a media entity, i.e. an entity whose own representation is binary content
    odataBuilder
      .addEntityType("EBook", { hasStream: true }, (builder) =>
        builder.addKeyProp("id", ODataTypesV4.Guid).addProp("title", ODataTypesV4.String, false),
      )
      .addEntitySet("EBooks", withNs("EBook"));

    // when generating
    await doGenerate();

    // then its service extends the media entity service, which adds the $value access
    await compareMainService("media-entity.ts");
  });

  test("Service Generator: the entity service writes with the UpdatableModel", async () => {
    function getEntityServiceText() {
      const file = [...projectManager.getCachedFiles().values()].find((f) =>
        f.getFullText().includes("class TestEntityService"),
      );
      if (!file) {
        throw new Error("TestEntityService file was not generated!");
      }
      return file.getFullText();
    }

    async function generateTestEntity(options?: Parameters<typeof doGenerate>[0]) {
      odataBuilder = new ODataModelBuilderV4(SERVICE_NAME);
      odataBuilder
        // a non-nullable key with no annotation of its own
        .addEntityType("TestEntity", undefined, (builder) =>
          builder.addKeyProp("id", ODataTypesV4.Guid).addProp("title", ODataTypesV4.String, false),
        )
        .addEntitySet("TestEntities", withNs("TestEntity"));
      await doGenerate(options);
      return getEntityServiceText();
    }

    // by default an unannotated key is optional on create already, so an updatable model would say
    // nothing new and none is generated - the entity service keeps the editable one
    let serviceText = await generateTestEntity();
    expect(serviceText).toContain("extends EntityTypeServiceV4<TestEntity, EditableTestEntity, QTestEntity, V>");
    expect(serviceText).not.toContain("UpdatableTestEntity");

    // under `strict` the key follows nullable and is required on create, which the update model then
    // relaxes - so the two differ and the entity service takes the updatable one
    serviceText = await generateTestEntity({ keyProperties: KeyProperties.strict });
    expect(serviceText).toContain("extends EntityTypeServiceV4<TestEntity, UpdatableTestEntity, QTestEntity, V>");
    // while the collection service, which is where creation happens, keeps the EditableModel
    expect(serviceText).toContain(
      "extends EntitySetServiceV4<TestEntity, EditableTestEntity, QTestEntity, TestEntityId, V>",
    );

    // `strictOmit` drops the key from the update model instead of relaxing it - a different model, the
    // same wiring, and it applies to the default key handling too
    serviceText = await generateTestEntity({ managedPropertyMode: ManagedPropertyMode.strictOmit });
    expect(serviceText).toContain("extends EntityTypeServiceV4<TestEntity, UpdatableTestEntity, QTestEntity, V>");
  });
});
