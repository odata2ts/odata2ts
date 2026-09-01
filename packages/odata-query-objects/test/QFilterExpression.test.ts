import { describe, expect, test } from "vitest";
import { QFilterExpression } from "../src";

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
