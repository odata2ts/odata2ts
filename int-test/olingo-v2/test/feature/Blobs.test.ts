import { HttpResponseModel } from "@odata2ts/http-client-api";
import { describe, expect, expectTypeOf, test } from "vitest";
import { expectODataError } from "../expectODataError.js";
import { AUDIOBOOK_CHAPTER, BASE_URL, EBOOK_CLEAN_CODE, LIBRARY, UNKNOWN_ID } from "../LibraryTestConstants.js";

/**
 * Binary content - odata2ts issue #149 - the way V2 expresses it: as **media link entries** (`m:HasStream`).
 *
 * V2 has no `Edm.Stream`, so there is only one carrier of binary data, and the entity is it. This server
 * declares two such entities: `EBook`, which sits *inside* the inheritance hierarchy, and `AudiobookChapter`,
 * which does not. Both serve their content from `.../$value` and advertise it through `__metadata.media_src`.
 *
 * The `media_src` assertion is the one that matters most here: unlike V4, V2 never specified `$value` for a
 * media resource - the entity is supposed to name its own content URL. odata2ts builds `$value` anyway,
 * because that is where every implementation puts it, so the two have to be checked against each other.
 */
describe("Olingo Library: binary content", () => {
  /** Reading a blob back as text keeps the assertions legible - the payloads here are text on purpose. */
  async function textOf(blob: Blob | undefined) {
    return blob === undefined ? undefined : blob.text();
  }

  /** Same for a stream, which has to be consumed before anything can be asserted about it. */
  async function textOfStream(stream: ReadableStream | undefined) {
    return stream === undefined ? undefined : new Response(stream).text();
  }

  describe("media link entry", () => {
    const ebook = () => LIBRARY.EBooks(EBOOK_CLEAN_CODE);

    test("the URL is the entity's own plus $value", () => {
      expect(ebook().content().getPath()).toBe(`${BASE_URL}/EBooks(guid'${EBOOK_CLEAN_CODE}')/$value`);
    });

    test("that URL is the one the entity itself advertises", async () => {
      // V2's own way of pointing at the content - if a server ever put it elsewhere, this is where the
      // built URL and the advertised one would part ways
      const entity = await ebook().query().execute();
      const metadata = entity.data.d.__metadata as unknown as Record<string, string>;

      expect(metadata.media_src).toBe(ebook().content().getPath());
      expect(metadata.edit_media).toBe(ebook().content().getPath());
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
      // this server returns the MIME type it was given
      expect(read.data?.type).toBe("application/epub+zip");
      expectTypeOf(read).toEqualTypeOf<HttpResponseModel<Blob | undefined>>();
    });

    test("the MIME type can be overridden", async () => {
      await ebook()
        .updateBlob(new Blob(["whatever"]), "application/pdf")
        .execute();

      const read = await ebook().getBlob().execute();

      expect(read.data?.type).toBe("application/pdf");
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
      expect(patched.status).toBe(204);

      const entity = await ebook().query().execute();
      expect(entity.data.d.Language).toBe("en");
      // still the media link entry it was, inheritance included
      expect(entity.data.d.__metadata.type).toBe("Library.Catalog.EBook");
      expect(entity.data.d.FileFormat).toBe("EPUB");
    });

    test("an unknown entity has no content either", async () => {
      // 404 rather than the 204 of an entity without content. The message is the client's fallback: it
      // reads the response of a binary request as a blob, error responses included, so the error body
      // the server does send is never looked into - the same shows against CAP.
      await expectODataError(LIBRARY.EBooks(UNKNOWN_ID).getBlob().execute(), {
        status: 404,
        message: /No error message/,
      });
    });
  });

  describe("media link entry outside the hierarchy", () => {
    // `EBook` derives from the abstract `Medium`, `AudiobookChapter` from nothing at all, and it is keyed
    // by an `Edm.Int32` rather than a guid. Same content access, differently built entity URL.
    const chapter = () => LIBRARY.AudiobookChapters(AUDIOBOOK_CHAPTER);

    test("upload and download round trip", async () => {
      const content = "ID3 pretend-this-is-mp3";

      expect(chapter().content().getPath()).toBe(`${BASE_URL}/AudiobookChapters(${AUDIOBOOK_CHAPTER})/$value`);

      await chapter()
        .updateBlob(new Blob([content], { type: "audio/mpeg" }))
        .execute();
      const read = await chapter().getBlob().execute();

      expect(read.status).toBe(200);
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
    const ebook = () => LIBRARY.EBooks(EBOOK_CLEAN_CODE);

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
