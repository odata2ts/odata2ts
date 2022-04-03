import { ModelGenerator } from "../../src/generator/ModelGenerator";
import { ODataModelBuilder, ODataVersion } from "../data-model/builder/ODataModelBuilder";
import { digest } from "../../src/data-model/DataModelDigestion";
import { EmitModes, Modes, RunOptions } from "../../src/OptionModel";
import { EnumDeclaration, Project } from "ts-morph";
import { OdataTypes } from "../../src/data-model/edmx/ODataEdmxModel";

describe("Model Generator Tests", () => {
  const SERVICE_NAME = "Tester";
  const ENTITY_NAME = "Book";

  let project: Project;

  let runOptions: RunOptions;
  let odataBuilder: ODataModelBuilder;

  beforeAll(() => {
    project = new Project({
      skipAddingFilesFromTsConfig: true,
    });
  });

  beforeEach(() => {
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
  });

  async function doGenerate(id: string) {
    const sourceFile = project.createSourceFile(id);
    const dataModel = await digest(odataBuilder.getSchema(), runOptions);

    const mg = new ModelGenerator(dataModel, sourceFile);
    mg.generate();

    return sourceFile;
  }

  test("smoke test", async () => {
    // given an empty data model

    // when generating model
    const sourceFile = await doGenerate("smokeTest");

    // then nothing really happened
    expect(sourceFile.getEnums()).toEqual([]);
    expect(sourceFile.getImportDeclarations()).toEqual([]);
    expect(sourceFile.getFullText()).toEqual("");
  });

  test("Model Generator: one enum type", async () => {
    // given only a single enum type
    odataBuilder.addEnumType("Choice", [
      { name: "A", value: 1 },
      { name: "B", value: 2 },
    ]);
    const expected = `
export enum Choice {
    A = "A",
    B = "B"
}`;

    // when generating model
    const sourceFile = await doGenerate("oneEnumType");

    // then we get a string enum
    expect(sourceFile.getEnums().length).toBe(1);
    expect(sourceFile.getFullText()).toContain(expected.trim());
  });

  test("Model Generator: complex type", async () => {
    // given one minimal model
    odataBuilder.addComplexType("Brand", undefined, (builder) => builder.addProp("naming", OdataTypes.String));

    const expected = `
export interface Brand {
    naming?: string;
}
`;

    // when generating model
    const sourceFile = await doGenerate("complexType");

    // then we get a string enum
    expect(sourceFile.getFullText().trim()).toBe(expected.trim());
  });

  test("Model Generator: one minimal model", async () => {
    // given one minimal model
    odataBuilder.addEntityType(ENTITY_NAME, undefined, (builder) => builder.addKeyProp("id", OdataTypes.String));
    const expected = `
export interface Book {
    id: string;
}`;

    // when generating model
    const sourceFile = await doGenerate("oneModel");

    // then we get a string enum
    expect(sourceFile.getFullText().trim()).toBe(expected.trim());
  });

  test("Model Generator: one max model", async () => {
    // given one minimal model
    odataBuilder.addEntityType(ENTITY_NAME, undefined, (builder) =>
      builder
        .addKeyProp("id", OdataTypes.Guid)
        .addProp("isTrue", OdataTypes.Boolean, false)
        .addProp("time", OdataTypes.Time)
        .addProp("optionalDate", OdataTypes.Date)
        .addProp("dateTimeOffset", OdataTypes.DateTimeOffset)
        .addProp("TestInt16", OdataTypes.Int16)
        .addProp("TestInt32", OdataTypes.Int32)
        .addProp("TestInt64", OdataTypes.Int64)
        .addProp("TestDecimal", OdataTypes.Decimal)
        .addProp("TestDouble", OdataTypes.Double)
        .addProp("testByte", OdataTypes.Byte)
        .addProp("testSByte", OdataTypes.SByte)
        .addProp("testSingle", OdataTypes.Single)
        .addProp("testBinary", OdataTypes.Binary)
        .addProp("testAny", "Edm.AnythingYouWant")
        .addProp("branding", `${SERVICE_NAME}.Brand`)
    );
    const expected = `
import type { GuidString, TimeOfDayString, DateString, DateTimeOffsetString, BinaryString } from "@odata2ts/odata-query-objects";

export interface Book {
    id: GuidString;
    isTrue: boolean;
    time?: TimeOfDayString;
    optionalDate?: DateString;
    dateTimeOffset?: DateTimeOffsetString;
    TestInt16?: number;
    TestInt32?: number;
    TestInt64?: number;
    TestDecimal?: number;
    TestDouble?: number;
    testByte?: number;
    testSByte?: number;
    testSingle?: number;
    testBinary?: BinaryString;
    testAny?: string;
    branding?: Brand;
}`;

    // when generating model
    const sourceFile = await doGenerate("oneMaxModel");

    // then we get a string enum
    expect(sourceFile.getFullText().trim()).toBe(expected.trim());
  });

  test("Model Generator: complex & collection", async () => {
    // given one minimal model
    odataBuilder.addEntityType(ENTITY_NAME, undefined, (builder) =>
      builder
        .addKeyProp("id", OdataTypes.String)
        .addProp("branding", `${SERVICE_NAME}.Brand`)
        .addProp("multipleStrings", `Collection(Edm.String)`)
    );
    const expected = `
export interface Book {
    id: string;
    branding?: Brand;
    multipleStrings?: Array<string>;
}`;

    // when generating model
    const sourceFile = await doGenerate("complexAndCollection");

    // then we get a string enum
    expect(sourceFile.getFullText().trim()).toBe(expected.trim());
  });

  test("Model Generator: base class", async () => {
    // given an entity hierarchy
    odataBuilder.addEntityType("GrandParent", undefined, (builder) => builder.addKeyProp("id", OdataTypes.String));
    odataBuilder.addEntityType("Parent", "GrandParent", (builder) =>
      builder.addProp("parentalAdvice", OdataTypes.Boolean)
    );
    odataBuilder.addEntityType("Child", "Parent", (builder) => builder.addProp("Ch1ld1shF4n", OdataTypes.String));

    const expected = `
export interface GrandParent {
    id: string;
}

export interface Parent extends GrandParent {
    parentalAdvice?: boolean;
}

export interface Child extends Parent {
    Ch1ld1shF4n?: string;
}
`;

    // when generating model
    const sourceFile = await doGenerate("baseClass");

    // then we get a string enum
    expect(sourceFile.getFullText().trim()).toBe(expected.trim());
  });
});
