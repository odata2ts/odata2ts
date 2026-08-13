import { afterAll, describe, expect, test } from "vitest";
import { Amenities, Status } from "../../../src-generated/library-enums-v2/LibraryEnumsV2Model.js";
import { LibraryEnumsV2Service } from "../../../src-generated/library-enums-v2/LibraryEnumsV2Service.js";
import { BASE_URL, BOOK_DER_PROZESS, LIBRARY_V2, ODATA_CLIENT } from "../LibraryV2TestConstants.js";

/**
 * `enumSynthesized` through the V2 adapter.
 *
 * The annotation reaches the V2 rendition untouched - the adapter passes the `<Annotations>` blocks
 * through - so the very same enums are derived. What differs is everything around them: the client builds
 * a different URL, and the payload arrives wrapped. Only that makes this worth running next to the V4
 * suite rather than trusting it, since the value has to survive both.
 */
const ENUMS_V2 = new LibraryEnumsV2Service(ODATA_CLIENT, BASE_URL);

/** A copy seeded with `Status = 0`, i.e. `Available`. */
const COPY = { MediumId: BOOK_DER_PROZESS, InventoryNumber: 1001 };
/** A branch seeded with `Amenities = 2`, i.e. `Parking` - and the one written to below. */
const BRANCH_PARKING = 3;

describe("CAP Library V2: synthesized enums", () => {
  // the seed data is the contract other files assert against, so anything written here is put back
  afterAll(async () => {
    await LIBRARY_V2.Branches(BRANCH_PARKING).patch({ Amenities: 2 }).execute();
  });

  describe("response body", () => {
    test("the number arrives as a member of the enum", async () => {
      const result = await ENUMS_V2.Copies(COPY).query().execute();

      expect(result.status).toBe(200);
      expect(result.data.d.Status).toBe(Status.Available);
    });

    test("the very same response is a number without the option", async () => {
      const raw = await LIBRARY_V2.Copies(COPY).query().execute();

      expect(raw.data.d.Status).toBe(0);
    });

    test("collections carry it too", async () => {
      const result = await ENUMS_V2.Copies()
        .query((builder, qCopy) => {
          builder.filter(qCopy.MediumId.eq(COPY.MediumId));
        })
        .execute();

      const onLoan = result.data.d.results.find((copy) => copy.InventoryNumber === 1002);
      expect(onLoan?.Status).toBe(Status.OnLoan);
    });
  });

  describe("request", () => {
    test("$filter carries the value, not the name", async () => {
      const request = ENUMS_V2.Copies().query((builder, qCopy) => {
        builder.filter(qCopy.Status.eq(Status.OnLoan));
      });

      expect(decodeURIComponent(request.getUrl())).toContain("$filter=Status eq 1");

      const result = await request.execute();
      expect(result.status).toBe(200);
      expect(result.data.d.results.every((copy) => copy.Status === Status.OnLoan)).toBe(true);
    });

    test("a member is written back as its value", async () => {
      /*
       * Written against a branch rather than a copy: `Copy.Condition` carries `@odata.etag`, so every
       * write against one needs `If-Match` - see test/v2/core/CrudOperations.test.ts.
       */
      const updated = await ENUMS_V2.Branches(BRANCH_PARKING).patch({ Amenities: Amenities.StudyRoom }).execute();
      expect(updated.status).toBe(200);

      const raw = await LIBRARY_V2.Branches(BRANCH_PARKING).query().execute();
      expect(raw.data.d.Amenities).toBe(16);
    });
  });

  test("an unlisted combination of flags has no member to convert to", async () => {
    // branch 2 is seeded with 11, which `Branches/Amenities` never lists - the bit mask the annotation
    // cannot express, exactly as over V4
    expect((await LIBRARY_V2.Branches(2).query().execute()).data.d.Amenities).toBe(11);
    expect((await ENUMS_V2.Branches(2).query().execute()).data.d.Amenities).toBeUndefined();
  });
});
