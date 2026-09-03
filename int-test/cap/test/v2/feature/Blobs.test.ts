import { HttpResponseModel } from "@odata2ts/http-client-api";
import { describe, expect, expectTypeOf, test } from "vitest";
import { expectODataError } from "../../expectODataError.js";
import { LIBRARY, AUDIOBOOK as V4_AUDIOBOOK, EBOOK as V4_EBOOK } from "../../LibraryTestConstants.js";
import { AUDIOBOOK, BASE_URL, EBOOK, LIBRARY_V2, UNKNOWN_ID } from "../LibraryV2TestConstants.js";

/**
 * Binary content - odata2ts issue #149 - over V2, where the same server tells the same story differently.
 *
 * V2 has no `Edm.Stream`, so the adapter re-expresses both of the V4 model's stream properties as what V2
 * does have: **media link entries**. `EBooks`, `Audiobooks` and `AudiobookChapters` come out as
 * `m:HasStream="true"`, their content sits at `.../$value`, and the property it used to be is gone from the
 * model. Which means a single entity can carry exactly one binary payload here - a V4 model with two named
 * streams on one entity could not be expressed at all.
 *
 * `EBooks(id).content()` therefore exists in both clients and means two different things: the stream
 * property's service over V4, the media link entry's content over V2. That they end up at the same bytes is
 * asserted below and is the point of testing this against one server that speaks both.
 */
describe("CAP Library V2: binary content", () => {
  /** Reading a blob back as text keeps the assertions legible - the payloads here are text on purpose. */
  async function textOf(blob: Blob | undefined) {
    return blob === undefined ? undefined : blob.text();
  }

  /** Same for a stream, which has to be consumed before anything can be asserted about it. */
  async function textOfStream(stream: ReadableStream | undefined) {
    return stream === undefined ? undefined : new Response(stream).text();
  }

  describe("media link entry", () => {
    const ebook = () => LIBRARY_V2.EBooks(EBOOK);

    test("the URL is the entity's own plus $value", () => {
      expect(ebook().content().getPath()).toBe(`${BASE_URL}/EBooks(guid'${EBOOK}')/$value`);
    });

    test("that URL is the one the entity itself advertises", async () => {
      // V2's own way of pointing at the content - the client builds `$value` without having read the
      // entity, so the two have to be checked against each other
      const entity = await ebook().query().execute();
      const metadata = entity.data.d.__metadata as unknown as Record<string, string>;

      expect(metadata.media_src).toBe(ebook().content().getPath());
    });

    test("upload and download round trip", async () => {
      const content = "PK pretend-this-is-epub";

      const updated = await ebook()
        .updateBlob(new Blob([content], { type: "application/epub+zip" }))
        .execute();
      expect(updated.status).toBe(204);

      const read = await ebook().getBlob().execute();

      expect(read.status).toBe(200);
      expect(await textOf(read.data)).toBe(content);
      expect(read.data?.type).toBe("application/epub+zip");
      expectTypeOf(read).toEqualTypeOf<HttpResponseModel<Blob | undefined>>();
    });

    test("deleting the content leaves the entity in place", async () => {
      await ebook()
        .updateBlob(new Blob(["to be removed"], { type: "application/epub+zip" }))
        .execute();

      const deleted = await ebook().deleteBlob().execute();
      expect(deleted.status).toBe(204);

      // 204 and no blob, *not* 404: the entity exists, it just has no content - which is the distinction
      // a client needs to decide whether to upload
      const read = await ebook().getBlob().execute();
      expect(read.status).toBe(204);
      expect(read.data).toBeUndefined();

      const entity = await ebook().query().execute();
      expect(entity.data.d.Title).toBe("Clean Code");
    });

    test("the entity's own properties are untouched by the content", async () => {
      // A media link entry keeps ordinary properties, read and written as JSON. If the `$value` path
      // leaked into the regular requests, this would address the bytes instead of the entity.
      const patched = await ebook().patch({ Language: "en" }).execute();
      expect(patched.status).toBe(200);

      const entity = await ebook().query().execute();
      expect(entity.data.d.Language).toBe("en");
      expect(entity.data.d.FileFormat).toBe("EPUB");
    });

    test("an unknown entity has no content either", async () => {
      // 404 rather than the 204 of an entity without content. Since http-client-fetch 0.12 the error
      // document of a binary request is decoded rather than handed on as an unread blob, so the server's
      // own message arrives instead of the client's fallback.
      await expectODataError(LIBRARY_V2.EBooks(UNKNOWN_ID).getBlob().execute(), {
        status: 404,
        message: /Not Found/i,
      });
    });
  });

  test("what the V4 model calls a named stream property is the entity's content here", async () => {
    // Over V4 this is `.../Audiobooks(<id>)/Sample`, a property among others. In V2 the whole entity is
    // the media link entry, so the address is `$value` and the property does not exist.
    const content = "ID3 pretend-this-is-mp3";
    const audiobook = () => LIBRARY_V2.Audiobooks(AUDIOBOOK);

    expect(audiobook().content().getPath()).toBe(`${BASE_URL}/Audiobooks(guid'${AUDIOBOOK}')/$value`);

    await audiobook()
      .updateBlob(new Blob([content], { type: "audio/mpeg" }))
      .execute();
    const read = await audiobook().getBlob().execute();

    expect(read.status).toBe(200);
    expect(await textOf(read.data)).toBe(content);
  });

  describe("the two versions address the same bytes", () => {
    // The one thing only this server can show: the same rows, once as a stream property and once as a
    // media link entry. If odata2ts built either URL wrongly, the two clients would not meet.
    test("written over V2, read over V4", async () => {
      const content = "PK written-over-v2";

      await LIBRARY_V2.EBooks(EBOOK)
        .updateBlob(new Blob([content], { type: "application/epub+zip" }))
        .execute();

      const read = await LIBRARY.EBooks(V4_EBOOK).content().getBlob().execute();
      expect(await textOf(read.data)).toBe(content);
    });

    test("written over V4, read over V2", async () => {
      const content = "ID3 written-over-v4";

      await LIBRARY.Audiobooks(V4_AUDIOBOOK)
        .Sample()
        .updateBlob(new Blob([content], { type: "audio/mpeg" }))
        .execute();

      const read = await LIBRARY_V2.Audiobooks(AUDIOBOOK).getBlob().execute();
      expect(await textOf(read.data)).toBe(content);
    });
  });

  /**
   * The same content over the same URLs, only never held in memory as a whole. Which is why these
   * assertions look like the blob ones above: the transport differs, the result must not.
   *
   * Only the fetch client can do this - axios and jquery refuse the call - and that is what the
   * int-tests run on.
   */
  describe("streamed transfer", () => {
    const ebook = () => LIBRARY_V2.EBooks(EBOOK);

    test("upload and download round trip", async () => {
      const content = "PK pretend-this-is-a-large-epub";

      const updated = await ebook()
        .updateStream(new Blob([content]).stream(), "application/epub+zip")
        .execute();
      expect(updated.status).toBe(204);

      const read = await ebook().getStream().execute();

      expect(read.status).toBe(200);
      expect(await textOfStream(read.data)).toBe(content);
      expectTypeOf(read).toEqualTypeOf<HttpResponseModel<ReadableStream | undefined>>();
    });

    test("what was streamed up can be read as a blob and vice versa", async () => {
      // The two ways of transferring must be interchangeable - the server stores bytes, not a shape.
      const content = "streamed up, buffered down";

      await ebook()
        .updateStream(new Blob([content]).stream(), "application/epub+zip")
        .execute();
      expect(await textOf((await ebook().getBlob().execute()).data)).toBe(content);

      await ebook()
        .updateBlob(new Blob([content], { type: "application/epub+zip" }))
        .execute();
      expect(await textOfStream((await ebook().getStream().execute()).data)).toBe(content);
    });

    test("an empty content answers 204 without a stream", async () => {
      await ebook().deleteBlob().execute();

      const read = await ebook().getStream().execute();

      // same distinction as with a blob: the entity is there, its content is not
      expect(read.status).toBe(204);
      expect(read.data).toBeUndefined();
    });
  });
});
