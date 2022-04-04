import { EmitModes, Modes, RunOptions } from "../../src/OptionModel";
import { ODataModelBuilder, ODataVersion } from "../data-model/builder/ODataModelBuilder";
import { createFixtureComparator, FixtureComparator } from "./comparator/FixtureComparator";
import { SERVICE_NAME } from "./EntityBasedGenerationTests";
import { digest } from "../../src/data-model/DataModelDigestion";
import { generateServices } from "../../src/generator";
import { createProjectManager, ProjectManager } from "../../src/project/ProjectManager";
import { ProjectFiles } from "../../src/data-model/DataModel";
import { OdataTypes } from "../../src/data-model/edmx/ODataEdmxModel";

describe("Service Generator Tests", () => {
  const FIXTURE_PATH = "generator/service";

  let runOptions: RunOptions;
  let odataBuilder: ODataModelBuilder;

  let projectFiles: ProjectFiles = {
    model: `${SERVICE_NAME}Model`,
    qObject: `q${SERVICE_NAME}`,
    service: `${SERVICE_NAME}Service`,
  };
  let projectManager: ProjectManager;
  let fixtureComparator: FixtureComparator;

  beforeAll(async () => {
    fixtureComparator = await createFixtureComparator(FIXTURE_PATH);
  });

  beforeEach(async () => {
    odataBuilder = new ODataModelBuilder(ODataVersion.V4, SERVICE_NAME);
    runOptions = {
      mode: Modes.all,
      emitMode: EmitModes.js_dts,
      output: "ignore",
      prettier: false,
      debug: false,
      modelPrefix: "",
      modelSuffix: "",
    };
    projectManager = await createProjectManager(projectFiles, "build", EmitModes.ts, true);
  });

  async function doGenerate() {
    const dataModel = await digest(odataBuilder.getSchema(), runOptions);

    await generateServices(dataModel, projectManager);
  }

  async function compareMainService(fixture: string) {
    const main = projectManager.getMainServiceFile();

    expect(main).toBeTruthy();
    expect(main.getFullText()).toBeTruthy();

    await fixtureComparator.compareWithFixture(main.getFullText(), fixture);
  }

  test("Service Generator: empty", async () => {
    // given nothing in particular

    // when generating
    await doGenerate();

    // then main service file has been generated but no individual ones
    await compareMainService("main-service-min.ts");
    expect(projectManager.getServiceFiles().length).toEqual(0);
  });

  test("Service Generator: one EntitySet", async () => {
    // given one EntitySet
    odataBuilder
      .addEntityType("TestEntity", undefined, (builder) =>
        builder
          .addKeyProp("id", OdataTypes.String)
          // simple props don't make a difference
          .addProp("test", OdataTypes.String)
          .addProp("test2", OdataTypes.Guid)
      )
      .addEntitySet("list", `${SERVICE_NAME}.TestEntity`);

    // when generating
    await doGenerate();

    // then main service file lists an entity set
    await compareMainService("main-service-entityset.ts");

    // then we get one additional service file
    expect(projectManager.getServiceFiles().length).toEqual(1);
    await fixtureComparator.compareWithFixture(
      projectManager.getServiceFiles()[0].getFullText(),
      "test-entity-service.ts"
    );
  });

  test("Service Generator: one singleton", async () => {
    // given one singleton
    odataBuilder
      .addEntityType("TestEntity", undefined, (builder) => builder.addKeyProp("id", OdataTypes.String))
      .addSingleton("current", `${SERVICE_NAME}.TestEntity`);

    // when generating
    await doGenerate();

    // then main service file encompasses a singleton
    await compareMainService("main-service-singleton.ts");

    // then we get the same service file as before
    expect(projectManager.getServiceFiles().length).toEqual(1);
    await fixtureComparator.compareWithFixture(
      projectManager.getServiceFiles()[0].getFullText(),
      "test-entity-service.ts"
    );
  });

  test("Service Generator: one unbound function", async () => {
    // given two functions: one without and one with params
    odataBuilder
      .addEntityType("TestEntity", undefined, (builder) => builder.addKeyProp("id", OdataTypes.String))
      .addFunction("getBestsellers", `Collection(${SERVICE_NAME}.TestEntity)`, false)
      .addFunctionImport("mostPop", `${SERVICE_NAME}.getBestsellers`, "none")
      .addFunction("firstBook", `${SERVICE_NAME}.TestEntity`, false, (builder) =>
        builder.addParam("testString", OdataTypes.String, false).addParam("testNumber", OdataTypes.Double)
      )
      .addFunctionImport("bestBook", `${SERVICE_NAME}.firstBook`, "none");

    // when generating
    await doGenerate();

    // then main service file encompasses unbound functions
    await compareMainService("main-service-func-unbound.ts");
  });

  test("Service Generator: one unbound action", async () => {
    // given one EntitySet
    odataBuilder
      .addEntityType("TestEntity", undefined, (builder) => builder.addKeyProp("id", OdataTypes.String))
      .addAction("ping", undefined, false)
      .addActionImport("keepAlive", `${SERVICE_NAME}.ping`)
      .addAction("vote", `${SERVICE_NAME}.TestEntity`, false, (builder) =>
        builder.addParam("rating", OdataTypes.Int16, false).addParam("comment", OdataTypes.String)
      )
      .addActionImport("DoLike", `${SERVICE_NAME}.vote`);

    // when generating
    await doGenerate();

    // then main service file encompasses an unbound function
    await compareMainService("main-service-action-unbound.ts");
  });

  test("Service Generator: one bound function", async () => {
    // given one EntitySet
    odataBuilder
      .addEntityType("Book", undefined, (builder) => builder.addKeyProp("id", OdataTypes.String))
      // given function without params, but with special return type which should simply become string
      .addFunction("bestReview", OdataTypes.Guid, true, (builder) => builder.addParam("book", `${SERVICE_NAME}.Book`))
      // given function with params which returns collection
      .addFunction("filterReviews", `Collection(${OdataTypes.String})`, true, (builder) =>
        builder
          .addParam("book", `${SERVICE_NAME}.Book`)
          .addParam("minRating", OdataTypes.Int16, false)
          .addParam("minCreated", OdataTypes.Date)
      );

    // when generating
    await doGenerate();

    // then service has those functions
    const services = projectManager.getServiceFiles();
    expect(services.length).toEqual(1);
    await fixtureComparator.compareWithFixture(services[0].getFullText(), "test-entity-service-bound-func.ts");
  });

  test("Service Generator: one bound action", async () => {
    // given one EntitySet
    odataBuilder
      .addEntityType("Book", undefined, (builder) => builder.addKeyProp("id", OdataTypes.String))
      .addAction("like", undefined, true, (builder) => builder.addParam("book", `${SERVICE_NAME}.Book`))
      .addAction("postReview", OdataTypes.String, true, (builder) =>
        builder
          .addParam("book", `${SERVICE_NAME}.Book`)
          .addParam("rating", OdataTypes.Int16, false)
          .addParam("publicationDate", OdataTypes.Date)
      );

    // when generating
    await doGenerate();

    // then service has actions
    const services = projectManager.getServiceFiles();
    expect(services.length).toEqual(1);
    await fixtureComparator.compareWithFixture(services[0].getFullText(), "test-entity-service-bound-action.ts");
  });

  test("Service Generator: EntityService with Relationships", async () => {
    // given one EntitySet
    odataBuilder
      .addEntityType("Author", undefined, (builder) =>
        builder.addKeyProp("ID", OdataTypes.Guid).addProp("name", OdataTypes.String, false)
      )
      .addEntityType("Book", undefined, (builder) =>
        builder
          .addKeyProp("ID", OdataTypes.Guid)
          .addProp("author", `${SERVICE_NAME}.Author`)
          .addProp("relatedAuthors", `Collection(${SERVICE_NAME}.Author)`)
      );

    // when generating
    await doGenerate();

    // then we get two additional service file
    expect(projectManager.getServiceFiles().length).toEqual(2);
    await fixtureComparator.compareWithFixture(
      projectManager.getServiceFiles()[1].getFullText(),
      "test-entity-service-relationships.ts"
    );
  });

  test("Service Generator: EntityService with Complex Type", async () => {
    // given one EntitySet
    odataBuilder
      .addComplexType("Reviewer", undefined, (builder) => builder.addProp("name", OdataTypes.String, false))
      .addEntityType("Book", undefined, (builder) =>
        builder
          .addKeyProp("id", OdataTypes.String)
          .addProp("lector", `${SERVICE_NAME}.Reviewer`)
          .addProp("reviewers", `Collection(${SERVICE_NAME}.Reviewer)`)
      );

    // when generating
    await doGenerate();

    // then we get two additional service file
    expect(projectManager.getServiceFiles().length).toEqual(2);
    await fixtureComparator.compareWithFixture(
      projectManager.getServiceFiles()[0].getFullText(),
      "test-entity-service-complex.ts"
    );
    await fixtureComparator.compareWithFixture(
      projectManager.getServiceFiles()[1].getFullText(),
      "test-complex-service.ts"
    );
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
          .addKeyProp("id", OdataTypes.String)
          .addProp("myChoice", `${SERVICE_NAME}.Choice`)
          .addProp("altChoices", `Collection(${SERVICE_NAME}.Choice)`)
      );

    // when generating
    await doGenerate();

    // then we get two additional service file
    expect(projectManager.getServiceFiles().length).toEqual(1);
    await fixtureComparator.compareWithFixture(
      projectManager.getServiceFiles()[0].getFullText(),
      "test-entity-service-enum.ts"
    );
  });
});
