import { describe, expect, test } from "vitest";
import { expectODataError } from "../../expectODataError.js";
import { LIBRARY_V2, UNKNOWN_ID } from "../LibraryV2TestConstants.js";

/**
 * Deep insert - odata2ts issue #237 - over V2.
 *
 * V2 has no `@odata.bind` and no separate notation for a deep insert: a nested object in the payload *is*
 * the deep insert, which is what odata2ts sends in both versions. The adapter passes it to the V4 endpoint,
 * so the rule that decides the outcome is CAP's own and identical to the V4 case: deep operations run along
 * **compositions**, never along associations.
 *
 * The four cases and their verdicts therefore mirror `test/feature/DeepInsert.test.ts` exactly - which is
 * the point of testing them again here. What differs is only what comes back: V2 answers a create with the
 * nested entity inlined, so the children are visible in the response instead of needing a re-read.
 */
describe("CAP Library V2: deep insert", () => {
  test("a to-one composition is created along with the entity", async () => {
    const uploadedAt = "2026-08-02T10:00:00Z";

    const created = await LIBRARY_V2.Members()
      .create({
        Name: "V2 Deep Insert Member",
        // no key: the server generates it, so it is no part of the editable model
        IdDocument: { UploadedAt: uploadedAt },
      })
      .execute();

    expect(created.status).toBe(201);

    const read = await LIBRARY_V2.Members(created.data.d.Id)
      .query((builder) => builder.expand("IdDocument"))
      .execute();

    const idDocument = read.data.d.IdDocument as { UploadedAt: string | null };
    expect(idDocument).toBeDefined();
    // V2 serialises a timestamp as ticks since the epoch, not as ISO 8601 - see feature/DataTypes.test.ts
    expect(idDocument.UploadedAt).toBe(`/Date(${Date.parse(uploadedAt)}+0000)/`);
  });

  test("a to-many composition is created along with the entity", async () => {
    // CAP does not generate this key, unlike the ones of the entity sets themselves
    const chapterId = Math.floor(Math.random() * 1_000_000) + 900_000;

    const created = await LIBRARY_V2.Audiobooks()
      .create({
        Title: "V2 Deep Insert Audiobook",
        Language: "de",
        // Edm.Duration has no V2 counterpart, so the adapter declares it Edm.String - the value is the same
        Duration: "PT1H",
        Narrator: "Some Narrator",
        // up__Id is the backlink to the parent, which does not exist yet - CAP fills it in and overwrites
        // whatever was sent, but the editable model demands it, since it is a plain required property
        Chapters: [{ Id: chapterId, up__Id: UNKNOWN_ID, Title: "First chapter" }],
      })
      .execute();

    expect(created.status).toBe(201);

    const read = await LIBRARY_V2.Audiobooks(created.data.d.Id)
      .query((builder) => builder.expand("Chapters"))
      .execute();

    const chapters = read.data.d.Chapters as Array<{ Title: string | null; up__Id: string }>;
    expect(chapters).toHaveLength(1);
    expect(chapters[0].Title).toBe("First chapter");
    expect(chapters[0].up__Id).toBe(created.data.d.Id);
  });

  test("a to-many association is accepted and then dropped", async () => {
    const created = await LIBRARY_V2.Books()
      .create({
        Title: "V2 Deep Insert Book",
        Language: "de",
        PageCount: 123,
        AgeRating: "0",
        ISBN: "9780000009811",
        Copies: [
          {
            MediumId: UNKNOWN_ID,
            InventoryNumber: 9811,
            IsLoanable: true,
          },
        ],
      })
      .execute();

    expect(created.status).toBe(201);

    const read = await LIBRARY_V2.Books(created.data.d.Id)
      .query((builder) => builder.expand("Copies"))
      .execute();

    expect(read.data.d.Copies).toStrictEqual([]);
  });

  test("a to-one association refuses everything but its key", async () => {
    const branches = await LIBRARY_V2.Branches()
      .query((builder) => builder.top(1))
      .execute();
    const branchId = branches.data.d.results[0].Id;

    await expectODataError(
      LIBRARY_V2.Copies()
        .create({
          MediumId: UNKNOWN_ID,
          InventoryNumber: 9812,
          IsLoanable: true,
          Location: { Name: "Branch Created On The Fly" },
        })
        .execute(),
      // the message reaches the client unchanged through the adapter
      { status: 400, message: /Property "Name" does not exist in Location/ },
    );

    // the foreign key does what the nested object cannot
    const created = await LIBRARY_V2.Copies()
      .create({
        MediumId: UNKNOWN_ID,
        InventoryNumber: 9813,
        IsLoanable: true,
        Location_Id: branchId,
      })
      .execute();

    expect(created.status).toBe(201);
    expect(created.data.d.Location_Id).toBe(branchId);
    // no cleanup: a copy carries a concurrency token here and cannot be deleted again over V2 at all,
    // see core/CrudOperations.test.ts. Like its V4 twin, this file relies on the fresh server per run.
  });
});
