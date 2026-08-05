import { afterAll, describe, expect, expectTypeOf, test } from "vitest";
import type { Book, Branch, PublisherBranch } from "../../src-generated/library-renamed/LibraryRenamedModel.js";
import { RENAMED } from "../LibraryRenamedConstants.js";
import { BASE_URL, BOOK_DER_PROZESS, COPY_KEY, LIBRARY } from "../LibraryTestConstants.js";

/**
 * `allowRenaming` against a running **V2** server - the other half of what `int-test/asp-net` covers for V4.
 *
 * Renaming is not version-neutral, which is why it needs a home on both sides. The option decouples the
 * TypeScript names from the OData ones - the model reads `title`, the wire still says `Title` - and V2
 * builds several of the things carrying those names differently: a key predicate takes a type prefix
 * (`Books(guid'…')`), `$expand` cannot nest query options, a binding is stated through `__metadata.uri`,
 * and the payload arrives wrapped in `d`. A mapping proven over V4 says nothing about any of that.
 *
 * `RENAMED` is the client generated with the option, `LIBRARY` the one whose names are the server's own.
 * Both are needed: with only the renamed client, a wrongly built URL and a broken mapping look alike.
 */
describe("Olingo Library: renaming", () => {
  const createdBooks: Array<string> = [];

  afterAll(async () => {
    for (const id of createdBooks) {
      await LIBRARY.Books(id).delete().execute();
    }
  });

  test("the response is read back into the renamed properties", async () => {
    const result = await RENAMED.books(BOOK_DER_PROZESS).query().execute();

    expect(result.status).toBe(200);
    // the server sent `Title` and `ISBN`; the model carries them under their renamed names
    expect(result.data.d.title).toBe("Der Prozess");
    expect(result.data.d.isbn).toBe("9783150094440");

    expectTypeOf<Book["title"]>().toEqualTypeOf<string>();
  });

  test("the key predicate keeps the OData names and V2's type prefix", async () => {
    // The renaming stops at the TypeScript surface. V2 spells a GUID key with a `guid'…'` prefix, which is
    // built by the very query objects that also carry the renaming - so this is where the two could collide.
    expect(RENAMED.books(BOOK_DER_PROZESS).getPath()).toBe(`${BASE_URL}/Books(guid'${BOOK_DER_PROZESS}')`);
    // ... and it is the same URL the un-renamed client builds
    expect(RENAMED.books(BOOK_DER_PROZESS).getPath()).toBe(LIBRARY.Books(BOOK_DER_PROZESS).getPath());

    // a composite key, where each part has to find its own OData name again
    expect(RENAMED.copies({ mediumId: COPY_KEY.MediumId, inventoryNumber: COPY_KEY.InventoryNumber }).getPath()).toBe(
      LIBRARY.Copies(COPY_KEY).getPath(),
    );
  });

  test("$select and $filter send the OData names", async () => {
    const request = RENAMED.books().query((builder, qBook) => builder.select("title").filter(qBook.language.eq("de")));

    const url = decodeURIComponent(request.getUrl());
    expect(url).toContain("$select=Title");
    expect(url).toContain("$filter=Language eq 'de'");

    const result = await request.execute();
    expect(result.status).toBe(200);
    expect(result.data.d.results.length).toBeGreaterThan(0);
    // selected, so present - and under the renamed name
    expect(result.data.d.results[0].title).toBeDefined();
  });

  test("$expand sends the OData name and reads back renamed", async () => {
    // V2 cannot nest query options inside `$expand`, so the whole related entity comes back - which makes
    // this the case where the renaming has to hold for every property of the expanded model, not just one.
    const request = RENAMED.books(BOOK_DER_PROZESS).query((builder) => builder.expand("publisher"));

    expect(decodeURIComponent(request.getUrl())).toContain("$expand=Publisher");

    const result = await request.execute();
    expect(result.data.d.publisher).toBeDefined();
    expect((result.data.d.publisher as { name: string }).name).toBeDefined();
  });

  test("a payload is written with the OData names", async () => {
    const created = await RENAMED.books()
      .create({ title: "V2 Renaming Round Trip", isbn: "9780000000001", language: "de" })
      .execute();

    expect(created.status).toBe(201);
    const id = created.data.d.id;
    createdBooks.push(id);

    // read back through the raw client: shows the values landed under their OData names on the server, and
    // are not merely an artefact of the renamed client talking to itself
    const raw = (await LIBRARY.Books(id).query().execute()).data.d;
    expect(raw.Title).toBe("V2 Renaming Round Trip");
    expect(raw.ISBN).toBe("9780000000001");
  });

  test("two OData names which camelCase would collapse stay apart", async () => {
    // `Location_` is the shelf mark, `Location` the branch an item sits in - both would be `location`.
    // `propertiesByName` maps the former to `shelfLocation`, and each still has to reach its own OData name.
    const key = { mediumId: COPY_KEY.MediumId, inventoryNumber: COPY_KEY.InventoryNumber };
    const copy = RENAMED.copies(key);

    expect(decodeURIComponent(copy.query((b) => b.select("shelfLocation")).getUrl())).toContain("$select=Location_");
    expect(decodeURIComponent(copy.query((b) => b.expand("location")).getUrl())).toContain("$expand=Location");

    // the seeded value, read through both clients - the same server field, two different names
    const renamed = (await copy.query().execute()).data.d;
    const raw = (await LIBRARY.Copies(COPY_KEY).query().execute()).data.d;
    expect(renamed.shelfLocation).toBe(raw.Location_);
    expect(renamed.shelfLocation).toBeDefined();
  });

  test("a type renamed by hand keeps its own identity", () => {
    // `Branch` exists in two namespaces; `byTypeAndName` gives the one in PublisherRegistry a name of its
    // own. Purely a generator concern - nothing about it reaches the wire, so this is a type-level check.
    expectTypeOf<PublisherBranch>().not.toEqualTypeOf<Branch>();
    expectTypeOf<PublisherBranch["city"]>().toEqualTypeOf<string | null>();
  });
});
