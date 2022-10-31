import { MappedConverterChains } from "@odata2ts/converter-runtime";
import { ODataTypesV2, ODataTypesV4 } from "@odata2ts/odata-core";

import { DataModel } from "../../src/data-model/DataModel";
import { ODataVersion } from "../../src/data-model/DataTypeModel";

describe("Data Model Tests", function () {
  let dataModel: DataModel;

  beforeEach(() => {
    dataModel = new DataModel(ODataVersion.V4);
  });

  test("smoke test", () => {
    expect(dataModel.getODataVersion()).toBe(ODataVersion.V4);

    expect(dataModel.getModels().length).toBe(0);
    expect(dataModel.getComplexTypes().length).toBe(0);
    expect(dataModel.getEnums().length).toBe(0);
  });

  test("v2 version", () => {
    const result = new DataModel(ODataVersion.V2);

    expect(result.getODataVersion()).toBe(ODataVersion.V2);
  });

  test("adding converter", () => {
    const pkg = "test";
    const converterId = "testId";
    const expected = {
      from: ODataTypesV2.Time,
      to: ODataTypesV4.Duration,
      converters: [{ package: pkg, converterId }],
    };

    const convMap: MappedConverterChains = new Map();
    convMap.set(ODataTypesV2.Time, expected);

    dataModel = new DataModel(ODataVersion.V4, convMap);

    expect(dataModel.getConverter(ODataTypesV2.Time)).toStrictEqual(expected);
  });
});
