import { QBooleanPath, QEntityFactory, QEntityPath, QNumberPath, QStringPath, QEntityCollectionPath } from "../src";
import { QDatePath } from "../src/date-time-v4/QDatePath";
import { QDateTimeOffsetPath } from "../src/date-time-v4/QDateTimeOffsetPath";
import { QTimeOfDayPath } from "../src/date-time-v4/QTimeOfDayPath";
import { DateString, DateTimeOffsetString, TimeOfDayString } from "../src/ODataTypes";

test("no test here - this file only needs to be type checked", () => {});

interface Test2 {
  name: string;
}

interface Test {
  x: number;
  y?: string;
  Z: boolean;
  az: DateString;
  bz?: TimeOfDayString;
  cz: DateTimeOffsetString;
  xy?: Test2;
  xx: Array<Test2>;
}

const qTesterFailing = QEntityFactory.create<Test2, "name">("test2", {
  // @ts-expect-error => wrong type
  name: new QDatePath("name"),
});

const qTester2 = QEntityFactory.create<Test2, "name">("test2", {
  name: new QStringPath("name"),
  // @ts-expect-error => unknown member
  whoAmI: new QStringPath("test"),
});

const qTester = QEntityFactory.create<Test, "x" | "Z">("test", {
  x: new QNumberPath("x"),
  y: new QStringPath("y"),
  Z: new QBooleanPath("Z"),
  az: new QDatePath("az"),
  bz: new QTimeOfDayPath("bz"),
  cz: new QDateTimeOffsetPath("cz"),
  xy: new QEntityPath("xy", qTester2),
  xx: new QEntityCollectionPath("xx", qTester2),
});

qTester.x.eq(3).and(qTester.x.add(5.3).ceiling().lt(10));
// @ts-expect-error
qTester.x.eq("3");

qTester.y.eq("hi").or(qTester.y.startsWith("hello"));
// @ts-expect-error
qTester.y.eq(3);

qTester.createKey({ x: 2, Z: false });
// @ts-expect-error
qTester.createKey({});
// @ts-expect-error
qTester.createKey({ x: 2 });
// @ts-expect-error
qTester.createKey({ x: "2", Z: false });

const xyEntity = qTester.xy.getEntity();
xyEntity.name.endsWith("be!");
//@ts-expect-error
xyEntity.createKey({ name: 3 });
