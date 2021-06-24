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
} from "../src";
import { DateString, DateTimeOffsetString, TimeOfDayString } from "../src/odata/ODataTypes";

interface SimpleEntity {
  name: string;
}

interface ComplexEntity {
  articleNo: number;
  description?: string;
  Active: boolean;
  deletedAt?: DateString;
  bestSellingTime?: TimeOfDayString;
  createdAt: DateTimeOffsetString;
  simpleton?: SimpleEntity;
  simpleList: Array<SimpleEntity>;
}

describe("QEntityFactory tests", () => {
  // Typing Test: Expect error for wrong typing
  QEntityFactory.create<SimpleEntity, "name">("test2", {
    // @ts-expect-error => wrong type, should be string
    name: QDatePath,
  });

  const qSimple = QEntityFactory.create<SimpleEntity, "name">("test2", {
    name: QStringPath,
    // Typing Test: Expect error for unknown members
    // @ts-expect-error => unknown member
    whoAmI: QStringPath,
  });

  const qComplex = QEntityFactory.create<ComplexEntity, "articleNo" | "Active">("test", {
    articleNo: QNumberPath,
    description: QStringPath,
    Active: QBooleanPath,
    deletedAt: QDatePath,
    bestSellingTime: QTimeOfDayPath,
    createdAt: QDateTimeOffsetPath,
    simpleton: [QEntityPath, qSimple],
    simpleList: [QEntityCollectionPath, qSimple],
  });

  test("__collectionPath", () => {
    expect(qSimple.__collectionPath).toBe("test2");
    // expect(qComplex.__collectionPath).toBe("test");
  });

  test("simple prop", () => {
    // @ts-expect-error
    qSimple.name.eq(3);

    const result = qSimple.name.eq("hi").toString();
    expect(result).toBe("name eq 'hi'");
  });

  test("entity path", () => {
    const xyEntity = qComplex.simpleton.getEntity();

    const result = xyEntity.name.startsWith("Hi").toString();
    expect(result).toBe("startswith(name,'Hi')");
  });

  test("entity collection path", () => {
    const xxEntity = qComplex.simpleList.getEntity();

    const result = xxEntity.name.startsWith("Hi").toString();
    expect(result).toBe("startswith(name,'Hi')");
  });
});
