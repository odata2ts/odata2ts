import { DataModel } from "../../src/data-model/DataModel";
import { ODataVersion } from "../../src/data-model/DataTypeModel";

describe("Data Model Tests", function () {
  const ORIGINAL_SERVICE_NAME = "TEST_ME";
  const SERVICE_NAME = "TestMe";

  let dataModel: DataModel;

  beforeEach(() => {
    dataModel = new DataModel(ODataVersion.V4, ORIGINAL_SERVICE_NAME);
  });

  test("smoke test", () => {
    expect(dataModel.getODataVersion()).toBe(ODataVersion.V4);
    expect(dataModel.getServiceName()).toBe(ORIGINAL_SERVICE_NAME);
    expect(dataModel.getServicePrefix()).toBe(ORIGINAL_SERVICE_NAME + ".");
    expect(dataModel.getFileNames()).toStrictEqual({
      model: `${SERVICE_NAME}Model`,
      qObject: `Q${SERVICE_NAME}`,
      service: `${SERVICE_NAME}Service`,
    });

    expect(dataModel.getModels().length).toBe(0);
    expect(dataModel.getComplexTypes().length).toBe(0);
    expect(dataModel.getEnums().length).toBe(0);
  });

  test("v2 version", () => {
    const result = new DataModel(ODataVersion.V2, SERVICE_NAME);

    expect(result.getODataVersion()).toBe(ODataVersion.V2);
  });

  test("Get Editable Model Name", () => {
    const modelName = "TestModel";
    const result = dataModel.getEditableModelName(modelName);

    expect(result).toBe(`Editable${modelName}`);
  });

  test("Deduplicate Service Suffix", async () => {
    const newServiceName = "TestService";
    const result = new DataModel(ODataVersion.V4, newServiceName);

    expect(result.getServiceName()).toBe(newServiceName);
    expect(result.getFileNames()).toEqual({
      model: `${newServiceName}Model`,
      qObject: `Q${newServiceName}`,
      service: newServiceName,
    });
  });

  test("Overwrite Service Name", () => {
    const newServiceName = "OverwriteTest";
    dataModel = new DataModel(ODataVersion.V4, SERVICE_NAME, newServiceName);

    expect(dataModel.getServiceName()).toBe(SERVICE_NAME);
    expect(dataModel.getFileNames()).toStrictEqual({
      model: `${newServiceName}Model`,
      qObject: `Q${newServiceName}`,
      service: `${newServiceName}Service`,
    });
  });

  test("fileNames are always in PascalCase", () => {
    const expected = "AbcDefGhi";
    const expRes = {
      model: `${expected}Model`,
      qObject: `Q${expected}`,
      service: `${expected}Service`,
    };

    const firstVersion = "abcDef-ghi";
    dataModel = new DataModel(ODataVersion.V4, firstVersion);

    expect(dataModel.getServiceName()).toBe(firstVersion);
    expect(dataModel.getFileNames()).toEqual(expRes);

    dataModel = new DataModel(ODataVersion.V4, SERVICE_NAME, "abc_DEFGhi");
    expect(dataModel.getFileNames()).toEqual(expRes);
  });
});
