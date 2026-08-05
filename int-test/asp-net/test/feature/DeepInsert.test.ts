import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataModelResponseV4 } from "@odata2ts/odata-core";
import { describe, expect, expectTypeOf, test } from "vitest";
import { Book } from "../../src-generated/library/library-catalog/index.js";
import { Member } from "../../src-generated/library/library-circulation/index.js";
import { LIBRARY } from "../LibraryTestConstants.js";

/**
 * Deep insert - odata2ts issue #237 - against a server that actually stores the nested entities.
 *
 * The navigation properties show up on the editable models, typed as the
 * editable model of the related entity. That the payload nests is only half the feature: the nested
 * entities have to be *created and linked* on the other side, which is what a fixture cannot show and
 * these tests can.
 *
 * A binding is stated by the key of the entity to bind (`{"@id": key}`) and therefore shares the property
 * with the deep insert; the `"@id"` tells the two apart. Sending both for one entity is what the last
 * test does - for OData 4.0 the query objects split them into two properties again.
 */
describe("ASP.NET Library: deep insert", () => {
  /** The server assigns the keys here, so each test reads back what it created rather than a fixture id. */
  async function copiesOf(mediumId: string) {
    const response = await LIBRARY.Media(mediumId)
      .query((builder) => builder.expanding("Copies", (copy) => copy))
      .execute();
    return response.data.Copies ?? [];
  }

  test("a single-valued navigation property is created along with the entity", async () => {
    const uploadedAt = "2026-08-02T10:00:00Z";

    const created = await LIBRARY.Members()
      .create({
        Name: "Deep Insert Member",
        Balance: 0,
        PreviousAddresses: [],
        // no key: it is generated on the server side and therefore no part of the editable model
        IdDocument: { UploadedAt: uploadedAt },
      })
      .execute();

    expect(created.status).toBe(201);
    expectTypeOf(created).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<Member>>>();

    // the decisive part: the nested entity exists on the other side and is linked to its parent
    const read = await LIBRARY.Members(created.data.Id)
      .query((builder) => builder.expanding("IdDocument", (doc) => doc))
      .execute();

    expect(read.data.IdDocument).toBeDefined();
    expect(read.data.IdDocument?.UploadedAt).toContain("2026-08-02T10:00:00");
  });

  test("a collection-valued navigation property is created along with the entity", async () => {
    const inventoryNumber = 9601;

    const created = await LIBRARY.Media()
      .asBookCollectionService()
      .create({
        Title: "Deep Insert Book",
        Language: "de",
        PageCount: 123,
        AgeRating: 0,
        ISBN: "9780000009601",
        Copies: [
          {
            // The parent key is part of the copy's composite key, so the editable model demands it - but
            // the entity it refers to does not exist yet. The server derives it from the parent and
            // overwrites whatever was sent, which is asserted below.
            MediumId: "00000000-0000-0000-0000-000000000000",
            InventoryNumber: inventoryNumber,
            Condition: 1,
            IsLoanable: true,
            WeightKg: 0.5,
          },
        ],
      })
      .execute();

    expect(created.status).toBe(201);
    expectTypeOf(created).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<Book>>>();

    const copies = await copiesOf(created.data.Id);

    expect(copies).toHaveLength(1);
    expect(copies[0].InventoryNumber).toBe(inventoryNumber);
    // not the zero guid that was sent: the nested entity belongs to the entity it arrived with
    expect(copies[0].MediumId).toBe(created.data.Id);
  });

  test("a deep insert and a binding travel in the same payload", async () => {
    // The two features are independent, and in 4.0 they are separate properties, so one payload can
    // create a new entity for one navigation property and point at an existing one for another.
    const branches = await LIBRARY.Branches()
      .query((builder) => builder.top(1))
      .execute();
    const branchId = branches.data.value[0].Id;

    const created = await LIBRARY.Media()
      .asBookCollectionService()
      .create({
        Title: "Deep Insert With Binding",
        Language: "de",
        PageCount: 42,
        AgeRating: 0,
        ISBN: "9780000009602",
        Copies: [
          {
            MediumId: "00000000-0000-0000-0000-000000000000",
            InventoryNumber: 9602,
            Condition: 1,
            IsLoanable: true,
            WeightKg: 0.5,
            Location: { "@id": branchId },
          },
        ],
      })
      .execute();

    expect(created.status).toBe(201);

    const copies = await copiesOf(created.data.Id);
    const copy = await LIBRARY.Copies({ MediumId: created.data.Id, InventoryNumber: copies[0].InventoryNumber })
      .query((builder) => builder.expanding("Location", (location) => location))
      .execute();

    // the copy was created by the deep insert, its branch was bound to an already existing one
    expect(copy.data.Location?.Id).toBe(branchId);
  });
});
