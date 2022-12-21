import { QFilterExpression, QNumberPath, QStringPath } from "../src";

describe("QFilterExpression test", () => {
  const exampleExpression = new QStringPath("text").equals("hi there!");
  const exampleResult = "text eq 'hi there!'";
  const exampleNumberExpr = new QNumberPath("number").equals(3);
  const exampleNumberResult = "number eq 3";

  test("might be empty", () => {
    // @ts-ignore
    expect(new QFilterExpression(null).toString()).toBe("");
    expect(new QFilterExpression(undefined).toString()).toBe("");
    expect(new QFilterExpression("    ").toString()).toBe("");
    expect(new QFilterExpression("").toString()).toBe("");
  });

  test("not operator", () => {
    const toTest = exampleExpression.not().toString();

    expect(toTest).toBe(`not(${exampleResult})`);
  });

  test("not operator with empty filter", () => {
    const toTest = new QFilterExpression().not().toString();

    expect(toTest).toBe("");
  });

  test("not operator multiple times", () => {
    const toTest = exampleExpression.not().not().not().toString();

    expect(toTest).toBe(`not(not(not(${exampleResult})))`);
  });

  test("and operator", () => {
    const toTest = exampleExpression.and(exampleNumberExpr).toString();

    expect(toTest).toBe(`${exampleResult} and ${exampleNumberResult}`);
  });

  test("and operator with empty filter", () => {
    const toTest = exampleExpression.and(new QFilterExpression()).toString();
    const toTest2 = new QFilterExpression().and(exampleExpression).toString();

    expect(toTest).toBe(exampleResult);
    expect(toTest2).toBe(exampleResult);
    expect(exampleExpression.and(null).toString()).toBe(exampleResult);
    expect(exampleExpression.and(undefined).toString()).toBe(exampleResult);
  });

  test("and operator multiple times", () => {
    const toTest = exampleExpression.and(exampleNumberExpr).and(exampleNumberExpr).toString();

    expect(toTest).toBe(`${exampleResult} and ${exampleNumberResult} and ${exampleNumberResult}`);
  });

  test("or operator", () => {
    const toTest = exampleExpression.or(exampleNumberExpr).toString();

    expect(toTest).toBe(`(${exampleResult} or ${exampleNumberResult})`);
  });

  test("or operator with empty filter", () => {
    const toTest = exampleExpression.or(new QFilterExpression()).toString();
    const toTest2 = new QFilterExpression().or(exampleExpression).toString();

    expect(toTest).toBe(exampleResult);
    expect(toTest2).toBe(exampleResult);
    expect(exampleExpression.or(null).toString()).toBe(exampleResult);
    expect(exampleExpression.or(undefined).toString()).toBe(exampleResult);
  });

  test("or operator multiple times", () => {
    const toTest = exampleExpression.or(exampleNumberExpr).or(exampleNumberExpr).or(exampleExpression).toString();

    expect(toTest).toBe(
      `(((${exampleResult} or ${exampleNumberResult}) or ${exampleNumberResult}) or ${exampleResult})`
    );
  });

  test("combination", () => {
    const toTest = exampleExpression.not().or(exampleNumberExpr).and(exampleNumberExpr).toString();

    expect(toTest).toBe(`(not(${exampleResult}) or ${exampleNumberResult}) and ${exampleNumberResult}`);
  });

  test("or with parentheses", () => {
    const toTest = exampleExpression.or(exampleNumberExpr).and(exampleExpression.or(exampleNumberExpr)).toString();

    expect(toTest).toBe(
      `(${exampleResult} or ${exampleNumberResult}) and (${exampleResult} or ${exampleNumberResult})`
    );
  });
});
