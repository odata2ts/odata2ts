import { describe, expect, test } from "vitest";
import { touchesResource } from "../../src/cacheKey";

const MEDIA = "Media";
const MEMBERS = "Members";
const COPIES = "Copies";

describe("touchesResource - array needle, top level", () => {
  test("a root-shaped needle matches itself exactly", () => {
    expect(touchesResource([MEDIA, "detail", 5], [MEDIA, "detail", 5])).toBe(true);
  });

  test("a root-shaped needle matches as a plain prefix", () => {
    const key = [MEDIA, "detail", 5, "copies", "list"];
    expect(touchesResource([MEDIA, "detail", 5], key)).toBe(true);
  });

  test("a composite key object matches by value, not by reference", () => {
    const key = [COPIES, "detail", { MediumId: 5, InventoryNumber: 7 }];
    expect(touchesResource([COPIES, "detail", { InventoryNumber: 7, MediumId: 5 }], key)).toBe(true);
  });

  test("a bare entity-set list entry reaches a nested hop only where the hop's own name happens to match", () => {
    // this is the sharper, name-based replacement for the old coarse by-type reach: it only finds a hop
    // whose own navigation-property name coincides with the entity set's name - there is no generated
    // table to bridge the two where they differ, that job belongs to ResourceIdentityHandler instead
    const key = ["Library.Circulation.Loan", "detail", 1, "copies", "list"];
    expect(touchesResource(["copies", "list"], key)).toBe(true);
    expect(touchesResource([COPIES, "list"], key)).toBe(false);
  });

  test("a detail needle does not match a list occurrence of the same name", () => {
    const key = ["Library.Circulation.Loan", "detail", 1, "copies", "list"];
    expect(touchesResource(["copies", "detail", 7], key)).toBe(false);
  });

  test("a specific-key needle reaches the same entity addressed as a hop under an unrelated parent", () => {
    // /SomeOther(9)/Copies(MediumId=5,InventoryNumber=7) - a completely different route to the very
    // same Copy this write's own key names, reachable because the hop's own name happens to be "Copies"
    const key = ["Library.Circulation.SomeOther", "detail", 9, "Copies", "detail", { MediumId: 5, InventoryNumber: 7 }];
    expect(touchesResource([COPIES, "detail", { MediumId: 5, InventoryNumber: 7 }], key)).toBe(true);
  });

  test("a specific-key needle does not match a different key reached the same way", () => {
    const key = ["Library.Circulation.SomeOther", "detail", 9, "Copies", "detail", { MediumId: 5, InventoryNumber: 7 }];
    expect(touchesResource([COPIES, "detail", { MediumId: 9, InventoryNumber: 1 }], key)).toBe(false);
  });

  test("a to-one hop with no addressed key of its own is not reachable by a keyed needle", () => {
    // /Copies(...)/Medium hierarchical: the hop only ever carries its own name and kind - never the
    // target's own key - so no needle carrying a key value can match it
    const key = [COPIES, "detail", { MediumId: 5, InventoryNumber: 7 }, "medium", "detail"];
    expect(touchesResource([MEDIA, "detail", 5], key)).toBe(false);
  });

  test("an unrelated name does not match", () => {
    expect(touchesResource([MEMBERS, "list"], [MEDIA, "list"])).toBe(false);
  });

  test("an empty key matches nothing", () => {
    expect(touchesResource([MEDIA, "detail", 5], [])).toBe(false);
  });
});

describe("touchesResource - expand entries, buried inside the trailing params object", () => {
  test("finds a hop-shaped expand entry, exactly or by prefix", () => {
    const key = [MEDIA, "detail", 5, { expand: [["copies", "list"]] }];
    expect(touchesResource(["copies", "list"], key)).toBe(true);
    expect(touchesResource(["copies"], key)).toBe(true);
  });

  test("a bare, unenriched expand path contributes nothing to search - there is no name to find in a plain rendered path", () => {
    const key = [MEDIA, "detail", 5, { expand: ["address"] }];
    expect(touchesResource(["copies", "list"], key)).toBe(false);
  });

  test("recurses into a nested expanding()'s own nested params", () => {
    const key = [MEDIA, "detail", 5, { expand: [["copies", "list", { expand: [["reservations", "list"]] }]] }];
    expect(touchesResource(["reservations", "list"], key)).toBe(true);
  });

  test("an unrelated name inside an unrelated expand entry does not match", () => {
    const key = [MEDIA, "detail", 5, { expand: [["copies", "list"]] }];
    expect(touchesResource(["members", "list"], key)).toBe(false);
  });

  test("a key with no params object at all is unaffected - nothing to recurse into", () => {
    const key = [MEDIA, "detail", 5];
    expect(touchesResource(["copies", "list"], key)).toBe(false);
  });
});
