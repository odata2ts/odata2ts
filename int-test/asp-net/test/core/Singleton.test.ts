import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataModelResponseV4 } from "@odata2ts/odata-core";
import { describe, expect, expectTypeOf, test } from "vitest";
import { Branch, PostalAddress } from "../../src-generated/library/LibraryModel.js";
import { expectODataError } from "../expectODataError.js";
import { BASE_URL, LIBRARY } from "../LibraryTestConstants.js";

/**
 * The singleton `MainBranch`.
 *
 * A singleton is addressed by name alone - no key predicate, no collection - and the generated service
 * has to reflect that: it is an entity service, never a collection one. Reading and writing go through
 * the same URL, which is what makes it easy to get wrong in generation.
 */
describe("ASP.NET Library: singleton", () => {
  test("addressed by name, without a key predicate", () => {
    expect(LIBRARY.MainBranch().getPath()).toBe(`${BASE_URL}/MainBranch`);
  });

  test("read the singleton", async () => {
    const result = await LIBRARY.MainBranch().query().execute();

    expect(result.status).toBe(200);
    expect(result.data.Name).toBeDefined();

    // a singleton is a single entity, so the response is the model, not a collection
    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<Branch>>>();
    expectTypeOf(result.data.Id).toEqualTypeOf<number>();
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
    expect(patched.status).toBe(204);
    expectTypeOf(patched).toEqualTypeOf<HttpResponseModel<undefined>>();

    expect((await LIBRARY.MainBranch().query().execute()).data.Name).toBe("Main Branch (patched)");

    await LIBRARY.MainBranch().patch({ Name: original }).execute();
  });

  test("the complex property of the singleton is addressed correctly, but not served", async () => {
    // A singleton is an entity like any other, so a complex property hangs off it the same way - and the
    // URL odata2ts builds keeps the singleton's name where an entity would carry its key predicate.
    const address = LIBRARY.MainBranch().Address();

    expect(address.getPath()).toBe(`${BASE_URL}/MainBranch/Address`);
    // the method, not a call: `expectTypeOf` evaluates its argument, and a stray request would reject
    // into nowhere
    expectTypeOf(address.query().execute).returns.resolves.toEqualTypeOf<
      HttpResponseModel<ODataModelResponseV4<PostalAddress>>
    >();

    // The server does not serve a complex property as a resource of its own, on a singleton or anywhere
    // else (`/Branches(1)/Address` answers 404 just the same). Asserted rather than dropped, so the
    // limitation stays visible - and CAP behaves identically, see int-test/cap.
    await expectODataError(address.query().execute(), { status: 404, message: /No error message/ });
  });
});
