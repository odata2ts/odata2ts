import path from "path";

import { ODataVesions } from "../../../src/app";
import { ProjectFiles } from "../../../src/data-model/DataModel";
import { digest } from "../../../src/data-model/DataModelDigestionV2";
import { ODataTypesV3 } from "../../../src/data-model/edmx/ODataEdmxModelV3";
import { generateServices } from "../../../src/generator";
import { EmitModes, Modes, RunOptions } from "../../../src/OptionModel";
import { ProjectManager, createProjectManager } from "../../../src/project/ProjectManager";
import { ODataModelBuilderV2 } from "../../data-model/builder/v2/ODataModelBuilderV2";
import { FixtureComparator, createFixtureComparator } from "../comparator/FixtureComparator";
import { SERVICE_NAME } from "./EntityBasedGenerationTests";

describe("Service Generator Tests V2", () => {
  const FIXTURE_PATH = "generator/service";

  let runOptions: RunOptions;
  let odataBuilder: ODataModelBuilderV2;

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
    odataBuilder = new ODataModelBuilderV2(SERVICE_NAME);
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

    await generateServices(dataModel, projectManager, ODataVesions.V2);
  }

  async function compareMainService(fixture: string, v2Specific: boolean) {
    const main = projectManager.getMainServiceFile();

    expect(main).toBeTruthy();
    expect(main.getFullText()).toBeTruthy();

    await fixtureComparator.compareWithFixture(main.getFullText(), (v2Specific ? "v2" + path.sep : "") + fixture);
  }

  test("Service Generator: empty", async () => {
    // given nothing in particular

    // when generating
    await doGenerate();

    // then main service file has been generated but no individual ones
    await compareMainService("main-service-min.ts", false);
    expect(projectManager.getServiceFiles().length).toEqual(0);
  });

  test("Service Generator: main service with one EntitySet", async () => {
    // given one EntitySet
    odataBuilder
      .addEntityType("TestEntity", undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV3.Guid)
          .addKeyProp("age", ODataTypesV3.Int32)
          .addKeyProp("deceased", ODataTypesV3.Boolean)
          .addKeyProp("desc", ODataTypesV3.String)
          .addKeyProp("dateAndTime", ODataTypesV3.DateTime)
          .addKeyProp("dateAndTimeAndOffset", ODataTypesV3.DateTimeOffset)
          .addKeyProp("time", ODataTypesV3.Time)
          // simple props don't make a difference
          .addProp("test", ODataTypesV3.String)
          .addProp("test2", ODataTypesV3.Guid)
      )
      .addEntitySet("list", `${SERVICE_NAME}.TestEntity`);

    // when generating
    await doGenerate();

    // then main service file lists an entity set
    await compareMainService("main-service-entityset.ts", false);

    // then we get one additional service file
    expect(projectManager.getServiceFiles().length).toEqual(1);
    await fixtureComparator.compareWithFixture(
      projectManager.getServiceFiles()[0].getFullText(),
      "v2" + path.sep + "test-entity-service.ts"
    );
  });

  test("Service Generator: one function", async () => {
    // given three functions: one without and one with params and a third which POSTs
    odataBuilder
      .addEntityType("TestEntity", undefined, (builder) => builder.addKeyProp("id", ODataTypesV3.String))
      .addFunctionImport("MostPop", `Collection(${SERVICE_NAME}.TestEntity)`)
      .addFunctionImport("BEST_BOOK", `${SERVICE_NAME}.TestEntity`, (builder) =>
        builder.addParam("TestString", ODataTypesV3.String, false).addParam("TEST_NUMBER", ODataTypesV3.Int32)
      )
      .addFunctionImport(
        "postBestBook",
        `${SERVICE_NAME}.TestEntity`,
        (builder) =>
          builder.addParam("TestString", ODataTypesV3.String, false).addParam("TEST_NUMBER", ODataTypesV3.Int32),
        true
      );
    // when generating
    await doGenerate();

    // then main service file encompasses unbound functions
    await compareMainService("main-service-func-import.ts", true);
  });

  test("Service Generator: Special function params", async () => {
    // given two functions: one without and one with params
    odataBuilder
      .addEntityType("TestEntity", undefined, (builder) => builder.addKeyProp("id", ODataTypesV3.String))
      .addFunctionImport("bestBook", `${SERVICE_NAME}.TestEntity`, (builder) =>
        builder
          .addParam("testGuid", ODataTypesV3.Guid, false)
          .addParam("testDateTime", ODataTypesV3.DateTime)
          .addParam("testDateTimeOffset", ODataTypesV3.DateTimeOffset)
          .addParam("testTime", ODataTypesV3.Time)
      );

    // when generating
    await doGenerate();

    // then main service file encompasses unbound functions
    await compareMainService("main-service-func-import-special-params.ts", true);
  });

  test("Service Generator: EntityService with Relationships", async () => {
    // given one EntitySet
    odataBuilder
      .addEntityType("Author", undefined, (builder) =>
        builder.addKeyProp("ID", ODataTypesV3.Guid).addProp("name", ODataTypesV3.String, false)
      )
      .addEntityType("Book", undefined, (builder) =>
        builder
          .addKeyProp("ID", ODataTypesV3.Guid)
          .addProp("author", `${SERVICE_NAME}.Author`)
          .addProp("relatedAuthors", `Collection(${SERVICE_NAME}.Author)`)
      );

    // when generating
    await doGenerate();

    // then we get two additional service file
    expect(projectManager.getServiceFiles().length).toEqual(2);
    await fixtureComparator.compareWithFixture(
      projectManager.getServiceFiles()[1].getFullText(),
      "v2" + path.sep + "test-entity-service-relationships.ts"
    );
  });

  test("Service Generator: EntityService with Complex Type", async () => {
    // given one EntitySet
    odataBuilder
      .addComplexType("Reviewer", undefined, (builder) => builder.addProp("name", ODataTypesV3.String, false))
      .addEntityType("Book", undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV3.String)
          .addProp("lector", `${SERVICE_NAME}.Reviewer`)
          .addProp("reviewers", `Collection(${SERVICE_NAME}.Reviewer)`)
      );

    // when generating
    await doGenerate();

    // then we get two additional service file
    expect(projectManager.getServiceFiles().length).toEqual(2);
    await fixtureComparator.compareWithFixture(
      projectManager.getServiceFiles()[0].getFullText(),
      "v2" + path.sep + "test-entity-service-complex.ts"
    );
    await fixtureComparator.compareWithFixture(
      projectManager.getServiceFiles()[1].getFullText(),
      "v2" + path.sep + "test-complex-service.ts"
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
          .addKeyProp("id", ODataTypesV3.String)
          .addProp("myChoice", `${SERVICE_NAME}.Choice`)
          .addProp("altChoices", `Collection(${SERVICE_NAME}.Choice)`)
      );

    // when generating
    await doGenerate();

    // then we get two additional service file
    expect(projectManager.getServiceFiles().length).toEqual(1);
    await fixtureComparator.compareWithFixture(
      projectManager.getServiceFiles()[0].getFullText(),
      "v2" + path.sep + "test-entity-service-enum.ts"
    );
  });

  test("Service Generator: EntityService with Hierarchy", async () => {
    // given one EntitySet
    odataBuilder
      .addEntityType("GrandParent", undefined, (builder) => builder.addKeyProp("id", ODataTypesV3.Boolean))
      .addEntityType("Parent", "GrandParent", (builder) => builder.addProp("parentalAdvice", ODataTypesV3.Boolean))
      .addEntityType("Child", "Parent", (builder) =>
        builder.addKeyProp("id2", ODataTypesV3.Boolean).addProp("Ch1ld1shF4n", ODataTypesV3.Boolean)
      );

    // when generating
    await doGenerate();

    // then we get two additional service file
    expect(projectManager.getServiceFiles().length).toEqual(3);
    await fixtureComparator.compareWithFixture(
      projectManager.getServiceFiles()[1].getFullText(),
      "v2" + path.sep + "test-entity-service-hierarchy-parent.ts"
    );
    await fixtureComparator.compareWithFixture(
      projectManager.getServiceFiles()[2].getFullText(),
      "v2" + path.sep + "test-entity-service-hierarchy-child.ts"
    );
  });
});
