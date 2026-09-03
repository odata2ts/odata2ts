import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataModelResponseV4 } from "@odata2ts/odata-core";
import { describe, expect, expectTypeOf, test } from "vitest";
import { MainBranch } from "../../src-generated/library/LibraryModel.js";
import { BASE_URL, LIBRARY } from "../LibraryTestConstants.js";

/**
 * The singleton `MainBranch`.
 *
 * A singleton is addressed by name alone - no key predicate, no collection - and the generated service
 * has to reflect that: it is an entity service, never a collection one.
 *
 * CAP gives the singleton its own entity *type* (`Library.Service.MainBranch`) rather than reusing
 * `Branch`, which is why the generated model here is `MainBranch` and not the branch model. That is a
 * modelling difference of the server, not of odata2ts - see int-test/asp-net for the other shape.
 */
describe("CAP Library: singleton", () => {
  test("addressed by name, without a key predicate", () => {
    expect(LIBRARY.MainBranch().getPath()).toBe(`${BASE_URL}/MainBranch`);
  });

  test("read the singleton", async () => {
    const result = await LIBRARY.MainBranch().query().execute();

    expect(result.status).toBe(200);
    expect(result.data.Name).toBeDefined();

    // a singleton is a single entity, so the response is the model, not a collection
    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<MainBranch>>>();
  });

  test("query options work on it", async () => {
    const result = await LIBRARY.MainBranch()
      .query((builder) => builder.select("Name"))
      .execute();

    expect(result.data.Name).toBeDefined();
    expect(result.data.LowestFloor).toBeUndefined();
  });

  test("patch the singleton", async () => {
    const original = (await LIBRARY.MainBranch().query().execute()).data.Name;

    const patched = await LIBRARY.MainBranch().patch({ Name: "Main Branch (patched)" }).execute();
    expect(patched.status).toBe(200);

    expect((await LIBRARY.MainBranch().query().execute()).data.Name).toBe("Main Branch (patched)");

    await LIBRARY.MainBranch().patch({ Name: original }).execute();
  });

  test("the address is flattened, so there is no complex property to address", async () => {
    // Where ASP.NET has `Address` as a complex property with a service of its own, CAP flattens it into
    // `Address_Street`, `Address_City`, ... - there is no sub-resource, and the generated service
    // correspondingly has no `Address()`. Asserted through `$select`, which is the only way in here.
    const result = await LIBRARY.MainBranch()
      .query((builder) => builder.select("Address_City", "Address_Country"))
      .execute();

    expect(result.status).toBe(200);
    expect(result.data.Address_City).toBeDefined();
    expect(result.data.Name).toBeUndefined();

    // the flat spelling is what the model offers - `Address` does not exist on it at all
    expectTypeOf<MainBranch>().toHaveProperty("Address_City");
    expectTypeOf<MainBranch>().not.toHaveProperty("Address");
  });
});
