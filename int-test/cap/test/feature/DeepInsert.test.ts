import { describe, expect, test } from "vitest";
import { LIBRARY } from "../LibraryTestConstants.js";

/**
 * Deep insert - odata2ts issue #237 - against CAP.
 *
 * The same feature as in `int-test/asp-net`, and the generated types look the same, but CAP draws a line
 * the client cannot see in the metadata: a **composition** takes its children along, a plain
 * **association** does not. `Audiobooks` owns its `Chapters` (CAP marks that with the `up_` backlink,
 * which is why it shows up in the model at all), while `Copies` merely reference their medium.
 *
 * The second test pins the awkward half of that: a payload for an association is accepted with 201 and
 * then quietly dropped. Nothing on the client side can turn that into an error - which is exactly why
 * it is written down here.
 */
describe("CAP Library: deep insert", () => {
  test("a composition is created along with the entity", async () => {
    // CAP does not generate this key, unlike the ones of the entity sets themselves
    const chapterId = Math.floor(Math.random() * 1_000_000) + 900_000;

    const created = await LIBRARY.Audiobooks()
      .create({
        Title: "Deep Insert Audiobook",
        Language: "de",
        // Edm.Duration, so a string - not a number
        Duration: "PT1H",
        Narrator: "Some Narrator",
        // up__Id is the backlink to the parent, which does not exist yet - CAP fills it in and overwrites
        // whatever was sent, but the editable model demands it, since it is a plain required property
        Chapters: [{ Id: chapterId, up__Id: "00000000-0000-0000-0000-000000000000", Title: "First chapter" }],
      })
      .execute();

    expect(created.status).toBe(201);

    const read = await LIBRARY.Audiobooks(created.data.Id)
      .query((builder) => builder.expanding("Chapters", (chapter) => chapter))
      .execute();

    expect(read.data.Chapters).toHaveLength(1);
    expect(read.data.Chapters?.[0].Title).toBe("First chapter");
    // the backlink CAP maintains for a composition, filled in from the parent
    expect(read.data.Chapters?.[0].up__Id).toBe(created.data.Id);
  });

  test("an association is accepted and then dropped", async () => {
    // `Copies` is an association here, not a composition, so CAP takes the payload, answers 201 and
    // creates nothing. ASP.NET does create the copy - the model cannot express the difference, so the
    // same generated type behaves differently per server.
    const created = await LIBRARY.Books()
      .create({
        Title: "Deep Insert Book",
        Language: "de",
        PageCount: 123,
        AgeRating: 0,
        ISBN: "9780000009801",
        Copies: [
          {
            MediumId: "00000000-0000-0000-0000-000000000000",
            InventoryNumber: 9801,
            IsLoanable: true,
          },
        ],
      })
      .execute();

    expect(created.status).toBe(201);

    const read = await LIBRARY.Books(created.data.Id)
      .query((builder) => builder.expanding("Copies", (copy) => copy))
      .execute();

    expect(read.data.Copies).toStrictEqual([]);
  });
});
