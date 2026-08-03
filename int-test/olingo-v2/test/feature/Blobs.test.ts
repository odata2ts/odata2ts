import { describe, expect, expectTypeOf, test } from "vitest";
import { AudiobookChapter, EBook } from "../../src-generated/library/LibraryModel.js";
import { AUDIOBOOK_CHAPTER, BASE_URL, EBOOK_CLEAN_CODE, LIBRARY } from "../LibraryTestConstants.js";

/**
 * Binary content - odata2ts issue #149 - and the one feature where the server is ahead of the client.
 *
 * This server declares two media link entries (`m:HasStream="true"`): `EBook`, which is one *inside* the
 * inheritance hierarchy, and `AudiobookChapter`. Both serve their content from `.../$value` and advertise
 * it through `__metadata.media_src`, exactly as V2 prescribes.
 *
 * odata2ts cannot reach any of it: `StreamServiceV4` and `MediaEntityServiceV4` live in the v4 folder of
 * `@odata2ts/odata-service` and have no V2 counterpart, and the V2 generator emits neither. So this file
 * asserts the gap from both sides rather than leaving the feature untested - the same shape as the CAP
 * package's Blobs test, and for the same reason.
 *
 * The raw `fetch` calls are deliberate and the only ones here that could have been client calls.
 */
describe("Olingo Library: binary content", () => {
  test("the generated model has no property for the content", () => {
    // A media link entry's content is the entity itself, so there is no property to type - in either
    // version. What differs is that V4 would at least generate a media-entity service.
    expectTypeOf<EBook>().not.toHaveProperty("content");
    expectTypeOf<AudiobookChapter>().not.toHaveProperty("content");
  });

  test("the generated service offers no way to read or write it", () => {
    const ebook = LIBRARY.EBooks(EBOOK_CLEAN_CODE) as unknown as Record<string, unknown>;

    expect(ebook.getBlob).toBeUndefined();
    expect(ebook.updateBlob).toBeUndefined();
    expect(ebook.getStream).toBeUndefined();
    expect(
      (LIBRARY.AudiobookChapters(AUDIOBOOK_CHAPTER) as unknown as Record<string, unknown>).getBlob,
    ).toBeUndefined();
  });

  test("the entity advertises its content, and the server serves it", async () => {
    const entity = await LIBRARY.EBooks(EBOOK_CLEAN_CODE).query().execute();

    // `media_src` and `content_type` are V2's way of pointing at the content - and they are in the
    // payload, reachable by a caller willing to leave the generated API behind
    const metadata = entity.data.d.__metadata as unknown as Record<string, string>;
    expect(metadata.media_src).toBe(`${BASE_URL}/EBooks(guid'${EBOOK_CLEAN_CODE}')/$value`);
    expect(metadata.content_type).toBe("application/epub+zip");

    const content = await fetch(metadata.media_src);
    expect(content.status).toBe(200);
    expect(content.headers.get("content-type")).toContain("application/epub+zip");
    expect(await content.text()).toContain("epub");
  });

  test("a media link entry inside the inheritance hierarchy behaves like any other", async () => {
    // `EBook` derives from the abstract `Medium` *and* carries a stream. The combination is what the
    // reference model exists to probe, and it costs nothing here.
    const entity = await LIBRARY.EBooks(EBOOK_CLEAN_CODE).query().execute();

    expect(entity.data.d.__metadata.type).toBe("Library.Catalog.EBook");
    expect(entity.data.d.Title).toBe("Clean Code"); // from Medium
    expect(entity.data.d.FileFormat).toBe("EPUB"); // its own
  });

  test("the content can be replaced", async () => {
    const url = `${BASE_URL}/AudiobookChapters(${AUDIOBOOK_CHAPTER})/$value`;
    const content = "ID3 replaced-audio-content";

    const written = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "audio/mpeg" },
      body: content,
    });
    expect(written.status).toBe(204);

    const read = await fetch(url);
    expect(read.status).toBe(200);
    expect(await read.text()).toBe(content);
  });
});
