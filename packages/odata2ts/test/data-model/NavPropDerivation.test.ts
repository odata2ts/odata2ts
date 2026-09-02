import { beforeAll, describe, expect, test } from "vitest";
import { DataModel } from "../../src/data-model/DataModel.js";
import { EntityType, ODataVersion } from "../../src/data-model/DataTypeModel.js";
import { digestMetadataFile } from "./helper/DigestFixture.js";

describe("grade resolution against real server metadata", () => {
  let aspNet: DataModel;
  let cap: DataModel;

  beforeAll(async () => {
    aspNet = await digestMetadataFile("int-test/asp-net/resource/library.xml");
    cap = await digestMetadataFile("int-test/cap/resource/library.xml");
  });

  // asp-net models the type hierarchy as a real abstract `Medium` with subtypes, and the constraint sits
  // on `Copy`'s side of the relation. CAP flattens the very same library model into concrete types with
  // no shared ancestor, and - unlike every other relation in this file - declares neither a `Partner` nor
  // a `ReferentialConstraint` anywhere near `Copies`. Same logical relationship, same "Copies" name, but
  // the grade genuinely differs because what the two servers state in their metadata differs.
  test("grade A to-many: asp-net's inverse carries the constraint", async () => {
    const derivation = aspNet.getNavPropDerivation("Library.Catalog.Medium", "Copies");
    expect(derivation.grade).toBe("A");
    expect(derivation.filterPairs).toEqual([{ filterPath: "MediumId", parentKeyProperty: "Id" }]);
  });

  test("the same relation is not derivable at all against CAP's metadata", async () => {
    // Library.Service.Books/Copies has no Partner and Library.Service.Copies has no navigation property
    // back to any medium type - CAP simply never states this association from either side.
    const derivation = cap.getNavPropDerivation("Library.Service.Books", "Copies");
    expect(derivation.grade).toBe("C");
  });

  describe("further asp-net cases", () => {
    test("grade A to-one: the target's key is fully known", () => {
      const derivation = aspNet.getNavPropDerivation("Library.Circulation.Copy", "Medium");
      expect(derivation.grade).toBe("A");
      expect(derivation.rootType).toBe("Library.Catalog.Medium");
      expect(derivation.targetKeyPairs).toEqual([{ targetKeyProperty: "Id", sourceKeyProperty: "MediumId" }]);
    });

    test("grade B: Partner only, the filter goes through the navigation path", () => {
      const derivation = aspNet.getNavPropDerivation("Library.Circulation.Member", "Loans");
      expect(derivation.grade).toBe("B");
      expect(derivation.filterPairs).toEqual([{ filterPath: "Member/Id", parentKeyProperty: "Id" }]);
    });

    test("grade C: neither Partner nor constraint", () => {
      expect(aspNet.getNavPropDerivation("Library.Circulation.Member", "Reservations").grade).toBe("C");
    });

    test("a contained navigation is never derivable", () => {
      expect(aspNet.getNavPropDerivation("Library.Catalog.Audiobook", "Chapters").grade).toBe("C");
    });

    test("a to-one with no usable constraint stays grade C, not B", () => {
      // an any() lambda would key a single entity as a filtered collection
      expect(aspNet.getNavPropDerivation("Library.Circulation.Loan", "Copy").grade).toBe("C");
    });

    test("the cast case: the binding targets Media, the property is Collection(Book)", () => {
      const derivation = aspNet.getNavPropDerivation("PublisherRegistry.Publisher", "Books");
      expect(derivation.grade).toBe("B");
      expect(derivation.rootType).toBe("Library.Catalog.Medium");
      expect(derivation.cast).toBe("Library.Catalog.Book");
      expect(derivation.filterPairs).toEqual([{ filterPath: "Publisher/Id", parentKeyProperty: "Id" }]);
    });
  });

  describe("further cap cases", () => {
    test("CAP declares more than the reference model asks: Reservations is grade A", () => {
      const derivation = cap.getNavPropDerivation("Library.Service.Members", "Reservations");
      expect(derivation.grade).toBe("A");
      expect(derivation.filterPairs).toEqual([{ filterPath: "Member_Id", parentKeyProperty: "Id" }]);
    });

    // Library.Service.Loans declares a two-property ReferentialConstraint for Copy (Copy_MediumId /
    // Copy_InventoryNumber, mirroring Copies' composite key), which looks at first glance like the
    // textbook composite-foreign-key case. But Loans' own key is a single surrogate `Id` - neither
    // Copy_MediumId nor Copy_InventoryNumber is part of it - so the constraint is not usable: navigating
    // to `/Loans(id)/Copy` never tells the client what those two values are, only `id` does. This is
    // exactly rule 4's "otherwise the value is not known client-side" clause, not a shallow-test trap for
    // rule 4's "one pair per property" branch - see the synthetic test below for that.
    test("a composite foreign key that isn't part of the source's own key stays grade C", () => {
      expect(cap.getNavPropDerivation("Library.Service.Loans", "Copy").grade).toBe("C");
    });
  });
});

// Neither committed fixture happens to declare a to-one relation where a *multi*-property referential
// constraint is fully covered by the source's own composite key (asp-net's only composite-key case,
// Copy/Medium, has a single-property constraint; CAP's only multi-property constraint, Loans/Copy, fails
// the source-key check above). Built directly against the DataModel API - the same way DataModel.test.ts
// does - to cover rule 4's "one pair per property" branch on a case that actually satisfies rule 4.
describe("grade A to-one with a genuinely usable composite foreign key", () => {
  const NS = "StockTest";
  const withNs = (name: string) => `${NS}.${name}`;

  let dataModel: DataModel;

  beforeAll(() => {
    dataModel = new DataModel([[NS]], ODataVersion.V4);

    dataModel.addEntityType(
      NS,
      "Copy",
      // Cast rather than `@ts-expect-error`: `props` holds several differently-shaped objects, and TS
      // attributes a structural mismatch to each array element separately, not to the fixture as a whole -
      // only the fields the resolver actually reads are worth spelling out here.
      {
        fqName: withNs("Copy"),
        baseClasses: [],
        keyNames: ["MediumId", "InventoryNumber"],
        baseProps: [],
        props: [
          { odataName: "MediumId" },
          { odataName: "InventoryNumber" },
          {
            odataName: "Medium",
            fqType: withNs("Medium"),
            isCollection: false,
            referentialConstraints: [
              { property: "MediumId", referencedProperty: "Id" },
              { property: "InventoryNumber", referencedProperty: "SlotNumber" },
            ],
          },
        ],
      } as unknown as EntityType,
    );
    dataModel.addEntityType(NS, "Medium", {
      fqName: withNs("Medium"),
      baseClasses: [],
      keyNames: ["Id", "SlotNumber"],
      baseProps: [],
      props: [],
    } as unknown as EntityType);

    dataModel.addEntitySet(
      withNs("Copies"),
      // @ts-expect-error - see above
      { entityType: dataModel.getEntityType(withNs("Copy")), navPropBinding: [{ path: "Medium", target: "Media" }] },
    );
    dataModel.addEntitySet(
      withNs("Media"),
      // @ts-expect-error - see above
      { odataName: "Media", entityType: dataModel.getEntityType(withNs("Medium")) },
    );
  });

  test("yields one targetKeyPair per property of the composite constraint", () => {
    const derivation = dataModel.getNavPropDerivation(withNs("Copy"), "Medium");
    expect(derivation.grade).toBe("A");
    expect(derivation.targetKeyPairs).toEqual([
      { targetKeyProperty: "Id", sourceKeyProperty: "MediumId" },
      { targetKeyProperty: "SlotNumber", sourceKeyProperty: "InventoryNumber" },
    ]);
  });
});
