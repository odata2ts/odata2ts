import { QStringCollection } from "../src";
import { qComplex, qSimple } from "./fixture/SimpleComplexModel";

describe("QEntity tests", () => {
  // typing test
  // @ts-expect-error
  qSimple.name.eq(3);

  test("simple prop", () => {
    const result = qSimple.name.eq("hi").toString();
    expect(result).toBe("name eq 'hi'");
  });

  test("ID prop", () => {
    const result = qComplex.id.eq("123").toString();
    expect(result).toBe("id eq 123");
  });

  test("entity path", () => {
    const xyEntity = qComplex.xy.getEntity();
    const xyEntity2 = qComplex.xy.getEntity(true);

    const result = xyEntity.name.startsWith("Hi").toString();
    const result2 = xyEntity2.name.startsWith("Hi").toString();
    expect(result).toBe("startswith(name,'Hi')");
    expect(result2).toBe("startswith(xy/name,'Hi')");
  });

  test("entity collection path", () => {
    const xxEntity = qComplex.xx.getEntity();
    const xxEntity2 = qComplex.xx.getEntity(true);

    const result = xxEntity.name.startsWith("Hi").toString();
    const result2 = xxEntity2.name.startsWith("Hi").toString();
    expect(result).toBe("startswith(name,'Hi')");
    expect(result2).toBe("startswith(xx/name,'Hi')");
  });

  test("collection path", () => {
    const pc = qComplex.primitiveCollection;

    expect(pc.getEntity()).toBeInstanceOf(QStringCollection);
    expect(pc.getPath()).toBe("PrimitiveCollection");
  });
});
