import { describe, expect, test } from "vitest";
import { qMember } from "../fixture/FlatComplexModel";

describe("QFlatComplexPath", () => {
  describe("query paths", () => {
    test("joins a leaf with an underscore instead of a slash", () => {
      expect(qMember.address.props.city.getPath()).toBe("Address_City");
      expect(qMember.address.props.street.getPath()).toBe("Address_Street");
    });

    test("keeps the property itself addressable by its own name", () => {
      expect(qMember.address.getPath()).toBe("Address");
    });

    test("carries the separator through nested groups", () => {
      expect(qMember.home.props.label.getPath()).toBe("Home_Label");
      expect(qMember.home.props.address.props.street.getPath()).toBe("Home_Address_Street");
    });

    test("builds filters the service can read", () => {
      expect(qMember.address.props.city.eq("Berlin").toString()).toBe("Address_City eq 'Berlin'");
      expect(qMember.home.props.address.props.city.eq("Berlin").toString()).toBe("Home_Address_City eq 'Berlin'");
    });

    test("leaves the surrounding entity's own paths alone", () => {
      expect(qMember.name.getPath()).toBe("Name");
    });
  });

  describe("convertFromOData", () => {
    test("assembles a flat response into the nested model", () => {
      expect(
        qMember.convertFromOData({ Id: 1, Name: "Bob", Address_Street: "Main St", Address_City: "Berlin" }),
      ).toStrictEqual({
        id: 1,
        name: "Bob",
        address: { street: "Main St", city: "Berlin" },
      });
    });

    test("assembles nested groups", () => {
      expect(qMember.convertFromOData({ Home_Label: "at home", Home_Address_City: "Berlin" })).toStrictEqual({
        home: { label: "at home", address: { city: "Berlin" } },
      });
    });

    test("states only the leaves the service actually sent", () => {
      expect(qMember.convertFromOData({ Address_City: "Berlin" })).toStrictEqual({ address: { city: "Berlin" } });
    });

    test("passes unknown keys through, as it does for any other property", () => {
      expect(qMember.convertFromOData({ Address_Unknown: "?", Whatever: 1 })).toStrictEqual({
        address: { Unknown: "?" },
        Whatever: 1,
      });
    });

    test("handles a collection of models", () => {
      expect(qMember.convertFromOData([{ Address_City: "Berlin" }, { Address_City: "Rome" }])).toStrictEqual([
        { address: { city: "Berlin" } },
        { address: { city: "Rome" } },
      ]);
    });
  });

  describe("convertToOData", () => {
    test("spreads the nested model back into flat properties", () => {
      expect(qMember.convertToOData({ id: 1, address: { street: "Main St", city: "Berlin" } } as any)).toStrictEqual({
        Id: 1,
        Address_Street: "Main St",
        Address_City: "Berlin",
      });
    });

    test("sends only the leaves the user set", () => {
      expect(qMember.convertToOData({ address: { city: "Berlin" } } as any)).toStrictEqual({ Address_City: "Berlin" });
    });

    test("spreads nested groups", () => {
      expect(qMember.convertToOData({ home: { address: { city: "Berlin" } } } as any)).toStrictEqual({
        Home_Address_City: "Berlin",
      });
    });

    test("clears the property by nulling every leaf it owns", () => {
      // the property has no representation of its own on the wire, so there is nothing else to null
      expect(qMember.convertToOData({ address: null } as any)).toStrictEqual({
        Address_Street: null,
        Address_City: null,
      });
    });

    test("nulls the leaves of a nested group as well", () => {
      expect(qMember.convertToOData({ home: null } as any)).toStrictEqual({
        Home_Label: null,
        Home_Address_Street: null,
        Home_Address_City: null,
      });
    });
  });

  test("round trips a model through both directions", () => {
    const userModel = { id: 1, name: "Bob", address: { street: "Main St", city: "Berlin" } };
    const payload = qMember.convertToOData(userModel as any);

    expect(payload).toStrictEqual({ Id: 1, Name: "Bob", Address_Street: "Main St", Address_City: "Berlin" });
    expect(qMember.convertFromOData(payload)).toStrictEqual(userModel);
  });
});
