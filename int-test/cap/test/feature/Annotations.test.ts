import { describe, expect, expectTypeOf, test } from "vitest";
import type { EditableBooks as StrictEditableBooks } from "../../src-generated/library-strict/index.js";
import type { EditableBooks } from "../../src-generated/library/index.js";
import { LIBRARY } from "../LibraryTestConstants.js";

/**
 * Evaluation of the `Org.OData.Core.V1` terms which say how the server manages a property, against the
 * server that states them.
 *
 * CAP is the interesting half of the pair: it declares the vocabulary under the alias `Core` and states
 * every term **externally**, in `<Annotations Target="Library.Service.Books/Id">` blocks - whereas
 * `int-test/asp-net` writes the same terms fully qualified and declares no `edmx:Reference` at all. Both
 * spellings have to arrive at the same generated model, so the counterpart of this file lives there.
 *
 * The point of testing this against a running server rather than in a unit test is the direction the
 * metadata alone cannot settle: whether the server really accepts what odata2ts now lets the client send,
 * and really fills in what it no longer lets the client send.
 */
describe("CAP Library: Core annotations", () => {
  test("Core.ComputedDefaultValue keeps the key writable", async () => {
    /*
     * `Books/Id` carries `Core.ComputedDefaultValue`, which says the client *may* supply a value and the
     * server generates one otherwise. That beats the "a single key prop is server-generated" heuristic,
     * so the key is part of the editable model - optional, never required.
     */
    expectTypeOf<EditableBooks>().toHaveProperty("Id");
    expectTypeOf<EditableBooks["Id"]>().toEqualTypeOf<string | undefined>();

    const Id = "0195ba49-11b1-7ba0-9f4b-2fa5e0d1c001";
    const created = await LIBRARY.Books().create({ Id, Title: "Annotated Book" }).execute();

    try {
      // the decisive assertion: the server took the id the client chose, so keeping it editable is right
      expect(created.status).toBe(201);
      expect(created.data.Id).toBe(Id);
    } finally {
      await LIBRARY.Books(Id).delete().execute();
    }
  });

  test("Core.ComputedDefaultValue lets the server fill in", async () => {
    // the other half of what the term promises: leaving it out is just as valid
    const created = await LIBRARY.Books().create({ Title: "Book Without An Id" }).execute();
    const generatedId = created.data.Id;

    try {
      expect(created.status).toBe(201);
      expect(generatedId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-/i);
    } finally {
      await LIBRARY.Books(generatedId).delete().execute();
    }
  });

  test("Core.Computed marks the property as the server's", async () => {
    // `Books/PopularityScore` is computed on insert and update alike - readOnly, so the default mode
    // keeps it in the write model but never requires it, while strictOmit takes it out entirely
    expectTypeOf<EditableBooks["PopularityScore"]>().toEqualTypeOf<number | null | undefined>();
    expectTypeOf<StrictEditableBooks>().not.toHaveProperty("PopularityScore");

    const Id = "0195ba49-11b1-7ba0-9f4b-2fa5e0d1c002";
    const created = await LIBRARY.Books().create({ Id, Title: "Computed Book" }).execute();

    try {
      expect(created.status).toBe(201);
      // readable all the same - it is only the payload the term keeps it out of
      const read = await LIBRARY.Books(Id).query().execute();
      expectTypeOf(read.data.PopularityScore).toEqualTypeOf<number | null>();
    } finally {
      await LIBRARY.Books(Id).delete().execute();
    }
  });

  test("a computed value sent anyway is not honoured", async () => {
    /*
     * Why the term is worth acting on at all: the type system is the only thing stopping a client here,
     * because the server does not complain - it quietly drops the value. Casting past the editable model
     * shows what a client would be doing without it.
     */
    const Id = "0195ba49-11b1-7ba0-9f4b-2fa5e0d1c003";
    const payload = { Id, Title: "Sneaky Book", PopularityScore: 99 } as unknown as EditableBooks;
    const created = await LIBRARY.Books().create(payload).execute();

    try {
      expect(created.status).toBe(201);
      expect(created.data.PopularityScore).not.toBe(99);
    } finally {
      await LIBRARY.Books(Id).delete().execute();
    }
  });
});
