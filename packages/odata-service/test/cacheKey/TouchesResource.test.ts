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

  test("a 'detail' hop's own '?' placeholder does not stand in the way of finding its nested params", () => {
    // the "?" placeholder pushes a "detail" hop's own nested params to its 4th element, not its 3rd - a
    // position shift that must not silently break recursion into it
    const key = [MEDIA, "detail", 5, { expand: [["medium", "detail", "?", { expand: [["copies", "list"]] }]] }];
    expect(touchesResource(["copies", "list"], key)).toBe(true);
  });

  test("a bare 'detail' hop needle (no key) matches the '?' placeholder form by prefix", () => {
    const key = [MEDIA, "detail", 5, { expand: [["Publishers", "detail", "?"]] }];
    expect(touchesResource(["Publishers", "detail"], key)).toBe(true);
  });

  test("the '?' placeholder needle matches only the unknown-id form, not a specific-key write's own entry", () => {
    const key = [MEDIA, "detail", 5, { expand: [["Publishers", "detail", "?"]] }];
    expect(touchesResource(["Publishers", "detail", "?"], key)).toBe(true);
    expect(touchesResource(["Publishers", "detail", 5], key)).toBe(false);
  });

  test("an unrelated name inside an unrelated expand entry does not match", () => {
    const key = [MEDIA, "detail", 5, { expand: [["copies", "list"]] }];
    expect(touchesResource(["members", "list"], key)).toBe(false);
  });

  test("a key with no params object at all is unaffected - nothing to recurse into", () => {
    const key = [MEDIA, "detail", 5];
    expect(touchesResource(["copies", "list"], key)).toBe(false);
  });

  test("a statically-keyed hop's own key, already renamed to its entity set's name by withKey, is found by a plain top-level scan - no params object involved at all", () => {
    // Publishers(1).Books(id): "Books" is the hop's own OData name, but withKey already renamed this
    // segment to "Media" (its target's entity set) when the key was applied - see CacheKeyState.ts
    const key = ["Publishers", "detail", 1, "Media", "detail", "1111...1"];
    expect(touchesResource(["Media", "detail", "1111...1"], key)).toBe(true);
    // the hop's own ancestor prefix is still findable too - the rename only touches its own segment
    expect(touchesResource(["Publishers", "detail", 1], key)).toBe(true);
    // a different id does not match
    expect(touchesResource(["Media", "detail", "2222...2"], key)).toBe(false);
  });
});
