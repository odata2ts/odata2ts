import {
  QBooleanPath,
  QDatePath,
  QTimeOfDayPath,
  QDateTimeOffsetPath,
  QEntityFactory,
  QEntityPath,
  QNumberPath,
  QStringPath,
  QEntityCollectionPath,
  QEntityModel,
  DateString,
  DateTimeOffsetString,
  TimeOfDayString,
} from "../src";

interface SimpleEntity {
  name: string;
  complexton: ComplexEntity;
}

interface ComplexEntity {
  x: number;
  y?: string;
  Z: boolean;
  az: DateString;
  bz?: TimeOfDayString;
  cz: DateTimeOffsetString;
  xy?: SimpleEntity;
  xx: Array<SimpleEntity>;
}

const qComplex: QEntityModel<ComplexEntity, "x" | "Z"> = {
  __collectionPath: "test",
  x: new QNumberPath("x"),
  y: new QStringPath("y"),
  Z: new QBooleanPath("Z"),
  az: new QDatePath("az"),
  bz: new QTimeOfDayPath("bz"),
  cz: new QDateTimeOffsetPath("cz"),
  xy: new QEntityPath("xy", () => qSimple),
  xx: new QEntityCollectionPath("xx", () => qSimple),
};

const qSimple: QEntityModel<SimpleEntity, "name"> = {
  __collectionPath: "test2",
  name: new QStringPath("name"),
  complexton: new QEntityPath("complexton", () => qComplex),
  // Typing Test: Expect error for unknown members
  // @ts-expect-error => unknown member
  whoAmI: new QStringPath("whoAmI"),
};

describe("QEntityFactory tests", () => {
  // Typing Test: Expect error for wrong typing
  /*  QEntityFactory.create<SimpleEntity, "name">("test2", {
    // @ts-expect-error => wrong type, should be string
    name: new QDatePath("name"),
  }); */

  test("__collectionPath", () => {
    expect(qSimple.__collectionPath).toBe("test2");
    expect(qComplex.__collectionPath).toBe("test");
  });

  test("simple prop", () => {
    // @ts-expect-error
    qSimple.name.eq(3);

    const result = qSimple.name.eq("hi").toString();
    expect(result).toBe("name eq 'hi'");
  });

  test("entity path", () => {
    const xyEntity = qComplex.xy.getEntity();

    const result = xyEntity.name.startsWith("Hi").toString();
    expect(result).toBe("startswith(name,'Hi')");
  });

  test("entity collection path", () => {
    const xxEntity = qComplex.xx.getEntity();

    const result = xxEntity.name.startsWith("Hi").toString();
    expect(result).toBe("startswith(name,'Hi')");
  });
});