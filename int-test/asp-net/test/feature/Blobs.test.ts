import { describe, expect, test } from "vitest";
import { expectODataError } from "../expectODataError.js";
import { AUDIOBOOK, BASE_URL, EBOOK, LIBRARY, UNKNOWN_ID } from "../LibraryTestConstants.js";

/**
 * Binary content - odata2ts issue #149 - against a server that models both shapes OData offers.
 *
 * The reference model has a *stream property* (`Audiobook.Sample`) and *media entities*
 * (`EBook`, `AudiobookChapter`, `HasStream="true"`), and the two are addressed differently. The
 * asymmetry in the URLs is the interesting part and the reason both are asserted here:
 *
 * - `Sample` is declared on the `Audiobook` subtype, so it exists **only behind the type cast**:
 *   `…/Media(<id>)/Library.Catalog.Audiobook/Sample`. Without the cast the server answers 404.
 * - `$value` addresses the entity itself, which its key already identifies, so the cast segment must
 *   **not** be there: `…/Media(<id>)/Library.Catalog.EBook/$value` answers 404 while
 *   `…/Media(<id>)/$value` serves the content.
 *
 * Getting that wrong is a 404, not a wrong payload, so each test pins the URL as well as the bytes.
 */
describe("ASP.NET Library: binary content", () => {
  /** Reading a blob back as text keeps the assertions legible - the payloads here are text on purpose. */
  async function textOf(blob: Blob | undefined) {
    return blob === undefined ? undefined : blob.text();
  }

  describe("stream property", () => {
    const audiobook = () => LIBRARY.Media(AUDIOBOOK).asAudiobookService();

    test("the URL goes through the type cast", () => {
      expect(audiobook().Sample().getPath()).toBe(`${BASE_URL}/Media(${AUDIOBOOK})/Library.Catalog.Audiobook/Sample`);
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
      // this server returns the MIME type it was given
      expect(read.data?.type).toBe("audio/mpeg");
    });

    test("the MIME type can be overridden", async () => {
      await audiobook()
        .Sample()
        .updateBlob(new Blob(["whatever"]), "audio/ogg")
        .execute();

      const read = await audiobook().Sample().getBlob().execute();

      expect(read.data?.type).toBe("audio/ogg");
    });

    test("deleting the content leaves the entity in place", async () => {
      await audiobook()
        .Sample()
        .updateBlob(new Blob(["to be removed"], { type: "audio/mpeg" }))
        .execute();

      const deleted = await audiobook().Sample().deleteBlob().execute();
      expect(deleted.status).toBe(204);

      // 204 and no blob, *not* 404: the property exists as part of the entity, its content does not
      const read = await audiobook().Sample().getBlob().execute();
      expect(read.status).toBe(204);
      expect(read.data).toBeUndefined();

      const entity = await LIBRARY.Media(AUDIOBOOK).query().execute();
      expect(entity.data.Title).toBeDefined();
    });

    test("deleting is idempotent, and 404 only for an unknown entity", async () => {
      // The distinction the server has to keep: an empty stream is a state, a missing audiobook is not.
      const again = await audiobook().Sample().deleteBlob().execute();
      expect(again.status).toBe(204);

      await expectODataError(LIBRARY.Media(UNKNOWN_ID).asAudiobookService().Sample().deleteBlob().execute(), {
        status: 404,
        message: /No error message/,
      });
    });
  });

  describe("media entity", () => {
    const ebook = () => LIBRARY.Media(EBOOK).asEBookService();

    test("the URL carries $value without the type cast", () => {
      expect(ebook().content().getPath()).toBe(`${BASE_URL}/Media(${EBOOK})/$value`);
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

      const entity = await LIBRARY.Media(EBOOK).query().execute();
      expect(entity.data.Title).toBeDefined();
    });

    test("the entity's own properties are untouched by the content", async () => {
      // A media entity keeps ordinary properties, read and written as JSON. If the `$value` path leaked
      // into the regular requests, this would address the bytes instead of the entity.
      const patched = await LIBRARY.Media(EBOOK).asEBookService().patch({ Language: "en" }).execute();
      expect(patched.status).toBe(204);

      const entity = await LIBRARY.Media(EBOOK).query().execute();
      expect(entity.data.Language).toBe("en");
    });
  });
});
