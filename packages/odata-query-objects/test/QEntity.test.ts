import {
  QBooleanPath,
  QDatePath,
  QTimeOfDayPath,
  QDateTimeOffsetPath,
  QEntityPath,
  QNumberPath,
  QStringPath,
  QCollectionPath,
  QEntityModel,
  QEnumPath,
  DateString,
  DateTimeOffsetString,
  TimeOfDayString,
  qEnumCollection,
} from "../src";

enum TypesEnum {
  Primitive = "Primitive",
  Complex = "Complex",
}

enum FeaturesEnum {
  Feature1 = "Feature1",
  Feature2 = "Feature2",
}

type EnumUnion = TypesEnum | FeaturesEnum;

interface SimpleEntity {
  name: string;
  myType: TypesEnum;
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
  features: Array<FeaturesEnum>;
  favFeature: FeaturesEnum;
}

const qComplex: QEntityModel<ComplexEntity, EnumUnion> = {
  x: new QNumberPath("x"),
  y: new QStringPath("y"),
  z: new QBooleanPath("Z"),
  az: new QDatePath("az"),
  bz: new QTimeOfDayPath("bz"),
  cz: new QDateTimeOffsetPath("cz"),
  xy: new QEntityPath("xy", () => qSimple),
  xx: new QCollectionPath("xx", () => qSimple),
  features: new QCollectionPath("features", () => qEnumCollection),
  favFeature: new QEnumPath("favFeature"),
};

const qSimple: QEntityModel<SimpleEntity, EnumUnion> = {
  name: new QStringPath("name"),
  myType: new QEnumPath("myType"),
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
