import { describe, expect, test } from "vitest";
import { ComplexTypeUnflattener } from "../../src/data-model/ComplexTypeUnflattener.js";
import { ComplexType, EntityType, Property, Schema } from "../../src/data-model/edmx/ODataEdmxModelBase.js";

const NS = "Test";

function prop(name: string, type = "Edm.String", nullable?: "true" | "false"): Property {
  return { $: { Name: name, Type: type, ...(nullable ? { Nullable: nullable } : {}) } };
}

function entity(name: string, props: Array<Property>, keys: Array<string> = []): EntityType {
  return { $: { Name: name }, Key: [{ PropertyRef: keys.map((k) => ({ $: { Name: k } })) }], Property: props };
}

function complex(name: string, props: Array<Property>): ComplexType {
  return { $: { Name: name }, Property: props };
}

interface ShapeSetup {
  entityTypes?: Array<EntityType>;
  complexTypes?: Array<ComplexType>;
  /** navigation property names per entity type name */
  navProps?: Record<string, Array<string>>;
}

/**
 * Runs the shaper over one schema and hands back that schema, mutated in place - which is how the digester
 * uses it.
 */
function shape({ entityTypes = [], complexTypes = [], navProps = {} }: ShapeSetup) {
  const schema: Schema<EntityType, ComplexType> = {
    $: { Namespace: NS, xmlns: "" },
    EntityType: entityTypes,
    ComplexType: complexTypes,
  };

  new ComplexTypeUnflattener([schema], (model) => navProps[model.$.Name] ?? []).unflatten();

  return schema;
}

function propsOf(schema: Schema<EntityType, ComplexType>, entityName: string) {
  return schema.EntityType!.find((et) => et.$.Name === entityName)!.Property.map((p) => `${p.$.Name}:${p.$.Type}`);
}

const ADDRESS_PROPS = [prop("Street"), prop("City"), prop("PostalCode")];
const FLAT_ADDRESS = [prop("Address_Street"), prop("Address_City"), prop("Address_PostalCode")];

describe("ComplexTypeUnflattener", () => {
  test("groups flat props into the complex type the service already declares", () => {
    const schema = shape({
      entityTypes: [entity("Member", [prop("Id", "Edm.Int32"), ...FLAT_ADDRESS])],
      complexTypes: [complex("PostalAddress", ADDRESS_PROPS)],
    });

    expect(propsOf(schema, "Member")).toStrictEqual(["Id:Edm.Int32", `Address:${NS}.PostalAddress`]);
    // no type is invented where one already fits
    expect(schema.ComplexType).toHaveLength(1);
  });

  test("puts the group where its first member was, keeping the declaration order", () => {
    const schema = shape({
      entityTypes: [entity("Member", [prop("Id", "Edm.Int32"), ...FLAT_ADDRESS, prop("Balance", "Edm.Decimal")])],
      complexTypes: [complex("PostalAddress", ADDRESS_PROPS)],
    });

    expect(propsOf(schema, "Member")).toStrictEqual([
      "Id:Edm.Int32",
      `Address:${NS}.PostalAddress`,
      "Balance:Edm.Decimal",
    ]);
  });

  test("is only non-nullable where every leaf is", () => {
    const schema = shape({
      entityTypes: [
        entity("A", [prop("X_One", "Edm.String", "false"), prop("X_Two", "Edm.String", "false")]),
        entity("B", [prop("X_One", "Edm.String", "false"), prop("X_Two", "Edm.String", "true")]),
      ],
    });

    const nullableOf = (name: string) => schema.EntityType!.find((et) => et.$.Name === name)!.Property[0].$.Nullable;
    expect(nullableOf("A")).toBe("false");
    expect(nullableOf("B")).toBe("true");
  });

  test("synthesizes a complex type where the service declares none that matches", () => {
    const schema = shape({
      entityTypes: [entity("Member", [prop("Id", "Edm.Int32"), ...FLAT_ADDRESS])],
      // same names, but one type differs - anything less than an exact match would mistype the property
      complexTypes: [complex("PostalAddress", [prop("Street"), prop("City"), prop("PostalCode", "Edm.Int32")])],
    });

    expect(propsOf(schema, "Member")).toStrictEqual(["Id:Edm.Int32", `Address:${NS}.Member_Address`]);
    const synthesized = schema.ComplexType!.find((ct) => ct.$.Name === "Member_Address");
    expect(synthesized?.Property.map((p) => p.$.Name)).toStrictEqual(["Street", "City", "PostalCode"]);
  });

  test("does not match a complex type which has props the group has not", () => {
    const schema = shape({
      entityTypes: [entity("Member", FLAT_ADDRESS)],
      complexTypes: [complex("PostalAddress", [...ADDRESS_PROPS, prop("Country")])],
    });

    expect(propsOf(schema, "Member")).toStrictEqual([`Address:${NS}.Member_Address`]);
  });

  test("prefers the structurally identical complex type which is named after the group", () => {
    const schema = shape({
      entityTypes: [entity("Loan", [prop("Period_From", "Edm.Date"), prop("Period_To", "Edm.Date")])],
      complexTypes: [
        complex("Timespan", [prop("From", "Edm.Date"), prop("To", "Edm.Date")]),
        complex("DatePeriod", [prop("From", "Edm.Date"), prop("To", "Edm.Date")]),
      ],
    });

    expect(propsOf(schema, "Loan")).toStrictEqual([`Period:${NS}.DatePeriod`]);
  });

  describe("leaves alone what only looks like a flattened complex type", () => {
    test("a lone Id, which is a foreign key - even where no navigation property gives it away", () => {
      const schema = shape({
        entityTypes: [entity("Book", [prop("Id", "Edm.Int32"), prop("Publisher_Id", "Edm.Int32")])],
      });

      expect(propsOf(schema, "Book")).toStrictEqual(["Id:Edm.Int32", "Publisher_Id:Edm.Int32"]);
    });

    test("a composite foreign key, which looks like a struct of two fields", () => {
      const schema = shape({
        entityTypes: [entity("Loan", [prop("Copy_MediumId", "Edm.Guid"), prop("Copy_InventoryNumber", "Edm.Int32")])],
        // neither leaf is a lone `Id`, so only the navigation property tells this one apart
        navProps: { Loan: ["Copy"] },
      });

      expect(propsOf(schema, "Loan")).toStrictEqual(["Copy_MediumId:Edm.Guid", "Copy_InventoryNumber:Edm.Int32"]);
    });

    test("a group named like a navigation property, even without a constraint", () => {
      const schema = shape({
        entityTypes: [entity("Book", [prop("Publisher_Id", "Edm.Int32")])],
        navProps: { Book: ["Publisher"] },
      });

      expect(propsOf(schema, "Book")).toStrictEqual(["Publisher_Id:Edm.Int32"]);
    });

    test("a foreign key whose group name is not the navigation property name (CAP's up__Id)", () => {
      const schema = shape({
        entityTypes: [entity("Chapter", [prop("up__Id", "Edm.Guid")])],
        // the nav prop is `up_`, so splitting at the separator yields `up` and the name rule misses it -
        // what settles this one is the empty segment between the two underscores
        navProps: { Chapter: ["up_"] },
      });

      expect(propsOf(schema, "Chapter")).toStrictEqual(["up__Id:Edm.Guid"]);
    });

    test("a trailing separator, which yields an empty segment", () => {
      const schema = shape({
        entityTypes: [entity("Copy", [prop("Location_"), prop("Location_Id", "Edm.Int32")])],
      });

      expect(propsOf(schema, "Copy")).toStrictEqual(["Location_:Edm.String", "Location_Id:Edm.Int32"]);
    });

    test("a key property, which every URL of the entity addresses by name", () => {
      const schema = shape({
        entityTypes: [
          entity("Chapter", [prop("Parent_Id", "Edm.Guid"), prop("Parent_Pos", "Edm.Int32")], ["Parent_Id"]),
        ],
      });

      expect(propsOf(schema, "Chapter")).toStrictEqual(["Parent_Id:Edm.Guid", "Parent_Pos:Edm.Int32"]);
    });

    test("a group colliding with a property the service declares under that very name", () => {
      const schema = shape({
        entityTypes: [entity("Member", [prop("Address"), prop("Address_City")])],
      });

      expect(propsOf(schema, "Member")).toStrictEqual(["Address:Edm.String", "Address_City:Edm.String"]);
    });

    test("a name used as both leaf and group, which no structured element produces", () => {
      const schema = shape({
        entityTypes: [entity("Member", [prop("A_B"), prop("A_B_C")])],
      });

      expect(propsOf(schema, "Member")).toStrictEqual(["A_B:Edm.String", "A_B_C:Edm.String"]);
    });

    test("but not an Id which has company: that is a structured element again", () => {
      const schema = shape({
        entityTypes: [entity("Book", [prop("Publisher_Id", "Edm.Int32"), prop("Publisher_Name")])],
      });

      expect(propsOf(schema, "Book")).toStrictEqual([`Publisher:${NS}.Book_Publisher`]);
      const synthesized = schema.ComplexType!.find((ct) => ct.$.Name === "Book_Publisher");
      expect(synthesized?.Property.map((p) => p.$.Name)).toStrictEqual(["Id", "Name"]);
    });

    test("a property without any separator", () => {
      const schema = shape({ entityTypes: [entity("Member", [prop("Name")])] });

      expect(propsOf(schema, "Member")).toStrictEqual(["Name:Edm.String"]);
    });
  });

  describe("nested structured elements", () => {
    test("match a complex type which nests another one", () => {
      const schema = shape({
        entityTypes: [entity("Member", [prop("Home_Label"), prop("Home_Address_Street"), prop("Home_Address_City")])],
        complexTypes: [
          complex("PostalAddress", [prop("Street"), prop("City")]),
          complex("Residence", [prop("Label"), prop("Address", `${NS}.PostalAddress`)]),
        ],
      });

      expect(propsOf(schema, "Member")).toStrictEqual([`Home:${NS}.Residence`]);
    });

    test("are synthesized level by level where nothing matches", () => {
      const schema = shape({
        entityTypes: [entity("Member", [prop("Home_Label"), prop("Home_Address_Street")])],
      });

      expect(propsOf(schema, "Member")).toStrictEqual([`Home:${NS}.Member_Home`]);
      const home = schema.ComplexType!.find((ct) => ct.$.Name === "Member_Home");
      expect(home?.Property.map((p) => `${p.$.Name}:${p.$.Type}`)).toStrictEqual([
        "Label:Edm.String",
        `Address:${NS}.Member_Home_Address`,
      ]);
      const address = schema.ComplexType!.find((ct) => ct.$.Name === "Member_Home_Address");
      expect(address?.Property.map((p) => p.$.Name)).toStrictEqual(["Street"]);
    });
  });

  test("reshapes complex types just as it does entity types", () => {
    const schema = shape({
      complexTypes: [complex("Branch", [prop("Name"), ...FLAT_ADDRESS]), complex("PostalAddress", ADDRESS_PROPS)],
    });

    const branch = schema.ComplexType!.find((ct) => ct.$.Name === "Branch");
    expect(branch?.Property.map((p) => `${p.$.Name}:${p.$.Type}`)).toStrictEqual([
      "Name:Edm.String",
      `Address:${NS}.PostalAddress`,
    ]);
  });
});
