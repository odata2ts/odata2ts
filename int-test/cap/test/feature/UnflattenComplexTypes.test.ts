import { ODataModelResponseV4 } from "@odata2ts/odata-core";
import { ODataResponseModel } from "@odata2ts/odata-service";
import { afterAll, describe, expect, expectTypeOf, test } from "vitest";
import { Library_Catalog_PostalAddress, Members } from "../../src-generated/library-shaped/LibraryShapedModel.js";
import { LibraryShapedService } from "../../src-generated/library-shaped/LibraryShapedService.js";
import { BASE_URL, LIBRARY, ODATA_CLIENT } from "../LibraryTestConstants.js";

/**
 * `unflattenComplexTypes` against the server it exists for.
 *
 * CAP states `Member.Address` as four flat properties - `Address_Street`, `Address_City`,
 * `Address_PostalCode`, `Address_Country` - and never as the `<ComplexType>` it declares elsewhere for
 * `PreviousAddresses`. The option puts them back together, so only a real CAP server settles whether the
 * client still speaks the flat form on the wire while the models read as one object.
 *
 * `LIBRARY` (the raw client generated from the very same metadata) is used for contrast throughout: both
 * halves are the point, since the reshaping is only correct if the flat form is what actually travels.
 */
const SHAPED = new LibraryShapedService(ODATA_CLIENT, BASE_URL);

const ANNA = 1;
const ANNA_ADDRESS = { Street: "Lindenweg 4", City: "Hamburg", PostalCode: "22765", Country: "DE" };

describe("CAP Library: unflattenComplexTypes", () => {
  // the seed data is the contract other files assert against, so anything written here is put back
  afterAll(async () => {
    await LIBRARY.Members(ANNA)
      .patch({
        Address_Street: ANNA_ADDRESS.Street,
        Address_City: ANNA_ADDRESS.City,
        Address_PostalCode: ANNA_ADDRESS.PostalCode,
        Address_Country: ANNA_ADDRESS.Country,
      })
      .execute();
  });

  describe("response body", () => {
    test("the four flat properties arrive as one object", async () => {
      const result = await SHAPED.Members(ANNA).query().execute();

      expect(result.status).toBe(200);
      expect(result.data.Address).toStrictEqual(ANNA_ADDRESS);
      // the model states the reshaped property as the complex type, not as four strings
      expectTypeOf(result).toEqualTypeOf<ODataResponseModel<ODataModelResponseV4<Members>>>();
      expectTypeOf(result.data.Address).toEqualTypeOf<Library_Catalog_PostalAddress | null>();
    });

    test("the very same response is flat without the option", async () => {
      const raw = await LIBRARY.Members(ANNA).query().execute();

      expect(raw.data.Address_Street).toBe(ANNA_ADDRESS.Street);
      expect(raw.data.Address_City).toBe(ANNA_ADDRESS.City);
      // @ts-expect-error - the raw client knows no such property, which is the whole point of the option
      expect(raw.data.Address).toBeUndefined();
    });

    test("a complex type the service really declares is untouched", async () => {
      const result = await SHAPED.Members(ANNA).query().execute();

      // `PreviousAddresses` is a genuine Collection(PostalAddress) in the metadata and stays one
      expect(result.data.PreviousAddresses).toStrictEqual([
        { Street: "Alte Gasse 9", City: "Bremen", PostalCode: "28195", Country: "DE" },
      ]);
      expectTypeOf(result.data.PreviousAddresses).toEqualTypeOf<Array<Library_Catalog_PostalAddress>>();
    });

    test("a foreign key which looks flattened stays a property of its own", async () => {
      const result = await SHAPED.Members(ANNA).query().execute();

      // `IdDocument_Id` belongs to the navigation property `IdDocument`, not to a structured element
      expect(result.data.IdDocument_Id).toBe("aaaaaaaa-0000-0000-0000-000000000001");
    });

    test("collections of entities carry it too", async () => {
      const result = await SHAPED.Members().query().execute();

      expect(result.status).toBe(200);
      // asserted on a seeded row rather than on all of them: other suites leave members behind
      expect(result.data.value.find((member) => member.Id === ANNA)?.Address).toStrictEqual(ANNA_ADDRESS);
    });
  });

  describe("queries", () => {
    test("filters on a leaf by the name the service knows", async () => {
      const request = SHAPED.Members().query((builder, qMember) =>
        builder.filter(qMember.Address.props.City.eq("Hamburg")),
      );

      expect(decodeURIComponent(request.getUrl())).toContain("$filter=Address_City eq 'Hamburg'");

      const result = await request.execute();
      expect(result.status).toBe(200);
      expect(result.data.value.length).toBeGreaterThanOrEqual(3);
      expect(result.data.value.every((member) => member.Address?.City === "Hamburg")).toBe(true);
    });

    test("orders by a leaf", async () => {
      // restricted to the seeded rows, since other suites leave members without an address behind
      const request = SHAPED.Members().query((builder, qMember) =>
        builder.filter(qMember.Id.le(3)).orderBy(qMember.Address.props.Street.asc()),
      );

      expect(decodeURIComponent(request.getUrl())).toContain("$orderby=Address_Street asc");

      const result = await request.execute();
      expect(result.status).toBe(200);
      expect(result.data.value.map((m) => m.Address?.Street)).toStrictEqual([
        "Lindenweg 4",
        "Marktplatz 7",
        "Parkallee 88",
      ]);
    });

    test("expanding selects the leaves instead of nesting a clause", async () => {
      const request = SHAPED.Members(ANNA).query((builder) =>
        builder.expanding("Address", (address) => address.select("Street", "City")),
      );

      // a nested `$select=Address($select=City)` would be 400 here - the server knows no such property
      expect(decodeURIComponent(request.getUrl())).toContain("$select=Address_Street,Address_City");

      const result = await request.execute();
      expect(result.status).toBe(200);
      expect(result.data.Address).toStrictEqual({ Street: ANNA_ADDRESS.Street, City: ANNA_ADDRESS.City });
    });

    test("selecting the property as a whole selects every leaf", async () => {
      const request = SHAPED.Members(ANNA).query((builder) => builder.select("Address"));

      expect(decodeURIComponent(request.getUrl())).toContain(
        "$select=Address_Street,Address_City,Address_PostalCode,Address_Country",
      );

      const result = await request.execute();
      expect(result.status).toBe(200);
      expect(result.data.Address).toStrictEqual(ANNA_ADDRESS);
    });

    test("combines with an ordinary select", async () => {
      const request = SHAPED.Members(ANNA).query((builder) =>
        builder.select("Name").expanding("Address", (address) => address.select("City")),
      );

      expect(decodeURIComponent(request.getUrl())).toContain("$select=Name,Address_City");

      const result = await request.execute();
      expect(result.data.Name).toBe("Anna Berger");
      expect(result.data.Address).toStrictEqual({ City: "Hamburg" });
    });
  });

  describe("request body", () => {
    test("an update sends the leaves flat and takes effect", async () => {
      const updated = await SHAPED.Members(ANNA)
        .patch({ Address: { Street: "Neuer Weg 2", City: "Bremen" } })
        .execute();

      expect(updated.status).toBe(200);

      const reread = await SHAPED.Members(ANNA).query().execute();
      expect(reread.data.Address).toStrictEqual({
        Street: "Neuer Weg 2",
        City: "Bremen",
        PostalCode: ANNA_ADDRESS.PostalCode,
        Country: ANNA_ADDRESS.Country,
      });

      // the raw client sees exactly the flat properties that were written
      const raw = await LIBRARY.Members(ANNA).query().execute();
      expect(raw.data.Address_Street).toBe("Neuer Weg 2");
      expect(raw.data.Address_City).toBe("Bremen");
    });

    test("clearing the property nulls every leaf it owns", async () => {
      await SHAPED.Members(ANNA).patch({ Address: null }).execute();

      const raw = await LIBRARY.Members(ANNA).query().execute();
      expect(raw.data.Address_Street).toBeNull();
      expect(raw.data.Address_City).toBeNull();
      expect(raw.data.Address_PostalCode).toBeNull();
      expect(raw.data.Address_Country).toBeNull();
    });
  });
});
