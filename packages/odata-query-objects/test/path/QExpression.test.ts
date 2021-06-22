import { QExpression, QNumberPath, QStringPath } from "../../src";

describe("QNumberPath test", () => {
  const exampleExpression = new QStringPath("text").equals("hi there!");
  const exampleResult = "text eq 'hi there!'";
  const exampleNumberExpr = new QNumberPath("number").equals(3);
  const exampleNumberResult = "number eq 3";

  test("fails with null, undefined, empty string", () => {
    // @ts-ignore
    expect(() => new QExpression(null)).toThrow();
    // @ts-ignore
    expect(() => new QExpression()).toThrow();
    // @ts-ignore
    expect(() => new QExpression(undefined)).toThrow();
    expect(() => new QExpression("")).toThrow();
    expect(() => new QExpression(" ")).toThrow();
  });

  test("not operator", () => {
    const toTest = exampleExpression.not().toString();

    expect(toTest).toBe(`not(${exampleResult})`);
  });

  test("not operator multiple times", () => {
    const toTest = exampleExpression.not().not().not().toString();

    expect(toTest).toBe(`not(not(not(${exampleResult})))`);
  });

  test("and operator", () => {
    const toTest = exampleExpression.and(exampleNumberExpr).toString();

    expect(toTest).toBe(`${exampleResult} and ${exampleNumberResult}`);
  });

  test("and operator multiple times", () => {
    const toTest = exampleExpression.and(exampleNumberExpr).and(exampleNumberExpr).and(exampleExpression).toString();

    expect(toTest).toBe(`${exampleResult} and ${exampleNumberResult} and ${exampleNumberResult} and ${exampleResult}`);
  });

  test("or operator", () => {
    const toTest = exampleExpression.or(exampleNumberExpr).toString();

    expect(toTest).toBe(`${exampleResult} or ${exampleNumberResult}`);
  });

  test("or operator multiple times", () => {
    const toTest = exampleExpression.or(exampleNumberExpr).or(exampleNumberExpr).or(exampleExpression).toString();

    expect(toTest).toBe(`${exampleResult} or ${exampleNumberResult} or ${exampleNumberResult} or ${exampleResult}`);
  });

  test("combination", () => {
    const toTest = exampleExpression.not().or(exampleNumberExpr).and(exampleNumberExpr).toString();

    expect(toTest).toBe(`not(${exampleResult}) or ${exampleNumberResult} and ${exampleNumberResult}`);
  });
});
