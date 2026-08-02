import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV2, ODataEntityModelResponseV2 } from "@odata2ts/odata-core";
import { describe, expect, expectTypeOf, test } from "vitest";
import { MainBranch } from "../../../src-generated/library-v2/LibraryV2Model.js";
import { BASE_URL, LIBRARY_V2 } from "../LibraryV2TestConstants.js";

/**
 * What the V4 model serves as the singleton `MainBranch`.
 *
 * OData V2 has no singletons - the concept arrived with V4 - so the adapter re-declares it as an ordinary
 * `EntitySet` with a key. odata2ts follows that and generates the usual pair of services: a collection
 * service for `MainBranch()` and an entity service for `MainBranch(id)`.
 *
 * At runtime the server does *not* follow its own metadata: `/MainBranch` answers with a single entity, the
 * way a singleton does, not with a `results` array. So the collection service is typed for a payload this
 * server never sends, while the entity service - which the metadata says is the addressable one - works.
 * That split is the whole point of this file.
 */
describe("CAP Library V2: what was the singleton", () => {
  test("it is an entity set here, so it has a key", () => {
    expect(LIBRARY_V2.MainBranch().getPath()).toBe(`${BASE_URL}/MainBranch`);
    expect(LIBRARY_V2.MainBranch(1).getPath()).toBe(`${BASE_URL}/MainBranch(1)`);
  });

  test("reading it by key works and yields a single entity", async () => {
    const result = await LIBRARY_V2.MainBranch(1).query().execute();

    expect(result.status).toBe(200);
    expect(result.data.d.Name).toBeDefined();
    expect(result.data.d.__metadata.uri).toBe(`${BASE_URL}/MainBranch(1)`);

    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<ODataEntityModelResponseV2<MainBranch>>>();
  });

  test("reading it without a key answers as a singleton, not as a collection", async () => {
    // The metadata promises a collection, the server sends one entity. odata2ts believes the metadata, so
    // `d.results` is typed as an array and is `undefined` at runtime - a caller iterating it gets a
    // TypeError, with nothing in `$metadata` to warn them.
    const result = await LIBRARY_V2.MainBranch().query().execute();

    expect(result.status).toBe(200);
    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<ODataCollectionResponseV2<MainBranch>>>();

    expect(result.data.d.results).toBeUndefined();
    expect((result.data.d as unknown as MainBranch).Name).toBeDefined();
  });

  test("query options work on it", async () => {
    const result = await LIBRARY_V2.MainBranch(1)
      .query((builder) => builder.select("Name"))
      .execute();

    expect(result.data.d.Name).toBeDefined();
    expect(result.data.d.LowestFloor).toBeUndefined();
  });

  test("patch the entity", async () => {
    const original = (await LIBRARY_V2.MainBranch(1).query().execute()).data.d.Name;

    const patched = await LIBRARY_V2.MainBranch(1).patch({ Name: "Main Branch (patched)" }).execute();
    expect(patched.status).toBe(200);

    expect((await LIBRARY_V2.MainBranch(1).query().execute()).data.d.Name).toBe("Main Branch (patched)");

    await LIBRARY_V2.MainBranch(1).patch({ Name: original }).execute();
  });

  test("the address is flattened here as well", async () => {
    // The adapter passes CAP's flat mode straight through: `Address_City`, not `Address/City`. Unlike the
    // other structured elements of this model, which V2 *does* get as real complex types - see
    // feature/DataTypes.test.ts.
    const result = await LIBRARY_V2.MainBranch(1)
      .query((builder) => builder.select("Address_City", "Address_Country"))
      .execute();

    expect(result.status).toBe(200);
    expect(result.data.d.Address_City).toBeDefined();
    expect(result.data.d.Name).toBeUndefined();

    expectTypeOf<MainBranch>().toHaveProperty("Address_City");
    expectTypeOf<MainBranch>().not.toHaveProperty("Address");
  });
});
