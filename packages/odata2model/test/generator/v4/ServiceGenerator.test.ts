import path from "path";

import { ODataTypesV4, ODataVersions } from "@odata2ts/odata-core";
import { SourceFile } from "ts-morph";

import { EmitModes, RunOptions, getDefaultConfig } from "../../../src";
import { digest } from "../../../src/data-model/DataModelDigestionV4";
import { NamingHelper } from "../../../src/data-model/NamingHelper";
import { ProjectManager, createProjectManager } from "../../../src/project/ProjectManager";
import { ODataModelBuilderV4 } from "../../data-model/builder/v4/ODataModelBuilderV4";
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
    runOptions = getDefaultConfig();
  });

  async function doGenerate() {
    const namingHelper = new NamingHelper(runOptions.naming, SERVICE_NAME);
    projectManager = await createProjectManager(namingHelper.getFileNames(), "build", EmitModes.ts, true);

    await fixtureComparatorHelper.generateService(odataBuilder.getSchema(), projectManager, namingHelper);
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

  test("Service Generator: empty", async () => {
    // given nothing in particular

    // when generating
    await doGenerate();

    // then main service file has been generated but no individual ones
    await compareMainService("main-service-min.ts", false);
    expect(projectManager.getServiceFiles().length).toEqual(0);
  });

  test("Service Generator: one EntitySet", async () => {
    // given one EntitySet
    odataBuilder
      .addEntityType("TestEntity", undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV4.Guid)
          .addKeyProp("age", ODataTypesV4.Int32)
          .addKeyProp("deceased", ODataTypesV4.Boolean)
          .addKeyProp("desc", ODataTypesV4.String)
          // simple props don't make a difference
          .addProp("test", ODataTypesV4.String)
          .addProp("test2", ODataTypesV4.Guid)
      )
      .addEntitySet("list", `${SERVICE_NAME}.TestEntity`);

    // when generating
    await doGenerate();

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

  test("Service Generator: one unbound function", async () => {
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

  test("Service Generator: one bound function", async () => {
    // given one EntitySet
    odataBuilder
      .addEntityType("Book", undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.String))
      .addEntityType("Review", undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.String))
      // given function without params, but with special return type which should simply become string
      .addFunction("BestReview", ODataTypesV4.Guid, true, (builder) => builder.addParam("book", `${SERVICE_NAME}.Book`))
      // given function with params which returns collection
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
      .addComplexType("Review", undefined, (builder) => builder.addProp("test", ODataTypesV4.String))
      .addAction("like", undefined, true, (builder) => builder.addParam("book", `${SERVICE_NAME}.Book`))
      .addAction("postReview", `${SERVICE_NAME}.Review`, true, (builder) =>
        builder
          .addParam("Book", `${SERVICE_NAME}.Book`)
          .addParam("Rating", ODataTypesV4.Int16, false)
          .addParam("PUBLICATION_DATE", ODataTypesV4.Date)
      );

    // when generating
    await doGenerate();

    // then service has actions
    const services = projectManager.getServiceFiles();
    expect(services.length).toEqual(2);
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
          .addProp("author", `${SERVICE_NAME}.Author`)
          .addProp("relatedAuthors", `Collection(${SERVICE_NAME}.Author)`)
      );

    // when generating
    await doGenerate();

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

  test("Service Generator: function bound to collection", async () => {
    // given one EntitySet
    odataBuilder
      .addEntityType("Book", undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.String))
      // given function without params, but with special return type which should simply become string
      .addFunction("BestReview", ODataTypesV4.Guid, true, (builder) =>
        // here's the trick => binding first param to Collection of Entity Type
        builder.addParam("book", `Collection(${SERVICE_NAME}.Book)`)
      );

    // when generating
    await doGenerate();

    // then service has those functions
    const services = projectManager.getServiceFiles();
    expect(services.length).toEqual(1);
    await compareService(services[0], "test-entity-service-bound-collection-func.ts", true);
  });
});
