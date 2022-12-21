import { QSearchTerm, searchTerm } from "../src";

describe("QFilterExpression test", () => {
  const exampleTerm = "example";
  const exampleSearchTerm = searchTerm(exampleTerm);
  const exampleResult = exampleTerm;
  const examplePhrase = "a phrase";
  const exampleSearchPhrase = searchTerm(examplePhrase);
  const exampleResult2 = `"${examplePhrase}"`;

  test("no term", () => {
    // @ts-ignore
    expect(searchTerm(null).toString()).toBe("");
    expect(searchTerm(undefined).toString()).toBe("");
    expect(searchTerm("").toString()).toBe("");
    expect(searchTerm(" ").toString()).toBe("");
  });

  test("not operator", () => {
    const toTest = exampleSearchTerm.not().toString();

    expect(toTest).toBe(`NOT ${exampleResult}`);
  });

  test("not operator with empty filter", () => {
    const toTest = searchTerm("").not().toString();

    expect(toTest).toBe("");
  });

  test("not operator multiple times", () => {
    const toTest = exampleSearchTerm.not().not().not().toString();

    expect(toTest).toBe(`NOT NOT NOT ${exampleResult}`);
  });

  test("and operator", () => {
    const toTest = exampleSearchTerm.and(examplePhrase).toString();
    const toTest2 = exampleSearchTerm.and(exampleSearchPhrase).toString();

    expect(toTest).toBe(`${exampleResult} AND ${exampleResult2}`);
    expect(toTest2).toBe(toTest);
  });

  test("and operator with empty filter", () => {
    const toTest = exampleSearchTerm.and(searchTerm(undefined)).toString();
    const toTest2 = searchTerm(null).and(examplePhrase).toString();

    expect(toTest).toBe(exampleResult);
    expect(toTest2).toBe(exampleResult2);
  });

  test("and operator multiple times", () => {
    const toTest = exampleSearchTerm.and(examplePhrase).and(examplePhrase).toString();

    expect(toTest).toBe(`${exampleResult} AND ${exampleResult2} AND ${exampleResult2}`);
  });

  test("or operator", () => {
    const toTest = exampleSearchTerm.or(examplePhrase).toString();
    const toTest2 = exampleSearchTerm.or(exampleSearchPhrase).toString();

    expect(toTest).toBe(`(${exampleResult} OR ${exampleResult2})`);
    expect(toTest2).toBe(toTest);
  });

  test("or operator with empty filter", () => {
    const toTest = exampleSearchTerm.or(searchTerm(null)).toString();
    const toTest2 = searchTerm(undefined).or(examplePhrase).toString();

    expect(toTest).toBe(exampleResult);
    expect(toTest2).toBe(exampleResult2);
  });

  test("or operator multiple times", () => {
    const toTest = exampleSearchTerm.or(examplePhrase).or(examplePhrase).or(exampleTerm).toString();

    expect(toTest).toBe(`(((${exampleResult} OR ${exampleResult2}) OR ${exampleResult2}) OR ${exampleResult})`);
  });

  test("combination", () => {
    const toTest = exampleSearchTerm.not().or(examplePhrase).and(examplePhrase).toString();

    expect(toTest).toBe(`(NOT ${exampleResult} OR ${exampleResult2}) AND ${exampleResult2}`);
  });

  test("or with parentheses", () => {
    const toTest = exampleSearchTerm.or(examplePhrase).and(exampleSearchTerm.or(examplePhrase)).toString();

    expect(toTest).toBe(`(${exampleResult} OR ${exampleResult2}) AND (${exampleResult} OR ${exampleResult2})`);
  });
});
