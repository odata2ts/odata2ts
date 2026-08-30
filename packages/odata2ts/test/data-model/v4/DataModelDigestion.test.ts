import { describe, expect, test } from "vitest";
import { digest } from "../../../src/data-model/DataModelDigestionV4.js";
import { ODataVersion } from "../../../src/data-model/DataTypeModel.js";
import { NamingHelper } from "../../../src/data-model/NamingHelper.js";
import { getTestConfig } from "../../test.config.js";
import { alternateKeys } from "../builder/ODataAnnotationBuilder.js";
import { ODataModelBuilderV4 } from "../builder/v4/ODataModelBuilderV4.js";
import { createDataModelTests } from "../DataModelDigestionTests.js";

describe("DataModelDigestion Test", () => {
  createDataModelTests(ODataVersion.V4, ODataModelBuilderV4, digest);

  test("Alternate keys: a subtype without a key of its own generates its own id rather than polluting the ancestor's", async () => {
    // PrintMedium inherits its key from Medium and would otherwise never generate an id of its own - but
    // its alternate key must not be folded into Medium's shared id, since Medium's *other* subtypes (not
    // modelled here, but real ones like Magazine/EBook) have no ISBN at all. Book, in turn, has neither a
    // key nor an alternate key of its own, and must redirect past PrintMedium's now-own id rather than
    // skip straight to Medium's.
    const SERVICE_NAME = "AlternateKeyInheritanceTest";
    const withNs = (name: string) => `${SERVICE_NAME}.${name}`;

    const odataBuilder = new ODataModelBuilderV4(SERVICE_NAME);
    odataBuilder
      .enableAnnotations()
      .addEntityType("Medium", undefined, (builder) => {
        builder.addKeyProp("Id", "Edm.String");
      })
      .addEntityType("PrintMedium", { baseType: withNs("Medium") }, (builder) => {
        builder.addProp("ISBN", "Edm.String");
        builder.addTypeAnnotations([alternateKeys([[{ name: "ISBN" }]], { fullyQualified: true })]);
      })
      .addEntityType("Book", { baseType: withNs("PrintMedium") }, (builder) => {
        builder.addProp("PageCount", "Edm.Int32");
      });

    const config = getTestConfig();
    const namingHelper = new NamingHelper(config, SERVICE_NAME);
    const result = await digest(odataBuilder.getSchemas(), config, namingHelper, odataBuilder.getReferences());

    const medium = result.getEntityType(withNs("Medium"))!;
    const printMedium = result.getEntityType(withNs("PrintMedium"))!;
    const book = result.getEntityType(withNs("Book"))!;

    // Medium is untouched: still the plain key, no alternate keys leaked in from its subtype
    expect(medium.generateId).toBe(true);
    expect(medium.id.fqName).toBe(withNs("Medium"));
    expect(medium.alternateKeys).toEqual([]);

    // PrintMedium now generates its own id, carrying both its inherited primary key and its own
    // alternate key
    expect(printMedium.generateId).toBe(true);
    expect(printMedium.id.fqName).toBe(withNs("PrintMedium"));
    expect(printMedium.id.modelName).toBe("PrintMediumId");
    expect(printMedium.id.qName).toBe("QPrintMediumId");
    expect(printMedium.keys.map((k) => k.odataName)).toEqual(["Id"]);
    expect(printMedium.alternateKeys).toHaveLength(1);
    expect(printMedium.alternateKeys[0].map((r) => r.property.odataName)).toEqual(["ISBN"]);

    // Book has neither a key nor an alternate key of its own, and now shares PrintMedium's id rather
    // than Medium's
    expect(book.generateId).toBe(false);
    expect(book.id.fqName).toBe(withNs("PrintMedium"));
    expect(book.id.modelName).toBe("PrintMediumId");
    expect(book.alternateKeys).toEqual([]);
  });
});
