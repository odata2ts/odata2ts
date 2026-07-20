import { describe, expect, test } from "vitest";
import { ODataQueryBuilder } from "../src/ODataQueryBuilder";
import { qPerson } from "./fixture/types/QSimplePersonModel";

describe("ODataQueryBuilder engine tests (internal)", () => {
  // buildNested() is only invoked internally via expanding() on complex-typed props, but is itself public.
  // Note: buildQuery()'s `filterConcat` truthy-check (line 312) is structurally unreachable - Array.reduce()
  // without an initial value on a non-empty array always yields a truthy object - and is not tested here.

  test("buildNested: complex context, encoded (default) with no params", () => {
    const engine = new ODataQueryBuilder("Address", qPerson, { expandingBuilder: true });

    expect(engine.buildNested(true)).toStrictEqual({ content: "Address", hoistedExpands: [] });
  });

  test("buildNested: complex context, unencoded and expandingBuilder combined", () => {
    const engine = new ODataQueryBuilder("Address", qPerson, { unencoded: true, expandingBuilder: true });
    engine.select(["name"]);

    expect(engine.buildNested(true).content).toBe("Address($select=name)");
  });
});
