import { ODataTypesV2 } from "@odata2ts/odata-core";
import { beforeEach, describe, expect, test } from "vitest";
import { digest } from "../../../src/data-model/DataModelDigestionV2.js";
import { NamingHelper } from "../../../src/data-model/NamingHelper.js";
import { getTestConfig } from "../../test.config.js";
import { ODataModelBuilderV2 } from "../builder/v2/ODataModelBuilderV2.js";

describe("V2: navigation property digestion (partner, referential constraint)", () => {
  const SERVICE_NAME = "Test";
  const CONFIG = getTestConfig();
  const NAMING_HELPER = new NamingHelper(CONFIG, SERVICE_NAME);

  let odataBuilder: ODataModelBuilderV2;

  function withNs(name: string) {
    return `${SERVICE_NAME}.${name}`;
  }

  function doDigest() {
    return digest(odataBuilder.getSchemas(), CONFIG, NAMING_HELPER);
  }

  beforeEach(() => {
    odataBuilder = new ODataModelBuilderV2(SERVICE_NAME);

    // Medium 1--n Copy, realized by a single-property ReferentialConstraint stated on the association:
    // Copy carries the foreign key back to Medium, so Copy's own navigation property (pointing at the
    // principal) gets the constraint, while Medium's collection end gets only the Partner.
    odataBuilder
      .addEntityType("Medium", undefined, (builder) => {
        builder
          .addKeyProp("Id", ODataTypesV2.String)
          .addNavProp("Copies", withNs("Copy"), "Medium_Copies", "*", { fromRole: "Medium", toRole: "Copy" });
      })
      .addEntityType("Copy", undefined, (builder) => {
        builder
          .addKeyProp("MediumId", ODataTypesV2.String)
          .addKeyProp("InventoryNumber", ODataTypesV2.String)
          .addNavProp("Medium", withNs("Medium"), "Medium_Copies", "1", { fromRole: "Copy", toRole: "Medium" }, [
            { property: "MediumId", referencedProperty: "Id" },
          ])
          // points at Location, but Location never declares a navigation property back - a legal end
          // that nothing navigates back from
          .addNavProp("Location", withNs("Location"), "Copy_Location", "0..1", {
            fromRole: "Copy",
            toRole: "Location",
          })
          // the principal side of a composite-key constraint (see Reservation below): Copy itself
          // carries no constraint, only Reservation does
          .addNavProp("Reservations", withNs("Reservation"), "Reservation_Copy", "*", {
            fromRole: "Copy",
            toRole: "Reservation",
          });
      })
      .addEntityType("Location", undefined, (builder) => {
        builder.addKeyProp("Id", ODataTypesV2.String);
      })
      .addEntityType("Reservation", undefined, (builder) => {
        builder
          .addKeyProp("Id", ODataTypesV2.String)
          .addProp("Copy_MediumId", ODataTypesV2.String)
          .addProp("Copy_InventoryNumber", ODataTypesV2.String)
          .addNavProp("copy", withNs("Copy"), "Reservation_Copy", "1", { fromRole: "Reservation", toRole: "Copy" }, [
            { property: "Copy_MediumId", referencedProperty: "MediumId" },
            { property: "Copy_InventoryNumber", referencedProperty: "InventoryNumber" },
          ]);
      })
      // Member 1--n Loan, with no ReferentialConstraint on the association at all
      .addEntityType("Member", undefined, (builder) => {
        builder.addKeyProp("Id", ODataTypesV2.String).addNavProp("Loans", withNs("Loan"), "Member_Loans", "*", {
          fromRole: "Member",
          toRole: "Loan",
        });
      })
      .addEntityType("Loan", undefined, (builder) => {
        builder
          .addKeyProp("Id", ODataTypesV2.String)
          .addNavProp("Member", withNs("Member"), "Member_Loans", "1", { fromRole: "Loan", toRole: "Member" });
      });
  });

  test("the inverse navigation property is derived from the association's other end", async () => {
    const result = await doDigest();
    const copies = result.getEntityType(withNs("Medium"))!.props.find((p) => p.odataName === "Copies");
    const medium = result.getEntityType(withNs("Copy"))!.props.find((p) => p.odataName === "Medium");

    expect(copies!.partner).toBe("Medium");
    expect(medium!.partner).toBe("Copies");
  });

  test("no inverse navigation property means no partner", async () => {
    const result = await doDigest();
    const orphan = result.getEntityType(withNs("Copy"))!.props.find((p) => p.odataName === "Location");

    expect(orphan!.partner).toBeUndefined();
  });

  test("the constraint is carried on the dependent side's navigation property", async () => {
    const result = await doDigest();
    const medium = result.getEntityType(withNs("Copy"))!.props.find((p) => p.odataName === "Medium");

    expect(medium!.referentialConstraints).toEqual([{ property: "MediumId", referencedProperty: "Id" }]);
  });

  test("the principal side's navigation property carries no constraint", async () => {
    const result = await doDigest();
    const copies = result.getEntityType(withNs("Medium"))!.props.find((p) => p.odataName === "Copies");

    expect(copies!.referentialConstraints).toBeUndefined();
  });

  test("a composite-key constraint is carried in source order, on the dependent side only", async () => {
    const result = await doDigest();
    const copy = result.getEntityType(withNs("Reservation"))!.props.find((p) => p.odataName === "copy");
    const reservations = result.getEntityType(withNs("Copy"))!.props.find((p) => p.odataName === "Reservations");

    expect(copy!.referentialConstraints).toEqual([
      { property: "Copy_MediumId", referencedProperty: "MediumId" },
      { property: "Copy_InventoryNumber", referencedProperty: "InventoryNumber" },
    ]);
    expect(reservations!.referentialConstraints).toBeUndefined();
  });

  test("an association without a constraint yields none on either side", async () => {
    const result = await doDigest();
    const loans = result.getEntityType(withNs("Member"))!.props.find((p) => p.odataName === "Loans");
    const member = result.getEntityType(withNs("Loan"))!.props.find((p) => p.odataName === "Member");

    expect(loans!.referentialConstraints).toBeUndefined();
    expect(member!.referentialConstraints).toBeUndefined();
  });
});
