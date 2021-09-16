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
  qStringCollection,
  qGuidCollection,
  QEntityCollectionPath,
  GuidString,
  QGuidPath,
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
  id: GuidString;
  name: string;
  myType: TypesEnum;
  complexton: ComplexEntity;
}

interface ComplexEntity {
  ID: GuidString;
  x: number;
  y?: string;
  Z: boolean;
  az: DateString;
  bz?: TimeOfDayString;
  cz: DateTimeOffsetString;
  xy?: SimpleEntity;
  xx: Array<SimpleEntity>;
  primitiveCollection: Array<string>;
  nominalizedCollection: Array<GuidString>;
  features: Array<FeaturesEnum>;
  favFeature: FeaturesEnum;
}

const qComplex: QEntityModel<ComplexEntity, EnumUnion> = {
  id: new QGuidPath("ID"),
  x: new QNumberPath("x"),
  y: new QStringPath("y"),
  z: new QBooleanPath("Z"),
  az: new QDatePath("az"),
  bz: new QTimeOfDayPath("bz"),
  cz: new QDateTimeOffsetPath("cz"),
  xy: new QEntityPath("xy", () => qSimple),
  xx: new QEntityCollectionPath("xx", () => qSimple),
  primitiveCollection: new QCollectionPath("PrimitiveCollection", () => qStringCollection),
  nominalizedCollection: new QCollectionPath("NominalizedCollection", () => qGuidCollection),
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

  test("ID prop", () => {
    const result = qComplex.id.eq("123").toString();
    expect(result).toBe("ID eq 123");
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

  test("collection path", () => {
    const pc = qComplex.primitiveCollection;

    expect(pc.getEntity()).toBe(qStringCollection);
    expect(pc.getPath()).toBe("PrimitiveCollection");
  });
});
