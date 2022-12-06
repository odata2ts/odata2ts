import { PartialDeep } from "type-fest";

import { QComplexParam } from "../../src";
import { QSimpleEntityWithConverter, SimpleEntityWithConverter } from "../fixture/SimpleEntityWithConverter";

describe("QComplexParam Tests", function () {
  const NAME = "Test";
  const Q_OBJECT = new QSimpleEntityWithConverter();
  const toTest = new QComplexParam<PartialDeep<SimpleEntityWithConverter>, QSimpleEntityWithConverter>(NAME, Q_OBJECT);

  test("base getters", () => {
    expect(toTest.getName()).toBe(NAME);
    expect(toTest.getMappedName()).toBe(NAME);
  });

  test("mapped name", () => {
    const newName = "hello_World";
    const result = new QComplexParam(NAME, Q_OBJECT, newName);

    expect(result.getName()).toBe(NAME);
    expect(result.getMappedName()).toBe(newName);
  });

  test("fail creation", () => {
    // @ts-expect-error
    expect(() => new QComplexParam(NAME, undefined)).toThrow();
    // @ts-expect-error
    expect(() => new QComplexParam(NAME, null)).toThrow();
    // @ts-expect-error
    expect(() => new QComplexParam(undefined, Q_OBJECT)).toThrow();
    // @ts-expect-error
    expect(() => new QComplexParam(null, Q_OBJECT)).toThrow();
    expect(() => new QComplexParam(" ", Q_OBJECT)).toThrow();
  });

  test("convert", () => {
    const odataModel = { ID: 123, truth: true };
    const userModel = { id: 123, truth: 1 };

    expect(toTest.convertFrom(odataModel)).toStrictEqual(userModel);
    expect(toTest.convertTo(userModel)).toStrictEqual(odataModel);
    expect(toTest.convertFrom([odataModel, odataModel])).toStrictEqual([userModel, userModel]);
    expect(toTest.convertTo([userModel, userModel])).toStrictEqual([odataModel, odataModel]);
  });

  test("formatUrlValue & parseUrlValue", () => {
    const userModel = { id: 123, truth: 1 };
    const odataString = '{"ID":123,"truth":true}';
    const odataCollectionString = `[${odataString},${odataString}]`;

    expect(toTest.formatUrlValue(userModel)).toStrictEqual(odataString);
    expect(toTest.parseUrlValue(odataString)).toStrictEqual(userModel);
    expect(toTest.formatUrlValue([userModel, userModel])).toStrictEqual(odataCollectionString);
    expect(toTest.parseUrlValue(odataCollectionString)).toStrictEqual([userModel, userModel]);
  });
});
