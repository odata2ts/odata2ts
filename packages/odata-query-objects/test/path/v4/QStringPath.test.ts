import { QStringPath } from "../../../src";
import { createStringTests } from "../StringBaseTests";

describe("QStringPath test", () => {
  createStringTests(QStringPath);

  let toTest: QStringPath;
  let otherProp: QStringPath;

  beforeEach(() => {
    toTest = new QStringPath("Country");
    otherProp = new QStringPath("Language");
  });

  test("get URL conform value", () => {
    expect(QStringPath.getUrlConformValue("Tester")).toBe("'Tester'");
  });

  test("contains", () => {
    const result = toTest.contains("ran");

    expect(result.toString()).toBe("contains(Country,'ran')");
  });

  test("contains prop", () => {
    const result = toTest.contains(otherProp);

    expect(result.toString()).toBe("contains(Country,Language)");
  });

  test("matchesPattern", () => {
    const result = toTest.matchesPattern("[A-Za-z]+");

    expect(result.toString()).toBe("matchesPattern(Country,'[A-Za-z]+')");
  });

  test("matchesPattern prop", () => {
    const result = toTest.matchesPattern(otherProp);

    expect(result.toString()).toBe("matchesPattern(Country,Language)");
  });
});
