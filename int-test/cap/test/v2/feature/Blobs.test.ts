import { describe, expect, expectTypeOf, test } from "vitest";
import { Audiobooks, EBooks } from "../../../src-generated/library-v2/LibraryV2Model.js";
import { AUDIOBOOK, BASE_URL, EBOOK, LIBRARY_V2 } from "../LibraryV2TestConstants.js";

/**
 * Binary content - odata2ts issue #149 - over V2, and the one feature where the two versions of the *client*
 * differ rather than the two versions of the server.
 *
 * The server side is the better of the two here. V2 has no `Edm.Stream`, so the adapter re-expresses both
 * carriers of binary content as what V2 does have: **media link entries**. `Audiobooks`, `AudiobookChapters`
 * and `EBooks` come out as `m:HasStream="true"`, their content sits at `.../$value`, and every entity
 * advertises it through `__metadata.media_src`. That is closer to the reference model, which declares
 * `EBook` a media entity, than the V4 metadata of the same service, where CAP emits plain `Edm.Stream`
 * properties and no `HasStream` at all.
 *
 * odata2ts cannot use any of it: `getBlob`/`updateBlob`/`getStream` and the media-entity service exist only
 * in `@odata2ts/odata-service`'s v4 folder, and the V2 generator emits neither a stream service nor a media
 * one. So this file asserts the gap from both sides - what the client does not offer, and what the server
 * would have answered - rather than leaving the feature silently untested.
 *
 * The raw `fetch` calls below are deliberate and the only ones in this package: there is no generated client
 * API to call instead, and that is precisely the finding.
 */
describe("CAP Library V2: binary content", () => {
  const V4_BASE_URL = BASE_URL.replace("/v2/", "/v4/");

  test("the stream property is gone from the model - the entity itself carries the content", () => {
    // What is `content: Edm.Stream` in the V4 model has no property here at all. A caller migrating a V4
    // client to V2 loses the property rather than getting a differently typed one.
    expectTypeOf<EBooks>().not.toHaveProperty("content");
    expectTypeOf<Audiobooks>().not.toHaveProperty("Sample");
  });

  test("the generated service offers no way to read or write that content", () => {
    // The V4 client has `EBooks(id).content().getBlob()` and `Audiobooks(id).Sample().updateStream(...)`.
    // Neither the property services nor a media-entity shortcut are generated for V2.
    const ebook = LIBRARY_V2.EBooks(EBOOK) as unknown as Record<string, unknown>;

    expect(ebook.content).toBeUndefined();
    expect(ebook.getBlob).toBeUndefined();
    expect(ebook.updateBlob).toBeUndefined();
    expect(ebook.getStream).toBeUndefined();
    expect((LIBRARY_V2.Audiobooks(AUDIOBOOK) as unknown as Record<string, unknown>).Sample).toBeUndefined();
  });

  test("the server does serve it, as a media link entry", async () => {
    // Uploaded over V4, because that is the only version odata2ts can write it with. Read over V2, to show
    // what the client would find there.
    const content = "PK pretend-this-is-epub";
    const uploaded = await fetch(`${V4_BASE_URL}/EBooks(${EBOOK})/content`, {
      method: "PUT",
      headers: { "Content-Type": "application/epub+zip" },
      body: content,
    });
    expect(uploaded.status).toBe(204);

    const entity = await fetch(`${BASE_URL}/EBooks(guid'${EBOOK}')`).then((r) => r.json());
    expect(entity.d.__metadata.media_src).toBe(`${BASE_URL}/EBooks(guid'${EBOOK}')/$value`);
    expect(entity.d.__metadata.content_type).toBe("application/epub+zip");

    const value = await fetch(entity.d.__metadata.media_src);
    expect(value.status).toBe(200);
    expect(value.headers.get("content-type")).toBe("application/epub+zip");
    expect(await value.text()).toBe(content);
  });

  test("what the V4 model calls a named stream property is the entity's content here", async () => {
    // Over V4 this is `.../Audiobooks(<id>)/Sample`. In V2 the whole entity is the stream, so the address
    // is `$value` - which also means an entity can carry exactly one binary payload, and a model with two
    // named streams on one entity could not be expressed at all.
    const content = "ID3 pretend-this-is-mp3";
    await fetch(`${V4_BASE_URL}/Audiobooks(${AUDIOBOOK})/Sample`, {
      method: "PUT",
      headers: { "Content-Type": "audio/mpeg" },
      body: content,
    });

    const value = await fetch(`${BASE_URL}/Audiobooks(guid'${AUDIOBOOK}')/$value`);
    expect(value.status).toBe(200);
    expect(await value.text()).toBe(content);

    // The old address still answers, since the adapter forwards anything it does not translate to the V4
    // endpoint. That does not help a generated client: `Sample` is not in the V2 `$metadata`, so odata2ts
    // has nothing to generate a service from - the working URL is unreachable by construction.
    const byPropertyName = await fetch(`${BASE_URL}/Audiobooks(guid'${AUDIOBOOK}')/Sample`);
    expect(byPropertyName.status).toBe(200);
    expect(await byPropertyName.text()).toBe(content);
  });
});
