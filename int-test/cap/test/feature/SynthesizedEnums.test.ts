import { ODataModelResponseV4 } from "@odata2ts/odata-core";
import { ODataResponseModel } from "@odata2ts/odata-service";
import { afterAll, describe, expect, expectTypeOf, test } from "vitest";
import { Amenities, Copies, Status } from "../../src-generated/library-enums/LibraryEnumsModel.js";
import { LibraryEnumsService } from "../../src-generated/library-enums/LibraryEnumsService.js";
import { BASE_URL, BOOK_DER_PROZESS, LIBRARY, ODATA_CLIENT } from "../LibraryTestConstants.js";

/**
 * `enumSynthesized` against the server it exists for, with the one strategy there is:
 * `allowedValuesAndSymbolicName`.
 *
 * A CDS enum is a constraint on a value rather than a type of its own, so CAP emits no `<EnumType>`:
 * `Copies/Status` is a plain `Edm.Byte` carrying a `Validation.AllowedValues` annotation whose records
 * hold the symbolic names. Naming the strategy turns that into an enum - which only a running server can settle,
 * since the number behind a member is what has to travel in either direction while the models read as the
 * enum.
 *
 * `LIBRARY` (the raw client generated from the very same metadata) is used for contrast throughout: it
 * shows the bare number the server really transmits.
 */
const ENUMS = new LibraryEnumsService(ODATA_CLIENT, BASE_URL);

/** A copy seeded with `Status = 0`, i.e. `Available`. */
const COPY = { MediumId: BOOK_DER_PROZESS, InventoryNumber: 1001 };
/** The second seeded copy, `Status = 1`. */
const COPY_ON_LOAN = { MediumId: BOOK_DER_PROZESS, InventoryNumber: 1002 };
/** A branch seeded with `Amenities = 2`, i.e. `Parking` - and the one written to below. */
const BRANCH_PARKING = 3;

describe("CAP Library: synthesized enums", () => {
  // the seed data is the contract other files assert against, so anything written here is put back
  afterAll(async () => {
    await LIBRARY.Branches(BRANCH_PARKING).patch({ Amenities: 2 }).execute();
  });

  describe("response body", () => {
    test("the number arrives as a member of the enum", async () => {
      const result = await ENUMS.Copies(COPY).query().execute();

      expect(result.status).toBe(200);
      expect(result.data.Status).toBe(Status.Available);
      expectTypeOf(result).toEqualTypeOf<ODataResponseModel<ODataModelResponseV4<Copies>>>();
      expectTypeOf(result.data.Status).toEqualTypeOf<Status | null>();
    });

    test("the very same response is a number without the option", async () => {
      const raw = await LIBRARY.Copies(COPY).query().execute();

      expect(raw.data.Status).toBe(0);
      expectTypeOf(raw.data.Status).toEqualTypeOf<number | null>();
    });

    test("collections carry it too", async () => {
      const result = await ENUMS.Copies()
        .query((builder, qCopy) => {
          builder.filter(qCopy.MediumId.eq(COPY.MediumId));
        })
        .execute();

      const onLoan = result.data.value.find((copy) => copy.InventoryNumber === COPY_ON_LOAN.InventoryNumber);
      expect(onLoan?.Status).toBe(Status.OnLoan);
    });
  });

  describe("request", () => {
    test("$filter carries the value, not the name", async () => {
      const request = ENUMS.Copies().query((builder, qCopy) => {
        builder.filter(qCopy.Status.eq(Status.OnLoan));
      });

      // the property is an `Edm.Byte` as far as the server is concerned, so a quoted name would be a 400
      expect(decodeURIComponent(request.getUrl())).toContain("$filter=Status eq 1");

      const result = await request.execute();
      expect(result.status).toBe(200);
      expect(result.data.value.length).toBeGreaterThan(0);
      expect(result.data.value.every((copy) => copy.Status === Status.OnLoan)).toBe(true);
    });

    test("$orderby goes by the property itself", async () => {
      const request = ENUMS.Copies().query((builder, qCopy) => {
        builder.orderBy(qCopy.Status.desc()).top(1);
      });

      expect(decodeURIComponent(request.getUrl())).toContain("$orderby=Status desc");
      expect((await request.execute()).status).toBe(200);
    });

    test("a member is written back as its value", async () => {
      /*
       * Written against a branch rather than a copy: `Copies` carries `@odata.etag`, so every write
       * against one needs `If-Match`, which odata2ts sends in neither version - see
       * test/v2/core/CrudOperations.test.ts.
       */
      const updated = await ENUMS.Branches(BRANCH_PARKING).patch({ Amenities: Amenities.StudyRoom }).execute();
      expect(updated.status).toBe(200);

      // the raw client is the witness that a number reached the database, not a name
      const raw = await LIBRARY.Branches(BRANCH_PARKING).query().execute();
      expect(raw.data.Amenities).toBe(16);
    });
  });

  describe("the bit mask the annotation cannot express", () => {
    /*
     * `Branches/Amenities` lists `1, 2, 4, 8, 16` and the combination `31` - it is a flags enum, which
     * `AllowedValues` has no way of saying. The generated enum therefore covers exactly the values the
     * annotation lists and nothing else - and unlike a declared flags enum there is no `IsFlags` to state
     * otherwise, so the synthesized enum does not even offer `has`.
     */
    test("a listed combination is a member like any other", async () => {
      const result = await ENUMS.Branches(1).query().execute();

      expect(result.data.Amenities).toBe(Amenities.FullService);
      // 31 happens to be listed, so it converts - it is still a combination of the five flags below
      expect((await LIBRARY.Branches(1).query().execute()).data.Amenities).toBe(31);
    });

    test("an unlisted combination has no member to convert to", async () => {
      // branch 2 is seeded with 11, i.e. WheelchairAccessible | Parking | KidsArea - a value the server
      // accepts and the annotation never mentions
      expect((await LIBRARY.Branches(2).query().execute()).data.Amenities).toBe(11);

      const result = await ENUMS.Branches(2).query().execute();
      expect(result.data.Amenities).toBeUndefined();
    });
  });
});
