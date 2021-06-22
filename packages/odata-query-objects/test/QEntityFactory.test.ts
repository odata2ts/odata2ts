import { QBooleanPath, QEntityFactory, QEntityPath, QNumberPath, QStringPath, QEntityCollectionPath } from "../src";
import { QDatePath } from "../src/date-time-v4/QDatePath";
import { QDateTimeOffsetPath } from "../src/date-time-v4/QDateTimeOffsetPath";
import { QTimeOfDayPath } from "../src/date-time-v4/QTimeOfDayPath";
import { DateString, DateTimeOffsetString, TimeOfDayString } from "../src/ODataTypes";

interface SimpleEntity {
  name: string;
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

describe("QEntityFactory tests", () => {
  // Typing Test: Expect error for wrong typing
  QEntityFactory.create<SimpleEntity, "name">("test2", {
    // @ts-expect-error => wrong type, should be string
    name: new QDatePath("name"),
  });

  const qSimple = QEntityFactory.create<SimpleEntity, "name">("test2", {
    name: new QStringPath("name"),
    // Typing Test: Expect error for unknown members
    // @ts-expect-error => unknown member
    whoAmI: new QStringPath("whoAmI"),
  });

  const qComplex = QEntityFactory.create<ComplexEntity, "x" | "Z">("test", {
    x: new QNumberPath("x"),
    y: new QStringPath("y"),
    Z: new QBooleanPath("Z"),
    az: new QDatePath("az"),
    bz: new QTimeOfDayPath("bz"),
    cz: new QDateTimeOffsetPath("cz"),
    xy: new QEntityPath("xy", qSimple),
    xx: new QEntityCollectionPath("xx", qSimple),
  });

  test("create simple key", () => {
    // @ts-expect-error
    qSimple.createKey({ city: "Test" });
    // @ts-expect-error
    qSimple.createKey({ name: 123 });

    const result = qSimple.createKey({ name: "Horst" });
    expect(result).toBe("name='Horst'");
  });

  test("create complex key", () => {
    // @ts-expect-error
    qComplex.createKey({});
    // @ts-expect-error
    qComplex.createKey({ x: 2 });
    // @ts-expect-error
    qComplex.createKey({ x: "2", Z: false });

    const result = qComplex.createKey({ x: 123, Z: false });
    expect(result).toBe("x=123,Z=false");
  });

  test("simple prop", () => {
    // @ts-expect-error
    qSimple.name.eq(3);

    const result = qSimple.name.eq("hi").toString();
    expect(result).toBe("name eq 'hi'");
  });

  test("entity path", () => {
    const xyEntity = qComplex.xy.getEntity();

    //@ts-expect-error
    xyEntity.createKey({ name: 3 });

    const result = xyEntity.name.startsWith("Hi").toString();
    expect(result).toBe("startswith(name,'Hi')");
  });

  test("entity collection path", () => {
    const xxEntity = qComplex.xx.getEntity();

    //@ts-expect-error
    xxEntity.createKey({ name: 3 });

    const result = xxEntity.name.startsWith("Hi").toString();
    expect(result).toBe("startswith(name,'Hi')");
  });
});
