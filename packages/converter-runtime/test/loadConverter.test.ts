import { ValueConverterChain } from "@odata2ts/converter-runtime";
import { ODataTypesV2, ODataTypesV4, ODataVersions } from "@odata2ts/odata-core";

import { loadConverters } from "../src";

describe("LoadConverters Test", () => {
  const V2_TO_V4_PKG = "@odata2ts/converter-v2-to-v4";
  const LUXON_PKG = "@odata2ts/converter-luxon";

  // time, dateTime, byte, sByte, single, double, int64, decimal
  const V2_TO_V4_CONVERTERS_SIZE = 8;

  test("no converters", async () => {
    const result = await loadConverters(ODataVersions.V4, undefined);
    expect(result).toBeUndefined();
  });

  test("empty converters", async () => {
    const result = await loadConverters(ODataVersions.V4, []);
    expect(result).toBeUndefined();
  });

  test("load installed converter", async () => {
    const result = await loadConverters(ODataVersions.V2, [V2_TO_V4_PKG]);

    expect(result).toBeDefined();
    expect(result?.size).toBe(V2_TO_V4_CONVERTERS_SIZE);

    const timeType = result?.get(ODataTypesV2.Time);
    expect(timeType?.from).toBe("Edm.Time");
    expect(timeType?.to).toBe(ODataTypesV4.Duration);
    expect(timeType?.converters).toStrictEqual([
      {
        package: V2_TO_V4_PKG,
        converterId: "timeToDurationConverter",
      },
    ]);
  });

  test("load installed converters with no application", async () => {
    const result = await loadConverters(ODataVersions.V4, [V2_TO_V4_PKG]);

    // all string number types would still be mapped, but not Edm.Time and Edm.DateTime
    expect(result).toBeDefined();
    expect(result?.size).toBe(V2_TO_V4_CONVERTERS_SIZE - 2);
  });

  test("specify installed converters without using any of them", async () => {
    const result = await loadConverters(ODataVersions.V4, [{ module: V2_TO_V4_PKG, use: [] }]);

    // all string number types would still be mapped, but not Edm.Time and Edm.DateTime
    expect(result).toBeUndefined();
  });

  test("specify installed converters and use only two of them", async () => {
    const converterIds = ["timeToTimeOfDayConverter", "dateTimeToDateTimeOffsetConverter"];
    const result = await loadConverters(ODataVersions.V2, [{ module: V2_TO_V4_PKG, use: converterIds }]);

    // all string number types would still be mapped, but not Edm.Time and Edm.DateTime
    expect(result).toBeDefined();
    expect(result?.size).toBe(converterIds.length);
    expect(result?.get(ODataTypesV2.Time)).toStrictEqual({
      from: ODataTypesV2.Time,
      to: ODataTypesV4.TimeOfDay,
      toModule: undefined,
      converters: [
        {
          package: V2_TO_V4_PKG,
          converterId: converterIds[0],
        },
      ],
    } as ValueConverterChain);
  });

  test("fail to load converter", async () => {
    const fakeModule = "xxxxNotExistentxxxx";
    const expectedError = new Error(`Failed to load module "${fakeModule}"!`);

    await expect(loadConverters(ODataVersions.V2, [fakeModule])).rejects.toMatchObject(expectedError);
    await expect(loadConverters(ODataVersions.V2, [V2_TO_V4_PKG, fakeModule])).rejects.toMatchObject(expectedError);
    await expect(loadConverters(ODataVersions.V2, [fakeModule, V2_TO_V4_PKG])).rejects.toMatchObject(expectedError);
  });

  test("chaining", async () => {
    const modules = [V2_TO_V4_PKG, LUXON_PKG];

    const result = await loadConverters(ODataVersions.V2, modules);
    expect(result?.size).toBe(9);

    const dateTimeToLuxon = result?.get(ODataTypesV2.DateTime);
    expect(dateTimeToLuxon).toStrictEqual({
      from: ODataTypesV2.DateTime,
      to: "DateTime",
      toModule: "luxon",
      converters: [
        {
          package: V2_TO_V4_PKG,
          converterId: "dateTimeToDateTimeOffsetConverter",
        },
        {
          package: LUXON_PKG,
          converterId: "dateTimeOffsetToLuxonConverter",
        },
      ],
    } as ValueConverterChain);
  });
});
