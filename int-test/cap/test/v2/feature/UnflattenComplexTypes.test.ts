import { afterAll, describe, expect, test } from "vitest";
import { LibraryShapedV2Service } from "../../../src-generated/library-shaped-v2/LibraryShapedV2Service.js";
import { BASE_URL, LIBRARY_V2, ODATA_CLIENT } from "../LibraryV2TestConstants.js";

/**
 * `unflattenComplexTypes` through the V2 adapter.
 *
 * The adapter flattens exactly as the V4 endpoint does - one database, one model - but the client builds
 * different URLs and payloads for it, and `expanding()` means something else in V2: it normally adds an
 * `$expand` next to the `$select`. A flattened complex property must produce neither, only flat selects,
 * which is what makes this worth running next to the V4 suite rather than trusting it.
 */
const SHAPED_V2 = new LibraryShapedV2Service(ODATA_CLIENT, BASE_URL);

const ANNA = 1;
const ANNA_ADDRESS = { Street: "Lindenweg 4", City: "Hamburg", PostalCode: "22765", Country: "DE" };

describe("CAP Library V2: unflattenComplexTypes", () => {
  // the seed data is the contract other files assert against, so anything written here is put back
  afterAll(async () => {
    await LIBRARY_V2.Members(ANNA)
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
      const result = await SHAPED_V2.Members(ANNA).query().execute();

      expect(result.status).toBe(200);
      expect(result.data.d.Address).toStrictEqual(ANNA_ADDRESS);
    });

    test("the very same response is flat without the option", async () => {
      const raw = await LIBRARY_V2.Members(ANNA).query().execute();

      expect(raw.data.d.Address_Street).toBe(ANNA_ADDRESS.Street);
      // @ts-expect-error - the raw client knows no such property, which is the whole point of the option
      expect(raw.data.d.Address).toBeUndefined();
    });

    test("a foreign key which looks flattened stays a property of its own", async () => {
      const result = await SHAPED_V2.Members(ANNA).query().execute();

      expect(result.data.d.IdDocument_Id).toBe("aaaaaaaa-0000-0000-0000-000000000001");
    });
  });

  describe("queries", () => {
    test("filters on a leaf by the name the service knows", async () => {
      const request = SHAPED_V2.Members().query((builder, qMember) =>
        builder.filter(qMember.Address.props.City.eq("Hamburg")),
      );

      expect(decodeURIComponent(request.getUrl())).toContain("$filter=Address_City eq 'Hamburg'");

      const result = await request.execute();
      expect(result.status).toBe(200);
      expect(result.data.d.results.length).toBe(3);
      expect(result.data.d.results.every((member) => member.Address?.City === "Hamburg")).toBe(true);
    });

    test("expanding selects the leaves and expands nothing", async () => {
      const request = SHAPED_V2.Members(ANNA).query((builder) =>
        builder.expanding("Address", (address) => address.select("Street", "City")),
      );

      const url = decodeURIComponent(request.getUrl());
      expect(url).toContain("$select=Address_Street,Address_City");
      // there is no navigation property to expand - the leaves are properties of the member itself
      expect(url).not.toContain("$expand");

      const result = await request.execute();
      expect(result.status).toBe(200);
      expect(result.data.d.Address).toStrictEqual({ Street: ANNA_ADDRESS.Street, City: ANNA_ADDRESS.City });
    });

    test("selecting the property as a whole selects every leaf", async () => {
      const request = SHAPED_V2.Members(ANNA).query((builder) => builder.select("Address"));

      expect(decodeURIComponent(request.getUrl())).toContain(
        "$select=Address_Street,Address_City,Address_PostalCode,Address_Country",
      );

      const result = await request.execute();
      expect(result.status).toBe(200);
      expect(result.data.d.Address).toStrictEqual(ANNA_ADDRESS);
    });
  });

  describe("request body", () => {
    test("an update sends the leaves flat and takes effect", async () => {
      const updated = await SHAPED_V2.Members(ANNA)
        .patch({ Address: { Street: "Neuer Weg 2", City: "Bremen" } })
        .execute();

      // the adapter answers a MERGE with 200 and the updated entity, where a native V2 server sends 204
      expect(updated.status).toBe(200);

      const raw = await LIBRARY_V2.Members(ANNA).query().execute();
      expect(raw.data.d.Address_Street).toBe("Neuer Weg 2");
      expect(raw.data.d.Address_City).toBe("Bremen");
    });
  });
});
