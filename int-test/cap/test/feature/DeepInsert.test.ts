import { describe, expect, test } from "vitest";
import { expectODataError } from "../expectODataError.js";
import { LIBRARY } from "../LibraryTestConstants.js";

/**
 * Deep insert - odata2ts issue #237 - against CAP.
 *
 * The same feature as in `int-test/asp-net`, and the generated types look the same, but CAP draws a line
 * the client cannot see in the metadata: deep operations run along **compositions** only. That is by
 * design and not a trait of this server - a composition is a contained-in relationship, where operations
 * cascade, while an association is a plain reference that does not.
 *
 * What the three tests pin is how that rule *presents itself*, which differs by cardinality:
 *
 * - **composition** (`Audiobooks/Chapters`): the children are created and linked
 * - **to-many association** (`Books/Copies`): 201, and the nested data is dropped without a word. The
 *   payload is not even validated - a property that exists nowhere passes just as quietly
 * - **to-one association** (`Copies/Location`): the foreign key sits on this entity, so CAP can act -
 *   but only on a nested object containing nothing but the key. Anything else is a 400
 *
 * The two association cases are the reason this file is worth its length: the same generated property
 * silently does nothing in one case and fails loudly in the other, and ASP.NET creates the entity in
 * both. `enableDeepInsertProps` therefore says what the *protocol* allows, not what a given server does.
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

  test("a to-one association refuses everything but its key", async () => {
    // The other half of the same rule, and the louder one: for a to-one association the foreign key sits
    // on *this* entity, so CAP can act on a nested object - but only if it contains nothing but the key,
    // which then sets that foreign key. Any other property is refused.
    //
    // The generated deep insert prop cannot express that at all: `EditableBranches` requires `Name`,
    // while `Id` is server-generated and therefore absent. The flattened foreign key `Location_Id` is
    // the route that works here - which is why this test exists rather than a working one.
    const branches = await LIBRARY.Branches()
      .query((builder) => builder.top(1))
      .execute();
    const branchId = branches.data.value[0].Id;

    await expectODataError(
      LIBRARY.Copies()
        .create({
          MediumId: "00000000-0000-0000-0000-000000000000",
          InventoryNumber: 9802,
          IsLoanable: true,
          Location: { Name: "Branch Created On The Fly" },
        })
        .execute(),
      // CAP names the navigation property here, not the entity behind it
      { status: 400, message: /Property "Name" does not exist in Location/ },
    );

    // the foreign key does what the nested object cannot
    const created = await LIBRARY.Copies()
      .create({
        MediumId: "00000000-0000-0000-0000-000000000000",
        InventoryNumber: 9803,
        IsLoanable: true,
        Location_Id: branchId,
      })
      .execute();

    expect(created.status).toBe(201);
    expect(created.data.Location_Id).toBe(branchId);
  });
});
