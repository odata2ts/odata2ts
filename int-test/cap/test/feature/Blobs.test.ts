import { HttpResponseModel } from "@odata2ts/http-client-api";
import { describe, expect, expectTypeOf, test } from "vitest";
import { AUDIOBOOK, BASE_URL, EBOOK, LIBRARY } from "../LibraryTestConstants.js";

/**
 * Binary content - odata2ts issue #149 - against CAP.
 *
 * The same feature as in `int-test/asp-net`, and deliberately the same assertions, because the model
 * arrives differently here: CAP emits **no** `HasStream`, so both carriers of binary content are plain
 * `Edm.Stream` properties (`Audiobook.Sample` and `EBook.content`) on entities of their own set. Two
 * consequences a client feels:
 *
 * - no media-entity service and no `$value` in the URL - the property name is the address
 * - no type cast segment either, since each type has its own entity set here, while on ASP.NET the same
 *   `Sample` is only reachable as `…/Media(<id>)/Library.Catalog.Audiobook/Sample`
 *
 * The other difference is the MIME type: CAP answers with the type declared in its model, whatever was
 * uploaded - so these tests assert the bytes and let the type be what the server says.
 */
describe("CAP Library: binary content", () => {
  async function textOf(blob: Blob | undefined) {
    return blob === undefined ? undefined : blob.text();
  }

  /** Same for a stream, which has to be consumed before anything can be asserted about it. */
  async function textOfStream(stream: ReadableStream | undefined) {
    return stream === undefined ? undefined : new Response(stream).text();
  }

  describe("stream property on a subtype-free entity set", () => {
    const audiobook = () => LIBRARY.Audiobooks(AUDIOBOOK);

    test("the property name is the whole address", () => {
      expect(audiobook().Sample().getPath()).toBe(`${BASE_URL}/Audiobooks(${AUDIOBOOK})/Sample`);
    });

    test("upload and download round trip", async () => {
      const content = "ID3 pretend-this-is-mp3";

      const updated = await audiobook()
        .Sample()
        .updateBlob(new Blob([content], { type: "audio/mpeg" }))
        .execute();
      expect(updated.status).toBe(204);

      const read = await audiobook().Sample().getBlob().execute();

      expect(read.status).toBe(200);
      expect(await textOf(read.data)).toBe(content);
    });

    test("deleting the content is supported", async () => {
      await audiobook()
        .Sample()
        .updateBlob(new Blob(["to be removed"], { type: "audio/mpeg" }))
        .execute();

      const deleted = await audiobook().Sample().deleteBlob().execute();
      expect(deleted.status).toBe(204);

      // 204 and no blob: the entity is there, its content is not. ASP.NET refuses this with 405, which
      // is why the two packages differ right here.
      const read = await audiobook().Sample().getBlob().execute();
      expect(read.status).toBe(204);
      expect(read.data).toBeUndefined();
    });
  });

  describe("what the reference model declares as a media entity", () => {
    // `EBook` is `HasStream="true"` in the reference model; CAP re-expresses it as a `content` property.
    // So `content()` here is the generated stream-property service, not the media-entity shortcut - the
    // very difference this package exists to keep visible.
    const ebook = () => LIBRARY.EBooks(EBOOK);

    test("no $value: the content is a property", () => {
      expect(ebook().content().getPath()).toBe(`${BASE_URL}/EBooks(${EBOOK})/content`);
    });

    test("upload and download round trip", async () => {
      const content = "PK pretend-this-is-epub";

      const updated = await ebook()
        .content()
        .updateBlob(new Blob([content], { type: "application/epub+zip" }))
        .execute();
      expect(updated.status).toBe(204);

      const read = await ebook().content().getBlob().execute();

      expect(read.status).toBe(200);
      expect(await textOf(read.data)).toBe(content);
      // CAP serves the MIME type from its model, not the uploaded one
      expect(read.data?.type).toBe("application/epub+zip");
    });

    test("the entity's own properties are untouched by the content", async () => {
      // CAP answers a patch with 200 and the representation, where ASP.NET answers 204
      const patched = await ebook().patch({ Language: "en" }).execute();
      expect(patched.status).toBe(200);

      const entity = await ebook().query().execute();
      expect(entity.data.Language).toBe("en");
      expect(entity.data.Title).toBeDefined();
    });
  });

  /**
   * The same content over the same URLs, only never held in memory as a whole. Which is why these
   * assertions look like the blob ones above: the transport differs, the result must not.
   *
   * Both carriers are stream properties here - CAP emits no `HasStream`, so there is no media-entity
   * shortcut to stream from, unlike in `int-test/asp-net`.
   */
  describe("streamed transfer", () => {
    const audiobook = () => LIBRARY.Audiobooks(AUDIOBOOK);
    const ebook = () => LIBRARY.EBooks(EBOOK);

    test("upload and download round trip", async () => {
      const content = "ID3 pretend-this-is-a-large-mp3";

      const updated = await audiobook()
        .Sample()
        .updateStream(new Blob([content]).stream(), "audio/mpeg")
        .execute();
      expect(updated.status).toBe(204);

      const read = await audiobook().Sample().getStream().execute();

      expect(read.status).toBe(200);
      expect(await textOfStream(read.data)).toBe(content);
      expectTypeOf(read).toEqualTypeOf<HttpResponseModel<ReadableStream | undefined>>();
    });

    test("what was streamed up can be read as a blob and vice versa", async () => {
      // The two ways of transferring must be interchangeable - the server stores bytes, not a shape.
      const content = "streamed up, buffered down";

      await ebook()
        .content()
        .updateStream(new Blob([content]).stream(), "application/epub+zip")
        .execute();
      expect(await textOf((await ebook().content().getBlob().execute()).data)).toBe(content);

      await ebook()
        .content()
        .updateBlob(new Blob([content], { type: "application/epub+zip" }))
        .execute();
      expect(await textOfStream((await ebook().content().getStream().execute()).data)).toBe(content);
    });

    test("deleted content answers 204 without a stream", async () => {
      await audiobook()
        .Sample()
        .updateStream(new Blob(["to be removed"]).stream(), "audio/mpeg")
        .execute();
      await audiobook().Sample().deleteBlob().execute();

      const read = await audiobook().Sample().getStream().execute();

      expect(read.status).toBe(204);
      expect(read.data).toBeUndefined();
    });
  });
});
