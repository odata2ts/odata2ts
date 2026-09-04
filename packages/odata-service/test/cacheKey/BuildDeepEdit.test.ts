import { QBinding, QEntityCollectionPath, QEntityPath, QId, QueryObject } from "@odata2ts/odata-query-objects";
import { describe, expect, test } from "vitest";
import { buildDeepEditHops, QEntityFn } from "../../src/cacheKey";

/** A binding whose only use here is `getEntitySetName()` - a real `QId` is more machinery than this needs. */
function bindingTo(entitySetName: string): QBinding<any> {
  return new QBinding(() => ({ getName: () => entitySetName }) as unknown as QId<any>, "4.0");
}

class QCopy extends QueryObject {}
class QReservation extends QueryObject {}
class QIdDocument extends QueryObject {}

class QLoan extends QueryObject {
  public readonly Copy = new QEntityPath(this.withPrefix("Copy"), () => QCopy, bindingTo("Copies"));
}

class QMember extends QueryObject {
  public readonly Loans = new QEntityCollectionPath(this.withPrefix("Loans"), () => QLoan, bindingTo("Loans"));
  public readonly Reservations = new QEntityCollectionPath(
    this.withPrefix("Reservations"),
    () => QReservation,
    bindingTo("Reservations"),
  );
  public readonly IdDocument = new QEntityPath(
    this.withPrefix("IdDocument"),
    () => QIdDocument,
    bindingTo("IdDocuments"),
  );
}

/** A nav property with no `QBinding` at all - the shape a contained navigation property's Q-object gets. */
class QChapter extends QueryObject {}
class QMediumContainedOnly extends QueryObject {
  public readonly Chapters = new QEntityCollectionPath(this.withPrefix("Chapters"), () => QChapter);
}

/** A naming strategy has renamed the TS-facing field away from the OData wire name entirely. */
class QTrip extends QueryObject {}
class QPersonWithMappedName extends QueryObject {
  public readonly friends = new QEntityCollectionPath(this.withPrefix("Friends"), () => QTrip, bindingTo("Trips"));
}

const qMember: QEntityFn = () => QMember as any;
const qMediumContainedOnly: QEntityFn = () => QMediumContainedOnly as any;
const qPersonWithMappedName: QEntityFn = () => QPersonWithMappedName as any;

describe("buildDeepEditHops", () => {
  test("no Q-object factory at all (e.g. an operation root): undefined", () => {
    expect(buildDeepEditHops(undefined, { Name: "x" })).toBeUndefined();
  });

  test("no nav properties in the payload: undefined", () => {
    expect(buildDeepEditHops(qMember, { Name: "x" })).toBeUndefined();
  });

  test("a plain deep insert contributes its entity set's name", () => {
    const data = { Name: "x", Loans: [{ LoanedAt: "2026-01-01" }] };
    expect(buildDeepEditHops(qMember, data)).toEqual(["Loans"]);
  });

  test('a binding ({"@id": key}) is not a deep insert and contributes nothing', () => {
    const data = { Name: "x", Loans: [{ "@id": 5 }] };
    expect(buildDeepEditHops(qMember, data)).toBeUndefined();
  });

  test("a mix of a binding and a real deep insert in the same to-many array: only the real one counts", () => {
    const data = { Loans: [{ "@id": 5 }, { LoanedAt: "2026-01-01" }] };
    expect(buildDeepEditHops(qMember, data)).toEqual(["Loans"]);
  });

  test("recurses into a nested deep insert, following the nav property's own Q-object factory", () => {
    const data = { Loans: [{ LoanedAt: "2026-01-01", Copy: { Condition: 3 } }] };
    expect(buildDeepEditHops(qMember, data)).toEqual(["Loans", "Copies"]);
  });

  test("a to-one deep insert (single object, not an array) is found too", () => {
    const data = { IdDocument: { Number: "x" } };
    expect(buildDeepEditHops(qMember, data)).toEqual(["IdDocuments"]);
  });

  test("the payload is indexed by the property's own declared field name, not its OData wire name - a naming strategy may have mapped the two apart", () => {
    // the field is declared "friends" but its wire name (withPrefix) is "Friends" - the payload, being
    // the TS-facing editable model, only ever has "friends"
    const data = { friends: [{ Name: "x" }] };
    expect(buildDeepEditHops(qPersonWithMappedName, data)).toEqual(["Trips"]);
  });

  test("a contained navigation property (no QBinding) is walked for further deep inserts but contributes no entity-set entry of its own", () => {
    const data = { Chapters: [{ Title: "x" }] };
    expect(buildDeepEditHops(qMediumContainedOnly, data)).toBeUndefined();
  });

  test("multiple deep-inserted nav properties each contribute their own entry", () => {
    const data = { Loans: [{ LoanedAt: "x" }], Reservations: [{ ReservedAt: "y" }] };
    expect(buildDeepEditHops(qMember, data)).toEqual(["Loans", "Reservations"]);
  });

  test("null/undefined payload contributes nothing", () => {
    expect(buildDeepEditHops(qMember, undefined)).toBeUndefined();
    expect(buildDeepEditHops(qMember, null)).toBeUndefined();
  });

  test("a self-referential structure does not loop forever", () => {
    const cyclical: any = { Name: "x" };
    cyclical.Loans = [cyclical];
    expect(() => buildDeepEditHops(qMember, cyclical)).not.toThrow();
  });
});
