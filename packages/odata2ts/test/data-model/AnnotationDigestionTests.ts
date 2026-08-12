import { ODataTypesV4 } from "@odata2ts/odata-core";
import deepmerge from "deepmerge";
import { beforeEach, expect, test } from "vitest";
import { NamingHelper } from "../../src/data-model/NamingHelper.js";
import { DigesterFunction, DigestionOptions } from "../../src/FactoryFunctionModel.js";
import { ManagedPropertyDetection, ManagedState, TypeModel } from "../../src/index.js";
import { TestSettings } from "../generator/TestTypes.js";
import { getTestConfig } from "../test.config.js";
import { core, corePermissions } from "./builder/ODataAnnotationBuilder.js";
import { ODataModelBuilder } from "./builder/ODataModelBuilder.js";
import { ModelBuilderConstructor } from "./DataModelDigestionTests.js";

/**
 * The evaluation of the `Org.OData.Core.V1` terms which state how a property is managed by the server.
 *
 * Both OData versions run these: a V2 service states annotations just like a V4 one does - CAP's V2
 * rendition carries the very same `<Annotations>` blocks its V4 endpoint does.
 */
export function createAnnotationTests(
  ODataBuilderConstructor: ModelBuilderConstructor<any>,
  digest: DigesterFunction<any>,
) {
  const SERVICE_NAME = "Tester";
  const ENTITY_NAME = "Book";
  const TEST_CONFIG = getTestConfig();

  let odataBuilder: ODataModelBuilder<any, any, any, any>;
  let digestionOptions: Partial<DigestionOptions>;

  function withNs(name: string) {
    return `${SERVICE_NAME}.${name}`;
  }

  async function doDigest() {
    const opts = deepmerge(TEST_CONFIG, digestionOptions) as TestSettings;
    return await digest(
      odataBuilder.getSchemas(),
      opts,
      new NamingHelper(opts, SERVICE_NAME),
      odataBuilder.getReferences(),
    );
  }

  /**
   * The state the digester derived for a property of the test entity.
   */
  async function managedStateOf(propName: string) {
    const result = await doDigest();
    const model = result.getEntityType(withNs(ENTITY_NAME))!;
    const prop = [...model.baseProps, ...model.props].find((p) => p.odataName === propName);
    expect(prop, `property [${propName}] not found!`).toBeTruthy();
    return prop!.managed;
  }

  beforeEach(() => {
    odataBuilder = new ODataBuilderConstructor(SERVICE_NAME);
    digestionOptions = {};
  });

  test("no annotations at all", async () => {
    odataBuilder.addEntityType(ENTITY_NAME, undefined, (builder: any) =>
      builder.addKeyProp("Id", ODataTypesV4.Guid).addProp("Title", ODataTypesV4.String, false),
    );

    expect(await managedStateOf("Title")).toBeUndefined();
    // the single key falls to the heuristic, which the default lets through
    expect(await managedStateOf("Id")).toBe(ManagedState.readOnly);
  });

  test("Computed: inline, with alias", async () => {
    odataBuilder.enableAnnotations().addEntityType(ENTITY_NAME, undefined, (builder: any) =>
      builder
        .addKeyProp("Id", ODataTypesV4.Guid)
        .addProp("PopularityScore", ODataTypesV4.Double)
        .addPropAnnotations("PopularityScore", [core("Computed", { bool: true })]),
    );

    expect(await managedStateOf("PopularityScore")).toBe(ManagedState.readOnly);
  });

  test("Computed: fully qualified, without declaring the vocabulary", async () => {
    // how ASP.NET states it: no edmx:Reference in sight, every term spelled out
    odataBuilder.addEntityType(ENTITY_NAME, undefined, (builder: any) =>
      builder
        .addKeyProp("Id", ODataTypesV4.Guid)
        .addProp("PopularityScore", ODataTypesV4.Double)
        .addPropAnnotations("PopularityScore", [core("Computed", { bool: true, fullyQualified: true })]),
    );

    expect(await managedStateOf("PopularityScore")).toBe(ManagedState.readOnly);
  });

  test("Computed: stated externally", async () => {
    // how CAP states it: an <Annotations> block naming its target by path
    odataBuilder
      .enableAnnotations()
      .addEntityType(ENTITY_NAME, undefined, (builder: any) =>
        builder.addKeyProp("Id", ODataTypesV4.Guid).addProp("PopularityScore", ODataTypesV4.Double),
      )
      .addCoreAnnotations(`${withNs(ENTITY_NAME)}/PopularityScore`, [core("Computed", { bool: true })]);

    expect(await managedStateOf("PopularityScore")).toBe(ManagedState.readOnly);
  });

  test("Computed: an unknown alias never matches", async () => {
    odataBuilder.addEntityType(ENTITY_NAME, undefined, (builder: any) =>
      builder
        .addKeyProp("Id", ODataTypesV4.Guid)
        .addProp("PopularityScore", ODataTypesV4.Double)
        // the alias is only meaningful where the document declares it, which this one doesn't
        .addPropAnnotations("PopularityScore", [core("Computed", { bool: true })]),
    );

    expect(await managedStateOf("PopularityScore")).toBeUndefined();
  });

  test("Computed: stating the tag without a value means true", async () => {
    odataBuilder.enableAnnotations().addEntityType(ENTITY_NAME, undefined, (builder: any) =>
      builder
        .addKeyProp("Id", ODataTypesV4.Guid)
        .addProp("PopularityScore", ODataTypesV4.Double)
        .addPropAnnotations("PopularityScore", [core("Computed")]),
    );

    expect(await managedStateOf("PopularityScore")).toBe(ManagedState.readOnly);
  });

  test("Computed: an explicit false says nothing", async () => {
    odataBuilder.enableAnnotations().addEntityType(ENTITY_NAME, undefined, (builder: any) =>
      builder
        .addKeyProp("Id", ODataTypesV4.Guid)
        .addProp("PopularityScore", ODataTypesV4.Double)
        .addPropAnnotations("PopularityScore", [core("Computed", { bool: false })]),
    );

    expect(await managedStateOf("PopularityScore")).toBeUndefined();
  });

  test("a qualified annotation applies to a context we know nothing about", async () => {
    odataBuilder.enableAnnotations().addEntityType(ENTITY_NAME, undefined, (builder: any) =>
      builder
        .addKeyProp("Id", ODataTypesV4.Guid)
        .addProp("PopularityScore", ODataTypesV4.Double)
        .addPropAnnotations("PopularityScore", [core("Computed", { bool: true, qualifier: "Draft" })]),
    );

    expect(await managedStateOf("PopularityScore")).toBeUndefined();
  });

  test("a dynamic expression only resolves per request", async () => {
    odataBuilder.enableAnnotations().addEntityType(ENTITY_NAME, undefined, (builder: any) =>
      builder
        .addKeyProp("Id", ODataTypesV4.Guid)
        .addProp("PopularityScore", ODataTypesV4.Double)
        // <Annotation Term="Core.Computed"><Path>IsLocked</Path></Annotation>
        .addPropAnnotations("PopularityScore", [{ ...core("Computed"), Path: ["IsLocked"] } as any]),
    );

    expect(await managedStateOf("PopularityScore")).toBeUndefined();
  });

  test("ComputedDefaultValue: editable, but never required", async () => {
    odataBuilder.enableAnnotations().addEntityType(ENTITY_NAME, undefined, (builder: any) =>
      builder
        .addKeyProp("Id", ODataTypesV4.Guid)
        .addProp("CreatedAt", ODataTypesV4.DateTimeOffset, false)
        .addPropAnnotations("CreatedAt", [core("ComputedDefaultValue", { bool: true })]),
    );

    expect(await managedStateOf("CreatedAt")).toBe(ManagedState.optionalWithDefault);
  });

  test("Immutable: settable on create only", async () => {
    odataBuilder.enableAnnotations().addEntityType(ENTITY_NAME, undefined, (builder: any) =>
      builder
        .addKeyProp("Id", ODataTypesV4.Guid)
        .addProp("IsbnCode", ODataTypesV4.String, false)
        .addPropAnnotations("IsbnCode", [core("Immutable", { bool: true })]),
    );

    expect(await managedStateOf("IsbnCode")).toBe(ManagedState.createOnly);
  });

  test("Immutable: says nothing about a key, which is unchangeable anyway", async () => {
    digestionOptions = { managedPropertyDetection: ManagedPropertyDetection.annotation };
    odataBuilder
      .enableAnnotations()
      .addEntityType(ENTITY_NAME, undefined, (builder: any) =>
        builder.addKeyProp("Id", ODataTypesV4.Guid).addPropAnnotations("Id", [core("Immutable", { bool: true })]),
      );

    expect(await managedStateOf("Id")).toBeUndefined();
  });

  test("Permissions: read only", async () => {
    odataBuilder.enableAnnotations().addEntityType(ENTITY_NAME, undefined, (builder: any) =>
      builder
        .addKeyProp("Id", ODataTypesV4.Guid)
        .addProp("Concurrency", ODataTypesV4.Int64, false)
        .addPropAnnotations("Concurrency", [corePermissions(["Read"])]),
    );

    expect(await managedStateOf("Concurrency")).toBe(ManagedState.readOnly);
  });

  test("Permissions: as a child element, the way Trippin states it", async () => {
    odataBuilder.enableAnnotations().addEntityType(ENTITY_NAME, undefined, (builder: any) =>
      builder
        .addKeyProp("Id", ODataTypesV4.Guid)
        .addProp("Concurrency", ODataTypesV4.Int64, false)
        .addPropAnnotations("Concurrency", [corePermissions(["Read"], { asChildElement: true, fullyQualified: true })]),
    );

    expect(await managedStateOf("Concurrency")).toBe(ManagedState.readOnly);
  });

  test("Permissions: write only", async () => {
    odataBuilder.enableAnnotations().addEntityType(ENTITY_NAME, undefined, (builder: any) =>
      builder
        .addKeyProp("Id", ODataTypesV4.Guid)
        .addProp("Secret", ODataTypesV4.String)
        .addPropAnnotations("Secret", [corePermissions(["Write"])]),
    );

    expect(await managedStateOf("Secret")).toBe(ManagedState.writeOnly);
  });

  test("Permissions: granting both takes nothing away", async () => {
    odataBuilder.enableAnnotations().addEntityType(ENTITY_NAME, undefined, (builder: any) =>
      builder
        .addKeyProp("Id", ODataTypesV4.Guid)
        .addProp("Title", ODataTypesV4.String)
        .addPropAnnotations("Title", [corePermissions(["Read", "Write"])]),
    );

    expect(await managedStateOf("Title")).toBeUndefined();
  });

  test("the term taking most away from the client wins", async () => {
    odataBuilder.enableAnnotations().addEntityType(ENTITY_NAME, undefined, (builder: any) =>
      builder
        .addKeyProp("Id", ODataTypesV4.Guid)
        .addProp("Title", ODataTypesV4.String)
        .addPropAnnotations("Title", [
          core("ComputedDefaultValue", { bool: true }),
          core("Immutable", { bool: true }),
          core("Computed", { bool: true }),
        ]),
    );

    expect(await managedStateOf("Title")).toBe(ManagedState.readOnly);
  });

  test("configuration beats the annotation", async () => {
    digestionOptions = {
      propertiesByName: [{ name: "PopularityScore", managed: false }],
    };
    odataBuilder.enableAnnotations().addEntityType(ENTITY_NAME, undefined, (builder: any) =>
      builder
        .addKeyProp("Id", ODataTypesV4.Guid)
        .addProp("PopularityScore", ODataTypesV4.Double)
        .addPropAnnotations("PopularityScore", [core("Computed", { bool: true })]),
    );

    expect(await managedStateOf("PopularityScore")).toBe(ManagedState.off);
  });

  test("configuration states a state of its own", async () => {
    digestionOptions = {
      byTypeAndName: [
        {
          type: TypeModel.EntityType,
          name: withNs(ENTITY_NAME),
          properties: [{ name: "IsbnCode", managed: ManagedState.createOnly }],
        },
      ],
    };
    odataBuilder.addEntityType(ENTITY_NAME, undefined, (builder: any) =>
      builder.addKeyProp("Id", ODataTypesV4.Guid).addProp("IsbnCode", ODataTypesV4.String),
    );

    expect(await managedStateOf("IsbnCode")).toBe(ManagedState.createOnly);
  });

  test("configuration keeps a key editable", async () => {
    digestionOptions = { propertiesByName: [{ name: "Id", managed: false }] };
    odataBuilder.addEntityType(ENTITY_NAME, undefined, (builder: any) => builder.addKeyProp("Id", ODataTypesV4.Guid));

    expect(await managedStateOf("Id")).toBe(ManagedState.off);
  });

  test("annotations reach an inherited property", async () => {
    odataBuilder
      .enableAnnotations()
      .addEntityType("Medium", { abstract: true }, (builder: any) =>
        builder
          .addKeyProp("Id", ODataTypesV4.Guid)
          .addProp("PopularityScore", ODataTypesV4.Double)
          .addPropAnnotations("PopularityScore", [core("Computed", { bool: true })]),
      )
      .addEntityType(ENTITY_NAME, { baseType: withNs("Medium") }, (builder: any) =>
        builder.addProp("PageCount", ODataTypesV4.Int16),
      );

    // the state has to survive being cloned onto the subtype
    expect(await managedStateOf("PopularityScore")).toBe(ManagedState.readOnly);
  });

  describeDetection();

  function describeDetection() {
    /**
     * A single key and one ordinary property, each optionally annotated: the key with a term that says the
     * client may well supply it, the other one with a term that takes it away.
     */
    function buildModel(annotated: boolean) {
      odataBuilder.enableAnnotations().addEntityType(ENTITY_NAME, undefined, (builder: any) => {
        builder.addKeyProp("Id", ODataTypesV4.Guid).addProp("PopularityScore", ODataTypesV4.Double);
        if (annotated) {
          builder
            .addPropAnnotations("Id", [core("ComputedDefaultValue", { bool: true })])
            .addPropAnnotations("PopularityScore", [core("Computed", { bool: true })]);
        }
        return builder;
      });
    }

    test("auto: the annotation has the final word on a key", async () => {
      digestionOptions = { managedPropertyDetection: ManagedPropertyDetection.auto };
      buildModel(true);

      expect(await managedStateOf("Id")).toBe(ManagedState.optionalWithDefault);
      expect(await managedStateOf("PopularityScore")).toBe(ManagedState.readOnly);
    });

    test("auto: the heuristic fills the silence", async () => {
      digestionOptions = { managedPropertyDetection: ManagedPropertyDetection.auto };
      buildModel(false);

      expect(await managedStateOf("Id")).toBe(ManagedState.readOnly);
      expect(await managedStateOf("PopularityScore")).toBeUndefined();
    });

    test("annotation: no heuristic to fall back on", async () => {
      digestionOptions = { managedPropertyDetection: ManagedPropertyDetection.annotation };
      buildModel(false);

      expect(await managedStateOf("Id")).toBeUndefined();
      expect(await managedStateOf("PopularityScore")).toBeUndefined();
    });

    test("simpleHeuristic: annotations are ignored, whatever they state", async () => {
      digestionOptions = { managedPropertyDetection: ManagedPropertyDetection.simpleHeuristic };
      buildModel(true);

      // the heuristic knows nothing but keys, so the annotated non-key prop stays fully editable
      expect(await managedStateOf("Id")).toBe(ManagedState.readOnly);
      expect(await managedStateOf("PopularityScore")).toBeUndefined();
    });

    test("none: nothing is derived at all", async () => {
      digestionOptions = { managedPropertyDetection: ManagedPropertyDetection.none };
      buildModel(true);

      expect(await managedStateOf("Id")).toBeUndefined();
      expect(await managedStateOf("PopularityScore")).toBeUndefined();
    });

    test("none: only the configuration is left", async () => {
      digestionOptions = {
        managedPropertyDetection: ManagedPropertyDetection.none,
        propertiesByName: [{ name: "PopularityScore", managed: true }],
      };
      buildModel(true);

      expect(await managedStateOf("PopularityScore")).toBe(ManagedState.readOnly);
    });

    test("a composite key is never managed by the heuristic", async () => {
      digestionOptions = { managedPropertyDetection: ManagedPropertyDetection.auto };
      odataBuilder.addEntityType(ENTITY_NAME, undefined, (builder: any) =>
        builder.addKeyProp("Id", ODataTypesV4.Guid).addKeyProp("Edition", ODataTypesV4.Int16),
      );

      expect(await managedStateOf("Id")).toBeUndefined();
      expect(await managedStateOf("Edition")).toBeUndefined();
    });
  }
}
