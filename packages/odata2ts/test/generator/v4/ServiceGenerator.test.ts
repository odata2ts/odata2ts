import path from "path";

import { ODataTypesV4, ODataVersions } from "@odata2ts/odata-core";
import deepmerge from "deepmerge";
import { SourceFile } from "ts-morph";

import { ConfigFileOptions, EmitModes, NamingStrategies, OverridableNamingOptions, RunOptions } from "../../../src";
import { digest } from "../../../src/data-model/DataModelDigestionV4";
import { NamingHelper } from "../../../src/data-model/NamingHelper";
import { ProjectManager, createProjectManager } from "../../../src/project/ProjectManager";
import { ODataModelBuilderV4 } from "../../data-model/builder/v4/ODataModelBuilderV4";
import { getTestConfig } from "../../test.config";
import { ServiceFixtureComparatorHelper, createServiceHelper } from "../comparator/FixtureComparatorHelper";
import { SERVICE_NAME } from "./EntityBasedGenerationTests";

describe("Service Generator Tests V4", () => {
  const FIXTURE_PATH = "generator/service";

  let runOptions: Omit<RunOptions, "source" | "output">;
  let odataBuilder: ODataModelBuilderV4;
  let projectManager: ProjectManager;
  let fixtureComparatorHelper: ServiceFixtureComparatorHelper;

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
    projectManager = await createProjectManager(namingHelper.getFileNames(), "build", EmitModes.ts, true);

    await fixtureComparatorHelper.generateService(odataBuilder.getSchemas(), projectManager, namingHelper, runOptions);
  }

  function getV4SpecificPath(fixture: string, v4Specific: boolean) {
    return (v4Specific ? "v4" + path.sep : "") + fixture;
  }

  async function compareMainService(fixture: string, v4Specific: boolean = false) {
    await fixtureComparatorHelper.compareService(
      getV4SpecificPath(fixture, v4Specific),
      projectManager.getMainServiceFile()
    );
  }

  async function compareService(service: SourceFile, fixture: string, v4Specific: boolean = false) {
    await fixtureComparatorHelper.compareService(getV4SpecificPath(fixture, v4Specific), service);
  }

  test("Service Generator: Main Service Min Case", async () => {
    // given nothing in particular

    // when generating
    await doGenerate();

    // then main service file has been generated but no individual ones
    await compareMainService("main-service-min.ts", false);
    expect(projectManager.getServiceFiles().length).toEqual(0);
  });

  test("Service Generator: Main Service V4 Big Number", async () => {
    // given big numbers setting
    const options: ConfigFileOptions = { v4BigNumberAsString: true };

    // when generating
    await doGenerate(options);

    // then main service file has been generated but no individual ones
    await compareMainService("main-service-big-numbers.ts", true);
  });

  test("Service Generator: Main Service one EntitySet", async () => {
    // given one EntitySet
    odataBuilder
      .addEntityType("TestEntity", undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV4.Guid)
          .addKeyProp("age", ODataTypesV4.Int32)
          .addKeyProp("deceased", ODataTypesV4.Boolean)
          .addKeyProp("desc", ODataTypesV4.String)
      )
      .addEntitySet("Ents", `${SERVICE_NAME}.TestEntity`);

    // when generating
    await doGenerate({
      enablePrimitivePropertyServices: true,
      converters: [{ module: "@odata2ts/test-converters", use: ["guidToGuidStringConverter"] }],
    });

    // then main service file lists an entity set
    await compareMainService("main-service-entityset.ts", false);

    // then we get one additional service file
    expect(projectManager.getServiceFiles().length).toEqual(1);
    await compareService(projectManager.getServiceFiles()[0], "test-entity-service.ts", true);
  });

  test("Service Generator: one singleton", async () => {
    // given one singleton
    odataBuilder
      .addEntityType("TestEntity", undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.String))
      .addSingleton("CURRENT_USER", `${SERVICE_NAME}.TestEntity`);

    // when generating
    await doGenerate();

    // then main service file encompasses a singleton
    await compareMainService("main-service-singleton.ts", true);
  });

  test("Service Generator: unbound functions", async () => {
    // given two functions: one without and one with params
    odataBuilder
      .addEntityType("TestEntity", undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.String))
      .addFunction("getBestsellers", `Collection(${SERVICE_NAME}.TestEntity)`, false)
      .addFunctionImport("mostPop", `${SERVICE_NAME}.getBestsellers`, "none")
      .addFunction("firstBook", `${SERVICE_NAME}.TestEntity`, false, (builder) =>
        builder.addParam("testString", ODataTypesV4.String, false).addParam("testNumber", ODataTypesV4.Double)
      )
      .addFunctionImport("bestBook", `${SERVICE_NAME}.firstBook`, "none");

    // when generating
    await doGenerate();

    // then main service file encompasses unbound functions
    await compareMainService("main-service-func-unbound.ts", true);
  });

  test("Service Generator: one unbound action", async () => {
    // given one EntitySet
    odataBuilder
      .addEntityType("TestEntity", undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.String))
      .addAction("ping", undefined, false)
      .addActionImport("keepAlive", `${SERVICE_NAME}.ping`)
      .addAction("vote", `${SERVICE_NAME}.TestEntity`, false, (builder) =>
        builder.addParam("rating", ODataTypesV4.Int16, false).addParam("comment", ODataTypesV4.String)
      )
      .addActionImport("DoLike", `${SERVICE_NAME}.vote`);

    // when generating
    await doGenerate();

    // then main service file encompasses an unbound function
    await compareMainService("main-service-action-unbound.ts", true);
  });

  test("Service Generator: operation with primitive return types", async () => {
    // given one EntitySet
    odataBuilder
      .addEntityType("TestEntity", undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.String))
      .addAction("pingString", ODataTypesV4.String, false)
      .addAction("pingNumber", ODataTypesV4.Int16, false)
      .addActionImport("pingString", `${SERVICE_NAME}.pingString`)
      .addActionImport("pingNumber", `${SERVICE_NAME}.pingNumber`)
      .addAction("pingCollection", `Collection(${ODataTypesV4.DateTimeOffset})`, false)
      .addActionImport("pingCollection", `${SERVICE_NAME}.pingCollection`);

    // when generating
    await doGenerate();

    await compareMainService("main-service-operation-with-primitive-return-types.ts", true);
  });

  test("Service Generator: operation with big number return types", async () => {
    // given one EntitySet
    odataBuilder
      .addEntityType("TestEntity", undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.String))
      .addAction("pingBigNumber", ODataTypesV4.Int64, false)
      .addAction("pingDecimal", ODataTypesV4.Decimal, false)
      .addActionImport("pingBigNumber", `${SERVICE_NAME}.pingBigNumber`)
      .addActionImport("pingDecimal", `${SERVICE_NAME}.pingDecimal`)
      .addAction("pingDecimalCollection", `Collection(${ODataTypesV4.Decimal})`, false)
      .addActionImport("pingDecimalCollection", `${SERVICE_NAME}.pingDecimalCollection`);

    // when generating
    await doGenerate({ v4BigNumberAsString: true });

    await compareMainService("main-service-operation-with-big-number-return-types.ts", true);
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
      .addEntitySet("list", `${SERVICE_NAME}.TestEntity`);
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
    await compareMainService("main-service-naming.ts", true);

    // then we get one additional service file
    expect(projectManager.getServiceFiles().length).toEqual(1);
    await compareService(projectManager.getServiceFiles()[0], "test-entity-service-naming.ts", true);
  });

  test("Service Generator: one bound function", async () => {
    // given one EntitySet
    odataBuilder
      .addEntityType("Book", undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.String))
      .addComplexType("Review", undefined, (builder) => builder.addProp("content", ODataTypesV4.String))
      // complex return type
      .addFunction("BestReview", `${SERVICE_NAME}.Review`, true, (builder) =>
        builder.addParam("book", `${SERVICE_NAME}.Book`)
      )
      // collection of complex return type
      .addFunction("filterReviews", `Collection(${SERVICE_NAME}.Review)`, true, (builder) =>
        builder
          .addParam("Book", `${SERVICE_NAME}.Book`)
          .addParam("MIN_RATING", ODataTypesV4.Int16, false)
          .addParam("MinCreated", ODataTypesV4.Date)
      );

    // when generating
    await doGenerate();

    // then service has those functions
    const services = projectManager.getServiceFiles();
    expect(services.length).toEqual(2);
    await compareService(services[0], "test-entity-service-bound-func.ts", true);
  });

  test("Service Generator: one bound action", async () => {
    // given one EntitySet
    odataBuilder
      .addEntityType("Book", undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.String))
      .addEnumType("Rating", [
        { name: "1", value: 1 },
        { name: "9", value: 2 },
      ])
      // no return type
      .addAction("like", undefined, true, (builder) => builder.addParam("book", `${SERVICE_NAME}.Book`))
      // enum return type,
      .addAction("rate", `${SERVICE_NAME}.Rating`, true, (builder) =>
        builder.addParam("book", `${SERVICE_NAME}.Book`).addParam("rating", `${SERVICE_NAME}.Rating`)
      )
      // return type: collection of enums
      .addAction("ratings", `Collection(${SERVICE_NAME}.Rating)`, true, (builder) =>
        builder.addParam("book", `${SERVICE_NAME}.Book`).addParam("ratings", `Collection(${SERVICE_NAME}.Rating)`)
      );

    // when generating
    await doGenerate();

    // then service has actions
    const services = projectManager.getServiceFiles();
    expect(services.length).toEqual(1);
    await compareService(services[0], "test-entity-service-bound-action.ts", true);
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
          .addProp("AUTHOR", `${SERVICE_NAME}.Author`)
          .addProp("RelatedAuthors", `Collection(${SERVICE_NAME}.Author)`)
      );

    // when generating
    await doGenerate({ enablePrimitivePropertyServices: true });

    // then we get two additional service file
    expect(projectManager.getServiceFiles().length).toEqual(2);
    await compareService(projectManager.getServiceFiles()[1], "test-entity-service-relationships.ts", true);
  });

  test("Service Generator: EntityService with Complex Type", async () => {
    // given one EntitySet
    odataBuilder
      .addComplexType("Reviewer", undefined, (builder) => builder.addProp("name", ODataTypesV4.String, false))
      .addEntityType("Book", undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV4.String)
          .addProp("lector", `${SERVICE_NAME}.Reviewer`)
          .addProp("reviewers", `Collection(${SERVICE_NAME}.Reviewer)`)
      );

    // when generating
    await doGenerate();

    // then we get two additional service file
    expect(projectManager.getServiceFiles().length).toEqual(2);
    await compareService(projectManager.getServiceFiles()[0], "test-entity-service-complex.ts", true);
    await compareService(projectManager.getServiceFiles()[1], "test-complex-service.ts", true);
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
          .addProp("myChoice", `${SERVICE_NAME}.Choice`)
          .addProp("altChoices", `Collection(${SERVICE_NAME}.Choice)`)
      );

    // when generating
    await doGenerate();

    // then we get two additional service file
    expect(projectManager.getServiceFiles().length).toEqual(1);
    await compareService(projectManager.getServiceFiles()[0], "test-entity-service-enum.ts", true);
  });

  test("Service Generator: Services with big number types", async () => {
    // given one EntitySet
    odataBuilder
      .addEntityType("TestEntity", undefined, (builder) =>
        builder
          .addKeyProp("decimal", ODataTypesV4.Decimal)
          .addProp("int64", ODataTypesV4.Int64)
          .addProp("bigNumberCollection", `Collection(${ODataTypesV4.Decimal})`)
      )
      .addEntitySet("Ents", `${SERVICE_NAME}.TestEntity`);

    // when generating
    await doGenerate({ v4BigNumberAsString: true });

    // then we get one additional service file
    expect(projectManager.getServiceFiles().length).toEqual(1);
    await compareService(projectManager.getServiceFiles()[0], "test-entity-service-big-numbers.ts", true);
  });
});
