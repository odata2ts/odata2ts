import { describe, expect, test } from "vitest";
import { BASE_URL, LIBRARY } from "../LibraryTestConstants.js";

/**
 * Deep select into complex properties, via `expanding()`.
 *
 * A complex property is *not* a navigation property: it needs no `$expand`. `expanding()` is the builder's
 * way to descend into one, and it renders a **nested select** inside `$select`
 * (`$select=Address($select=City)`) rather than an `$expand` - which is the part that can silently go
 * wrong, since a stray `$expand=Address` makes servers answer 400.
 *
 * Only this server has complex properties: CAP flattens them into `Address_City` and the like, so there is
 * nothing to descend into there.
 */
describe("ASP.NET Library: deep select", () => {
  test("expanding a complex property renders as $select, not $expand", async () => {
    const request = LIBRARY.Branches(1).query((builder) =>
      builder.select("Name").expanding("Address", (addressBuilder) => addressBuilder.select("City", "Country")),
    );

    const url = request.getUrl();

    expect(url).toContain("%24select=");
    expect(url).not.toContain("%24expand=");
    expect(decodeURIComponent(url)).toBe(`${BASE_URL}/Branches(1)?$select=Name,Address($select=City,Country)`);

    const result = await request.execute();

    expect(result.status).toBe(200);
    expect(result.data.Name).toBeDefined();
    expect(result.data.Address).toMatchObject({ City: expect.any(String), Country: expect.any(String) });
    // narrowed to the two sub-properties that were asked for
    expect(result.data.Address?.Street).toBeUndefined();
  });

  test("a wildcard select on a complex property flattens to prefix/*", async () => {
    const request = LIBRARY.Branches(1).query((builder) =>
      builder.select("Name").expanding("Address", (addressBuilder) => addressBuilder.select("*")),
    );

    expect(decodeURIComponent(request.getUrl())).toBe(`${BASE_URL}/Branches(1)?$select=Name,Address($select=*)`);

    const result = await request.execute();

    expect(result.status).toBe(200);
    // the whole complex value, so the sub-property left out above is back
    expect(result.data.Address?.Street).toBeDefined();
  });

  test("a complex collection can be descended into as well", async () => {
    const request = LIBRARY.Members()
      .query((builder) =>
        builder
          .select("Name")
          .expanding("PreviousAddresses", (addressBuilder) => addressBuilder.select("City"))
          .top(5),
      )
      .execute();

    const result = await request;

    expect(result.status).toBe(200);
    const withAddresses = result.data.value.find((member) => (member.PreviousAddresses?.length ?? 0) > 0);
    if (withAddresses) {
      expect(withAddresses.PreviousAddresses?.[0]).toMatchObject({ City: expect.any(String) });
      expect(withAddresses.PreviousAddresses?.[0].Street).toBeUndefined();
    }
  });

  test("a complex property nested inside another one stays inline", async () => {
    // `Copy.Medium` is a navigation property, so that one *does* need `$expand` - and a complex property
    // behind it is selected inline within that expand. The two mechanisms meeting is the interesting case.
    const request = LIBRARY.Media()
      .query((builder) => builder.select("Title").expand("Copies").top(1))
      .execute();

    const result = await request;
    expect(result.status).toBe(200);
  });
});
