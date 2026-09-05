import { ODataTypesV4 } from "@odata2ts/odata-core";
import { beforeEach, describe, expect, test } from "vitest";
import { digest } from "../../../src/data-model/DataModelDigestionV4.js";
import { NamingHelper } from "../../../src/data-model/NamingHelper.js";
import { getTestConfig } from "../../test.config.js";
import { ODataModelBuilderV4 } from "../builder/v4/ODataModelBuilderV4.js";

describe("V4: navigation property digestion (Partner, ReferentialConstraint)", () => {
  const SERVICE_NAME = "Test";
  const CONFIG = getTestConfig();
  const NAMING_HELPER = new NamingHelper(CONFIG, SERVICE_NAME);

  let odataBuilder: ODataModelBuilderV4;

  function withNs(name: string) {
    return `${SERVICE_NAME}.${name}`;
  }

  function doDigest() {
    return digest(odataBuilder.getSchemas(), CONFIG, NAMING_HELPER);
  }

  beforeEach(() => {
    odataBuilder = new ODataModelBuilderV4(SERVICE_NAME);

    // Medium 1--n Copy: Copy carries the foreign key back to Medium via a composite-key style
    // ReferentialConstraint (two properties, so source order is actually observable), Medium's collection
    // end carries only the Partner.
    odataBuilder
      .addEntityType("Medium", undefined, (builder) => {
        builder
          .addKeyProp("Id", ODataTypesV4.String)
          .addNavProp("Copies", `Collection(${withNs("Copy")})`, "Medium")
          .addNavProp("Reservations", `Collection(${withNs("Reservation")})`);
      })
      .addEntityType("Copy", undefined, (builder) => {
        builder
          .addKeyProp("MediumId", ODataTypesV4.String)
          .addKeyProp("InventoryNumber", ODataTypesV4.String)
          .addNavProp("medium", withNs("Medium"), "Copies", undefined, undefined, [
            { property: "MediumId", referencedProperty: "Id" },
          ])
          .addNavProp("location", withNs("Location"));
      })
      .addEntityType("Reservation", undefined, (builder) => {
        builder
          .addKeyProp("Id", ODataTypesV4.String)
          .addProp("Copy_MediumId", ODataTypesV4.String)
          .addProp("Copy_InventoryNumber", ODataTypesV4.String)
          .addNavProp("copy", withNs("Copy"), undefined, undefined, undefined, [
            { property: "Copy_MediumId", referencedProperty: "MediumId" },
            { property: "Copy_InventoryNumber", referencedProperty: "InventoryNumber" },
          ]);
      })
      .addEntityType("Location", undefined, (builder) => {
        builder.addKeyProp("Id", ODataTypesV4.String);
      });
  });

  test("Partner reaches the property model", async () => {
    const result = await doDigest();
    const copies = result.getEntityType(withNs("Medium"))!.props.find((p) => p.odataName === "Copies");

    expect(copies!.partner).toBe("Medium");
  });

  test("a navigation property without Partner has none", async () => {
    const result = await doDigest();
    const reservations = result.getEntityType(withNs("Medium"))!.props.find((p) => p.odataName === "Reservations");

    expect(reservations!.partner).toBeUndefined();
  });

  test("ReferentialConstraint reaches the property model", async () => {
    const result = await doDigest();
    const medium = result.getEntityType(withNs("Copy"))!.props.find((p) => p.odataName === "medium");

    expect(medium!.referentialConstraints).toEqual([{ property: "MediumId", referencedProperty: "Id" }]);
  });

  test("several ReferentialConstraints are all carried, in source order", async () => {
    const result = await doDigest();
    const copy = result.getEntityType(withNs("Reservation"))!.props.find((p) => p.odataName === "copy");

    expect(copy!.referentialConstraints).toEqual([
      { property: "Copy_MediumId", referencedProperty: "MediumId" },
      { property: "Copy_InventoryNumber", referencedProperty: "InventoryNumber" },
    ]);
  });

  test("a navigation property without a constraint has none", async () => {
    const result = await doDigest();
    const location = result.getEntityType(withNs("Copy"))!.props.find((p) => p.odataName === "location");

    expect(location!.referentialConstraints).toBeUndefined();
  });
});
