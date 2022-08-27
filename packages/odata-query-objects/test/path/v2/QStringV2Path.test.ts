import { QStringV2Path } from "../../../src";
import { createStringTests } from "../StringBaseTests";

describe("QStringPath test", () => {
  createStringTests(QStringV2Path);

  let toTest: QStringV2Path;
  let otherProp: QStringV2Path;

  beforeEach(() => {
    toTest = new QStringV2Path("Country");
    otherProp = new QStringV2Path("Language");
  });

  test("get URL conform value", () => {
    expect(QStringV2Path.getUrlConformValue("Tester")).toBe("'Tester'");
  });

  test("substringOf", () => {
    const result = toTest.substringOf("ran");

    expect(result.toString()).toBe("substringof('ran',Country)");
  });

  test("contains prop", () => {
    const result = toTest.substringOf(otherProp);

    expect(result.toString()).toBe("substringof(Language,Country)");
  });
});
