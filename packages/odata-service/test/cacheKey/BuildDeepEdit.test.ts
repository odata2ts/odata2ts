import { describe, expect, test } from "vitest";
import { buildDeepEditHops } from "../../src/cacheKey";

const MEMBER = "Library.Circulation.Member";
const LOAN = "Library.Circulation.Loan";
const COPY = "Library.Circulation.Copy";

const NAV_HOPS = {
  [MEMBER]: {
    loans: [LOAN, "list", "Loans"] as const,
    reservations: ["Library.Circulation.Reservation", "list", "Reservations"] as const,
  },
  [LOAN]: {
    copy: [COPY, "detail", "Copy"] as const,
  },
};

describe("buildDeepEditHops", () => {
  test("no nav properties in the payload: undefined", () => {
    expect(buildDeepEditHops(NAV_HOPS, MEMBER, { name: "x" })).toBeUndefined();
  });

  test("a plain deep insert contributes its hop", () => {
    const data = { name: "x", loans: [{ loanedAt: "2026-01-01" }] };
    expect(buildDeepEditHops(NAV_HOPS, MEMBER, data)).toEqual([[LOAN, "list", "Loans"]]);
  });

  test('a binding ({"@id": key}) is not a deep insert and contributes nothing', () => {
    const data = { name: "x", loans: [{ "@id": 5 }] };
    expect(buildDeepEditHops(NAV_HOPS, MEMBER, data)).toBeUndefined();
  });

  test("a mix of a binding and a real deep insert in the same to-many array: only the real one counts", () => {
    const data = { loans: [{ "@id": 5 }, { loanedAt: "2026-01-01" }] };
    expect(buildDeepEditHops(NAV_HOPS, MEMBER, data)).toEqual([[LOAN, "list", "Loans"]]);
  });

  test("recurses into a nested deep insert using the nested type's own table entry", () => {
    const data = { loans: [{ loanedAt: "2026-01-01", copy: { condition: 3 } }] };
    expect(buildDeepEditHops(NAV_HOPS, MEMBER, data)).toEqual([
      [LOAN, "list", "Loans"],
      [COPY, "detail", "Copy"],
    ]);
  });

  test("a to-one deep insert (single object, not an array) is found too", () => {
    const oneToOneHops = {
      [MEMBER]: { idDocument: ["Library.Circulation.IdDocument", "detail", "IdDocument"] as const },
    };
    const data = { idDocument: { number: "x" } };
    expect(buildDeepEditHops(oneToOneHops, MEMBER, data)).toEqual([
      ["Library.Circulation.IdDocument", "detail", "IdDocument"],
    ]);
  });

  test("a type with no table entry at all contributes nothing", () => {
    expect(buildDeepEditHops(NAV_HOPS, "Some.Unknown.Type", { loans: [{ loanedAt: "x" }] })).toBeUndefined();
  });

  test("null/undefined payload contributes nothing", () => {
    expect(buildDeepEditHops(NAV_HOPS, MEMBER, undefined)).toBeUndefined();
    expect(buildDeepEditHops(NAV_HOPS, MEMBER, null)).toBeUndefined();
  });

  test("a self-referential structure does not loop forever", () => {
    const cyclical: any = { name: "x" };
    cyclical.loans = [cyclical];
    expect(() => buildDeepEditHops(NAV_HOPS, MEMBER, cyclical)).not.toThrow();
  });
});
