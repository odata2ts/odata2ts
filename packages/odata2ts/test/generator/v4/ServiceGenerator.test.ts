import path from "path";

import { ODataTypesV4, ODataVersions } from "@odata2ts/odata-core";
import deepmerge from "deepmerge";

import { ConfigFileOptions, EmitModes, NamingStrategies, OverridableNamingOptions, RunOptions } from "../../../src";
import { digest } from "../../../src/data-model/DataModelDigestionV4";
import { NamingHelper } from "../../../src/data-model/NamingHelper";
import { ProjectManager, createProjectManager } from "../../../src/project/ProjectManager";
import { ODataModelBuilderV4 } from "../../data-model/builder/v4/ODataModelBuilderV4";
import { getTestConfig } from "../../test.config";
import { createServiceHelper } from "../comparator/FixtureComparatorHelper";
import { ServiceFixtureComparatorHelper } from "../comparator/ServiceFixtureComparatorHelper";

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

  async function doGenerate(options?: ConfigFileOptions) {
    runOptions = options ? deepmerge(runOptions, options) : runOptions;
    const namingHelper = new NamingHelper(runOptions, SERVICE_NAME);
    const dataModel = await fixtureComparatorHelper.createDataModel(
      odataBuilder.getSchemas(),
      namingHelper,
      runOptions
    );
    projectManager = await createProjectManager("build", EmitModes.ts, namingHelper, dataModel, {
      bundledFileGeneration: true,
      noOutput: true,
      allowTypeChecking: true,
    });

    await fixtureComparatorHelper.generateService(projectManager, namingHelper, runOptions);
  }

  async function compareMainService(fixture: string) {
    await fixtureComparatorHelper.compareService(
      "v4" + path.sep + fixture,
      projectManager.getMainServiceFile().getFile()
    );
  }

  test("Service Generator: Min Case", async () => {
    // given nothing in particular

    // when generating
    await doGenerate();

    // then main service file has been generated but no individual ones
    await compareMainService("min.ts");
  });

  test("Service Generator: Min Big Number", async () => {
    // given big numbers setting
    const options: ConfigFileOptions = { v4BigNumberAsString: true };

    // when generating
    await doGenerate(options);

    // then main service file has been generated but no individual ones
    await compareMainService("min-big-numbers.ts");
  });

  test("Service Generator: One EntitySet", async () => {
    // given one EntitySet
    odataBuilder
      .addEntityType("TestEntity", undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV4.Guid)
          .addKeyProp("age", ODataTypesV4.Int32)
          .addKeyProp("deceased", ODataTypesV4.Boolean)
          .addKeyProp("desc", ODataTypesV4.String)
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

  test("Service Generator: bound & unbound functions", async () => {
    // given two functions: one without and one with params
    odataBuilder
      .addEntityType("TestEntity", undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.String))
      .addEntitySet("tests", withNs("TestEntity"))
      .addFunction("getBestsellers", `Collection(${withNs("TestEntity")})`, false)
      .addFunctionImport("mostPop", withNs("getBestsellers"), "none")
      .addFunction("firstBook", withNs("TestEntity"), false, (builder) =>
        builder.addParam("testString", ODataTypesV4.String, false).addParam("testNumber", ODataTypesV4.Double)
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
        builder.addParam("rating", ODataTypesV4.Int16, false).addParam("comment", ODataTypesV4.String)
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
          .addParam("MinCreated", ODataTypesV4.Date)
      );

    // when generating
    await doGenerate();

    // then service has those functions
    await compareMainService("function-rt-complex.ts");
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
        builder.addParam("book", withNs("Book")).addParam("rating", withNs("Rating"))
      )
      // return type: collection of enums
      .addAction("ratings", `Collection(${withNs("Rating")})`, true, (builder) =>
        builder.addParam("book", `Collection(${withNs("Book")})`).addParam("ratings", `Collection(${withNs("Rating")})`)
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
    await doGenerate({ v4BigNumberAsString: true });

    await compareMainService("big-number-return-types.ts");
  });

  test("Service Generator: Services with Naming", async () => {
    // given one EntitySet
    odataBuilder
      .addEntityType("TestEntity", undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV4.Guid)
          // simple props don't make a difference
          .addProp("test", ODataTypesV4.String)
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
        builder.addKeyProp("ID", ODataTypesV4.Guid).addProp("name", ODataTypesV4.String, false)
      )
      .addEntityType("Book", undefined, (builder) =>
        builder
          .addKeyProp("ID", ODataTypesV4.Guid)
          .addProp("AUTHOR", withNs("Author"))
          .addProp("RelatedAuthors", `Collection(${withNs("Author")})`)
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
          .addProp("reviewers", `Collection(${withNs("Reviewer")})`)
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
          .addProp("altChoices", `Collection(${withNs("Choice")})`)
      )
      .addEntitySet("books", withNs("Book"));

    // when generating
    await doGenerate();

    // then we get two additional service file
    await compareMainService("enum-type.ts");
  });

  test("Service Generator: big number types", async () => {
    // given one EntitySet
    odataBuilder
      .addEntityType("TestEntity", undefined, (builder) =>
        builder
          .addKeyProp("decimal", ODataTypesV4.Decimal)
          .addProp("int64", ODataTypesV4.Int64)
          .addProp("bigNumberCollection", `Collection(${ODataTypesV4.Decimal})`)
      )
      .addEntitySet("Ents", withNs("TestEntity"));

    // when generating
    await doGenerate({ v4BigNumberAsString: true });

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
        builder.addParam("myParam", ODataTypesV4.Boolean, false)
      )
      // same function with different params
      .addFunction("BestReview", ODataTypesV4.String, false, (builder) =>
        builder.addParam("minRating", ODataTypesV4.Int16, false)
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
        builder.addParam("minRating", ODataTypesV4.Int16, false)
      )
      .addFunctionImport("BestReview", withNs("BestReview"));

    // when generating
    await doGenerate();

    // then service has one function with multiple parameter types
    await compareMainService("function-overload-optional.ts");
  });
});
