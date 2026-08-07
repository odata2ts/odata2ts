import { beforeEach, describe, expect, test } from "vitest";
import { CollectionQueryBuilderV2, CollectionQueryBuilderV4, createQueryBuilderV2, createQueryBuilderV4 } from "../src";
import { QPerson, qPerson } from "./fixture/types/QSimplePersonModel";

/**
 * A complex property which the service states flat (`unflattenComplexTypes`) is not a property the
 * service knows - only its leaves are. So it can never appear in a query as itself: neither as a nested
 * `$select=Prop(...)` clause in V4 nor as an `$expand` in V2, but always as the flat paths of its leaves.
 */
describe("Flat complex properties in queries", () => {
  describe("V4", () => {
    let toTest: CollectionQueryBuilderV4<QPerson>;

    beforeEach(() => {
      toTest = createQueryBuilderV4("/Persons", qPerson, { unencoded: true });
    });

    const addBase = (urlPart: string) => `/Persons${urlPart ? `?${urlPart}` : ""}`;

    test("expanding selects the leaves, without nesting them into a clause", () => {
      const result = toTest.expanding("flatAddress", (builder) => builder.select("street", "city")).build();

      expect(result).toBe(addBase("$select=FlatAddress_street,FlatAddress_city"));
    });

    test("the query object handed to the callback carries the prefix", () => {
      let seen = "";
      toTest.expanding("flatAddress", (builder, qAddress) => {
        seen = qAddress.city.getPath();
        builder.select("city");
      });

      expect(seen).toBe("FlatAddress_city");
    });

    test("filters on a leaf, which is a property of the entity itself", () => {
      const result = toTest.filter(qPerson.flatAddress.props.city.eq("Berlin")).build();

      expect(result).toBe(addBase("$filter=FlatAddress_city eq 'Berlin'"));
    });

    test("filters on a leaf of a nested group", () => {
      const result = toTest.filter(qPerson.flatAddress.props.geo.props.lat.gt(50)).build();

      expect(result).toBe(addBase("$filter=FlatAddress_geo_lat gt 50"));
    });

    test("carries through nested flat groups", () => {
      const result = toTest
        .expanding("flatAddress", (builder) => builder.expanding("geo", (geo) => geo.select("lat", "lng")))
        .build();

      expect(result).toBe(addBase("$select=FlatAddress_geo_lat,FlatAddress_geo_lng"));
    });

    test("selecting the property as a whole selects every leaf it owns", () => {
      const result = toTest.select("flatAddress").build();

      expect(result).toBe(
        addBase("$select=FlatAddress_street,FlatAddress_city,FlatAddress_geo_lat,FlatAddress_geo_lng"),
      );
    });

    test("combines with ordinary selects", () => {
      const result = toTest
        .select("name")
        .expanding("flatAddress", (b) => b.select("city"))
        .build();

      expect(result).toBe(addBase("$select=name,FlatAddress_city"));
    });

    test("orders by a leaf", () => {
      const result = toTest.orderBy(qPerson.flatAddress.props.city.asc()).build();

      expect(result).toBe(addBase("$orderby=FlatAddress_city asc"));
    });

    test("relays a navigation property reached through it up to the expand, already flat", () => {
      const result = toTest
        .expanding("flatAddress", (builder) => builder.expanding("responsible", (r) => r.select("name")))
        .build();

      // there is no `FlatAddress` path to hop through - a service which flattened the property knows the
      // navigation property under the flat name too
      expect(result).toBe(addBase("$expand=FlatAddress_responsible($select=name)"));
    });

    test("leaves a genuinely complex property nested, as before", () => {
      const result = toTest.expanding("address", (builder) => builder.select("street")).build();

      expect(result).toBe(addBase("$select=Address($select=street)"));
    });
  });

  describe("V2", () => {
    let toTest: CollectionQueryBuilderV2<QPerson>;

    beforeEach(() => {
      toTest = createQueryBuilderV2("/Persons", qPerson, { unencoded: true });
    });

    const addBase = (urlPart: string) => `/Persons${urlPart ? `?${urlPart}` : ""}`;

    test("expanding selects the leaves and expands nothing", () => {
      const result = toTest.expanding("flatAddress", (builder) => builder.select("street", "city")).build();

      expect(result).toBe(addBase("$select=FlatAddress_street,FlatAddress_city"));
    });

    test("carries through nested flat groups", () => {
      const result = toTest
        .expanding("flatAddress", (builder) => builder.expanding("geo", (geo) => geo.select("lat")))
        .build();

      expect(result).toBe(addBase("$select=FlatAddress_geo_lat"));
    });

    test("selecting the property as a whole selects every leaf it owns", () => {
      const result = toTest.select("flatAddress").build();

      expect(result).toBe(
        addBase("$select=FlatAddress_street,FlatAddress_city,FlatAddress_geo_lat,FlatAddress_geo_lng"),
      );
    });

    test("leaves a genuinely complex property expanded, as before", () => {
      const result = toTest.expanding("address", (builder) => builder.select("street")).build();

      expect(result).toBe(addBase("$select=Address/street&$expand=Address"));
    });
  });
});
