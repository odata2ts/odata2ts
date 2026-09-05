import { describe, expect, test } from "vitest";
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

  test("group operator", () => {
    const toTest = exampleExpression.group().toString();

    expect(toTest).toBe(`(${exampleResult})`);
  });

  test("group operator with empty filter", () => {
    const toTest = new QFilterExpression().group().toString();

    expect(toTest).toBe("");
  });

  test("group operator multiple times", () => {
    const toTest = exampleExpression.group().group().group().toString();

    expect(toTest).toBe(`(((${exampleResult})))`);
  });

  test("not operator", () => {
    const toTest = exampleExpression.not().toString();

    expect(toTest).toBe(`not ${exampleResult}`);
  });

  test("not operator with empty filter", () => {
    const toTest = new QFilterExpression().not().toString();

    expect(toTest).toBe("");
  });

  test("not operator multiple times", () => {
    const toTest = exampleExpression.not().not().not().toString();

    expect(toTest).toBe(`not not not ${exampleResult}`);
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

    expect(toTest).toBe(`${exampleResult} or ${exampleNumberResult}`);
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

    expect(toTest).toBe(`${exampleResult} or ${exampleNumberResult} or ${exampleNumberResult} or ${exampleResult}`);
  });

  test("combination", () => {
    const toTest = exampleNumberExpr.and(exampleExpression.not().or(exampleNumberExpr).group()).toString();

    expect(toTest).toBe(`${exampleNumberResult} and (not ${exampleResult} or ${exampleNumberResult})`);
  });

  test("or with parentheses", () => {
    const toTest = exampleExpression
      .or(exampleNumberExpr)
      .group()
      .and(exampleExpression.or(exampleNumberExpr).group())
      .toString();

    expect(toTest).toBe(
      `(${exampleResult} or ${exampleNumberResult}) and (${exampleResult} or ${exampleNumberResult})`,
    );
  });
});

describe("QFilterExpression: structured description", () => {
  const eqFive = new QFilterExpression("MediumId eq 5", [{ path: "MediumId", operator: "eq", value: 5 }]);
  const gtTwo = new QFilterExpression("Year gt 2000", [{ path: "Year", operator: "gt", value: 2000 }]);

  test("a bare expression with no clauses is raw", () => {
    const expression = new QFilterExpression("A eq 1 or B eq 2");
    expect(expression.getClauses()).toEqual([]);
    expect(expression.getRaw()).toEqual(["A eq 1 or B eq 2"]);
  });

  test("an expression built with clauses is not raw", () => {
    expect(eqFive.getClauses()).toEqual([{ path: "MediumId", operator: "eq", value: 5 }]);
    expect(eqFive.getRaw()).toEqual([]);
  });

  test("an empty expression carries nothing", () => {
    const expression = new QFilterExpression();
    expect(expression.getClauses()).toEqual([]);
    expect(expression.getRaw()).toEqual([]);
  });

  test("whitespace-only expression carries nothing", () => {
    const expression = new QFilterExpression("   ");
    expect(expression.getClauses()).toEqual([]);
    expect(expression.getRaw()).toEqual([]);
    expect(expression.toString()).toBe("");
  });

  test("and() merges clauses and raw from both sides", () => {
    const merged = eqFive.and(gtTwo).and(new QFilterExpression("contains(Title,'ai')"));
    expect(merged.getClauses()).toEqual([
      { path: "MediumId", operator: "eq", value: 5 },
      { path: "Year", operator: "gt", value: 2000 },
    ]);
    expect(merged.getRaw()).toEqual(["contains(Title,'ai')"]);
    expect(merged.toString()).toBe("MediumId eq 5 and Year gt 2000 and contains(Title,'ai')");
  });

  test("and() with an empty expression changes nothing", () => {
    expect(eqFive.and(new QFilterExpression()).getClauses()).toEqual(eqFive.getClauses());
    expect(eqFive.and(null).getClauses()).toEqual(eqFive.getClauses());
  });

  test("and() onto an empty expression adopts the other side unchanged", () => {
    const merged = new QFilterExpression().and(eqFive);
    expect(merged.getClauses()).toEqual(eqFive.getClauses());
    expect(merged.getRaw()).toEqual([]);
  });

  test("or() collapses everything into one raw fragment", () => {
    const merged = eqFive.or(gtTwo);
    expect(merged.getClauses()).toEqual([]);
    expect(merged.getRaw()).toEqual(["MediumId eq 5 or Year gt 2000"]);
  });

  test("not() collapses into one raw fragment", () => {
    const negated = eqFive.not();
    expect(negated.getClauses()).toEqual([]);
    expect(negated.getRaw()).toEqual(["not MediumId eq 5"]);
  });

  test("group() collapses into one raw fragment", () => {
    const grouped = eqFive.and(gtTwo).group();
    expect(grouped.getClauses()).toEqual([]);
    expect(grouped.getRaw()).toEqual(["(MediumId eq 5 and Year gt 2000)"]);
  });

  test("not() and group() leave an empty expression alone", () => {
    const empty = new QFilterExpression();
    expect(empty.not().getRaw()).toEqual([]);
    expect(empty.group().getRaw()).toEqual([]);
  });
});
