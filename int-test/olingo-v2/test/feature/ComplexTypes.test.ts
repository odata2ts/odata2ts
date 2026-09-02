import { ODataValueResponseV2 } from "@odata2ts/odata-core";
import { ODataResponseModel } from "@odata2ts/odata-service";
import { describe, expect, expectTypeOf, test } from "vitest";
import { PostalAddress } from "../../src-generated/library/LibraryModel.js";
import { expectODataError } from "../expectODataError.js";
import { BASE_URL, COPY_KEY, LIBRARY } from "../LibraryTestConstants.js";

/**
 * Complex-typed properties, and the service odata2ts generates for them.
 *
 * This is the first V2 server in the integration tests with a real complex property: CAP flattens
 * `Address` into `Address_City`, `Address_Street` and so on, so `int-test/cap` had nothing to point a
 * `ComplexTypeServiceV2` at. Here `Member.Address` is a `PostalAddress`, itself derived from an abstract
 * `Address` - complex type inheritance, which V2 allows and V4's own model uses too.
 */
describe("Olingo Library: complex types", () => {
  test("a complex property is addressable as a sub-resource", async () => {
    // `ComplexTypeServiceV2`, generated because the property is complex-typed rather than primitive
    expect(LIBRARY.Members(1).Address().getPath()).toBe(`${BASE_URL}/Members(1)/Address`);

    const result = await LIBRARY.Members(1).Address().query().execute();

    expect(result.status).toBe(200);
    expect(result.data.d).toMatchObject({
      Street: "Lindenweg 4",
      City: "Hamburg",
      PostalCode: "22765",
      Country: "DE",
    });
  });

  test("the complex value names its own type, including the derived one", async () => {
    const result = await LIBRARY.Members(1).Address().query().execute();

    // `PostalAddress` derives from the abstract `Address`, and the payload says so - V2 marks a complex
    // value with its type where V4 leaves it unannotated
    expect((result.data.d as unknown as { __metadata: { type: string } }).__metadata.type).toBe(
      "Library.Catalog.PostalAddress",
    );

    expectTypeOf<PostalAddress>().toHaveProperty("PostalCode"); // its own
    expectTypeOf<PostalAddress>().toHaveProperty("Street"); // from the abstract Address
  });

  test("a property of the complex value is addressable one level further down", async () => {
    const result = await LIBRARY.Members(1).Address().City().getValue().execute();

    expect(result.status).toBe(200);
    expect(result.data.d.City).toBe("Hamburg");
    expectTypeOf(result).toEqualTypeOf<ODataResponseModel<ODataValueResponseV2<string>>>();
  });

  test("the complex value arrives inline without being asked for", async () => {
    // Which is why the two rejections below cost nothing here: there is no need to expand what is
    // already in the payload. A V2 service is free to do it either way.
    const member = (await LIBRARY.Members(1).query().execute()).data.d;

    expect(member.Address).toMatchObject({ City: "Hamburg" });
  });

  test("expanding a complex property is refused by this server", async () => {
    /*
     * odata2ts widened `expand()` to accept complex properties for V2, because V2 does not inline them
     * the way V4 does and some services require the expand. This one does not accept it: `$expand` here
     * takes navigation properties only.
     *
     * So the client can express something the server rejects, and a caller porting a query from another
     * V2 service would hit a 400 with no hint from `$metadata`. Asserted rather than avoided.
     */
    const cmd = LIBRARY.Members(1).query((b) => b.expand("Address"));
    expect(decodeURIComponent(cmd.getUrl())).toContain("$expand=Address");

    await expectODataError(cmd.execute(), {
      status: 400,
      message: /must be a navigation property/,
    });
  });

  test("deep select into a complex property is refused as well", async () => {
    /*
     * `expanding()` renders V2's flattened deep select, `$select=Address/City&$expand=Address`. Same
     * story: valid for some V2 services, not for this one.
     *
     * The request is malformed twice over for this server - the expand names a complex property and the
     * select traverses one - and Olingo reports whichever of the two validations happens to run first.
     * Both spellings are accepted here rather than pinning one, because which arrives is an ordering
     * detail inside the server: the file on its own yields "Invalid segment", the full suite yields the
     * navigation-property message. The refusal is the finding; its wording is not.
     */
    const cmd = LIBRARY.Members(1).query((b) => b.expanding("Address", (address) => address.select("City")));
    const url = decodeURIComponent(cmd.getUrl());
    expect(url).toContain("$select=Address/City");
    expect(url).toContain("$expand=Address");

    await expectODataError(cmd.execute(), {
      status: 400,
      message: /Invalid segment: 'Address\/City'|must be a navigation property/,
    });
  });

  test("deep select through a navigation property does work", async () => {
    // The distinction that matters: it is the complex *property* the server will not traverse, not the
    // deep select itself. Through a navigation property the very same mechanism is fine.
    const cmd = LIBRARY.Copies(COPY_KEY).query((b) => b.expanding("Location", (branch) => branch.select("Name")));
    expect(decodeURIComponent(cmd.getUrl())).toContain("$select=Location/Name");

    const result = await cmd.execute();
    expect(result.status).toBe(200);
    expect((result.data.d.Location as unknown as { Name: string }).Name).toBeDefined();
  });
});
