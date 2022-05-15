import path from "path";

import { EmitModes, Modes, RunOptions } from "../../../src/OptionModel";
import { createFixtureComparator, FixtureComparator } from "../comparator/FixtureComparator";
import { SERVICE_NAME } from "./EntityBasedGenerationTests";
import { digest } from "../../../src/data-model/DataModelDigestionV2";
import { generateServices } from "../../../src/generator";
import { createProjectManager, ProjectManager } from "../../../src/project/ProjectManager";
import { ProjectFiles } from "../../../src/data-model/DataModel";
import { ODataTypesV3 } from "../../../src/data-model/edmx/ODataEdmxModelV3";
import { ODataModelBuilderV2 } from "../../data-model/builder/v2/ODataModelBuilderV2";
import { ODataVesions } from "../../../src/app";

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

  test("Service Generator: one EntitySet", async () => {
    // given one EntitySet
    odataBuilder
      .addEntityType("TestEntity", undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV3.String)
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
    // given two functions: one without and one with params
    odataBuilder
      .addEntityType("TestEntity", undefined, (builder) => builder.addKeyProp("id", ODataTypesV3.String))
      .addFunctionImport("mostPop", `Collection(${SERVICE_NAME}.TestEntity)`)
      .addFunctionImport("bestBook", `${SERVICE_NAME}.TestEntity`, (builder) =>
        builder.addParam("testString", ODataTypesV3.String, false).addParam("testNumber", ODataTypesV3.Int32)
      );

    // when generating
    await doGenerate();

    // then main service file encompasses unbound functions
    await compareMainService("main-service-func-import.ts", true);
  });

  test.skip("Service Generator: one unbound action", async () => {
    // given one EntitySet
    odataBuilder.addEntityType("TestEntity", undefined, (builder) => builder.addKeyProp("id", ODataTypesV3.String));
    // .addActionImport("ping", undefined, false)
    // .addActionImport("keepAlive", `${SERVICE_NAME}.ping`)
    // .addAction("vote", `${SERVICE_NAME}.TestEntity`, false, (builder) =>
    //   builder.addParam("rating", ODataTypesV3.Int16, false).addParam("comment", ODataTypesV3.String)
    // )
    // .addActionImport("DoLike", `${SERVICE_NAME}.vote`);

    // when generating
    await doGenerate();

    // then main service file encompasses an unbound function
    await compareMainService("main-service-action-import.ts", true);
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
});
