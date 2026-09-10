import { MappedConverterChains } from "@odata2ts/converter-runtime";
import { ODataTypesV2, ODataTypesV4 } from "@odata2ts/odata-core";
import { beforeEach, describe, expect, test } from "vitest";
import { DataModel, NamespaceWithAlias } from "../../src/data-model/DataModel.js";
import { DataTypes, ODataVersion } from "../../src/data-model/DataTypeModel.js";

describe("Data Model Tests", function () {
  let dataModel: DataModel;

  const NS1 = "Test";
  const NS2 = "Test.2";
  const ALIAS_NS2 = "_Self";
  const NAMESPACES: Array<NamespaceWithAlias> = [[NS1], [NS2, ALIAS_NS2]];

  beforeEach(() => {
    dataModel = new DataModel(NAMESPACES, ODataVersion.V4);
  });

  test("smoke test", () => {
    expect(dataModel.getODataVersion()).toBe(ODataVersion.V4);
    expect(dataModel.isV4()).toBe(true);
    expect(dataModel.isV2()).toBe(false);

    expect(dataModel.getEntityTypes().length).toBe(0);
    expect(dataModel.getComplexTypes().length).toBe(0);
    expect(dataModel.getEnums().length).toBe(0);
  });

  test("v2 version", () => {
    const result = new DataModel(NAMESPACES, ODataVersion.V2);

    expect(result.getODataVersion()).toBe(ODataVersion.V2);
    expect(result.isV2()).toBe(true);
    expect(result.isV4()).toBe(false);
  });

  test("adding converter", () => {
    const pkg = "test";
    const converterId = "testId";
    const expected = {
      from: ODataTypesV2.Time,
      to: ODataTypesV4.Duration,
      converters: [{ package: pkg, converterId }],
    };

    const convMap: MappedConverterChains = new Map();
    convMap.set(ODataTypesV2.Time, expected);

    dataModel = new DataModel(NAMESPACES, ODataVersion.V4, convMap);

    expect(dataModel.getConverter(ODataTypesV2.Time)).toStrictEqual(expected);
  });

  test("primitive type definition", () => {
    const modelName = "Xxx";
    const fqName = `${NS1}.${modelName}`;
    const type = "Edm.String";

    dataModel.addTypeDefinition(NS1, modelName, type);

    expect(dataModel.getPrimitiveType(fqName)).toBe(type);
  });

  test("primitive type definition by alias", () => {
    const modelName = "Xxx";
    const aliasName = `${ALIAS_NS2}.${modelName}`;
    const type = "Edm.String";

    dataModel.addTypeDefinition(NS2, modelName, type);

    expect(dataModel.getPrimitiveType(aliasName)).toBe(type);
  });

  test("add & get model", () => {
    const modelName = "Xxx";
    const fqName = `${NS1}.${modelName}`;
    const dummy = { name: modelName, fqName, baseClasses: [] };
    const expectedDummy = { ...dummy, dataType: DataTypes.ModelType };

    dataModel.addEntityType(
      NS1,
      modelName,
      // @ts-expect-error
      dummy,
    );

    expect(dataModel.getEntityType(fqName)).toStrictEqual(expectedDummy);
    expect(dataModel.getEntityType("xyz")).toBeUndefined();
    expect(dataModel.getEntityTypes()).toStrictEqual([expectedDummy]);
  });

  test("get model by alias", () => {
    const modelName = "Xxx";
    const aliasName = `${ALIAS_NS2}.${modelName}`;
    const dummy = { x: "y", name: modelName };
    const expectedDummy = { ...dummy, dataType: DataTypes.ModelType };

    dataModel.addEntityType(
      NS2,
      modelName,
      // @ts-expect-error
      dummy,
    );

    expect(dataModel.getEntityType(aliasName)).toStrictEqual(expectedDummy);
  });

  test("add & get complex type", () => {
    const modelName = "Xxx";
    const fqName = `${NS1}.${modelName}`;
    const dummy = { name: modelName, fqName, baseClasses: [] };
    const expectedDummy = { ...dummy, dataType: DataTypes.ComplexType };

    dataModel.addComplexType(
      NS1,
      modelName,
      // @ts-expect-error
      dummy,
    );

    expect(dataModel.getComplexType(fqName)).toStrictEqual(expectedDummy);
    expect(dataModel.getComplexType("xyz")).toBeUndefined();
    expect(dataModel.getComplexTypes()).toStrictEqual([expectedDummy]);
  });

  test("get complex type by alias", () => {
    const modelName = "Xxx";
    const aliasName = `${ALIAS_NS2}.${modelName}`;
    const dummy = { x: "y", name: modelName };
    dataModel.addComplexType(
      NS2,
      modelName,
      // @ts-expect-error
      dummy,
    );

    expect(dataModel.getComplexType(aliasName)).toMatchObject(dummy);
  });

  test("add & get enum", () => {
    const modelName = "Xxx";
    const dummy = { x: "y", name: modelName };
    const expectedDummy = { ...dummy, dataType: DataTypes.EnumType };
    dataModel.addEnum(
      NS1,
      modelName,
      // @ts-expect-error
      dummy,
    );

    expect(dataModel.getEnums()).toStrictEqual([expectedDummy]);
  });

  test("unbound operation", () => {
    const opName = "Xxx";
    const fqName = `${NS1}.${opName}`;
    const dummyOp = { fqName, odataName: opName };

    dataModel.addUnboundOperationType(
      NS1,
      // @ts-expect-error
      dummyOp,
    );

    expect(dataModel.getUnboundOperationTypes()).toStrictEqual([dummyOp]);
    expect(dataModel.getUnboundOperationType(fqName)).toStrictEqual(dummyOp);
  });

  test("unbound operation by alias", () => {
    const opName = "Xxx";
    const aliasName = `${ALIAS_NS2}.${opName}`;
    const dummyOp = { fqName: `${NS2}.${opName}`, odataName: opName };
    dataModel.addUnboundOperationType(
      NS2,
      // @ts-expect-error
      dummyOp,
    );

    expect(dataModel.getUnboundOperationType(aliasName)).toStrictEqual(dummyOp);
  });

  test("operation bound to entity", () => {
    const opName = "Xxx";
    const fqName = `${NS1}.${opName}`;
    const dummyOp = { fqName, odataName: opName };

    const bindingEntity = "xyz.abc";
    const dummyBinding = { fqType: bindingEntity, isCollection: false };

    dataModel.addBoundOperationType(
      NS1,
      // @ts-expect-error
      dummyBinding,
      dummyOp,
    );

    expect(dataModel.getEntityTypeOperations(bindingEntity)).toStrictEqual([dummyOp]);
    expect(dataModel.getEntitySetOperations(bindingEntity)).toStrictEqual([]);
    expect(dataModel.getUnboundOperationTypes()).toStrictEqual([]);
  });

  test("operation bound to entity collection", () => {
    const opName = "Xxx";
    const fqName = `${NS1}.${opName}`;
    const dummyOp = { fqName, odataName: opName };

    const bindingEntity = "xyz.abc";
    const dummyBinding = { fqType: bindingEntity, isCollection: true };

    dataModel.addBoundOperationType(
      NS1,
      // @ts-expect-error
      dummyBinding,
      dummyOp,
    );

    expect(dataModel.getEntityTypeOperations(bindingEntity)).toStrictEqual([]);
    expect(dataModel.getEntitySetOperations(bindingEntity)).toStrictEqual([dummyOp]);
  });

  test("bound operation by alias", () => {
    const opName = "Xxx";
    const dummyOp = { fqName: `${NS2}.${opName}`, odataName: opName };

    const entityName = "abc";
    const bindingEntity = `${NS2}.${entityName}`;
    const aliasName = `${ALIAS_NS2}.${entityName}`;

    dataModel.addEntityType(
      NS2,
      entityName,
      // @ts-expect-error,
      {},
    );
    dataModel.addBoundOperationType(
      NS2,
      // @ts-expect-error,
      { fqType: bindingEntity, isCollection: false },
      dummyOp,
    );
    dataModel.addBoundOperationType(
      NS2,
      // @ts-expect-error,
      { fqType: bindingEntity, isCollection: true },
      dummyOp,
    );

    expect(dataModel.getEntityTypeOperations(aliasName)).toStrictEqual([dummyOp]);
    expect(dataModel.getEntitySetOperations(aliasName)).toStrictEqual([dummyOp]);
  });

  test("add action", () => {
    const name = "XyZ";
    const fqName = `${NS1}.${name}`;
    const dummy = { x: "y", name };
    dataModel.addAction(
      fqName,
      // @ts-expect-error
      dummy,
    );

    expect(dataModel.getEntityContainer()).toStrictEqual({
      entitySets: {},
      singletons: {},
      functions: {},
      actions: { [fqName]: dummy },
    });
  });

  test("add function", () => {
    const name = "XyZ";
    const fqName = `${NS1}.${name}`;
    const dummy = { x: "y", name };
    dataModel.addFunction(
      fqName,
      // @ts-expect-error
      dummy,
    );

    expect(dataModel.getEntityContainer()).toStrictEqual({
      entitySets: {},
      singletons: {},
      functions: { [fqName]: dummy },
      actions: {},
    });
  });

  test("add entitySet", () => {
    const name = "XyZ";
    const fqName = `${NS1}.${name}`;
    const dummy = { x: "y" };
    dataModel.addEntitySet(
      fqName,
      // @ts-expect-error
      dummy,
    );

    expect(dataModel.getEntityContainer()).toStrictEqual({
      entitySets: { [fqName]: dummy },
      singletons: {},
      functions: {},
      actions: {},
    });
  });

  test("add singleton", () => {
    const name = "XyZ";
    const fqName = `${NS1}.${name}`;
    const dummy = { x: "y" };
    dataModel.addSingleton(
      fqName,
      // @ts-expect-error
      dummy,
    );

    expect(dataModel.getEntityContainer()).toStrictEqual({
      entitySets: {},
      singletons: { [fqName]: dummy },
      functions: {},
      actions: {},
    });
  });

  test("add model with empty namespace", () => {
    const modelName = "Xxx";
    const dummy = { name: modelName, baseClasses: [] };
    const expectedDummy = { ...dummy, dataType: DataTypes.ModelType };

    dataModel.addEntityType(
      "",
      modelName,
      // @ts-expect-error
      dummy,
    );

    expect(dataModel.getEntityType(modelName)).toStrictEqual(expectedDummy);
  });

  describe("getNavPropBindingTarget", () => {
    function addEntitySet(name: string, entityType: unknown, navPropBinding?: Array<unknown>) {
      dataModel.addEntitySet(
        `${NS1}.${name}`,
        // @ts-expect-error
        { odataName: name, entityType, navPropBinding },
      );
    }

    test("a plain, single-segment path resolves directly - unchanged regression coverage", () => {
      const medium = { fqName: `${NS1}.Medium`, baseClasses: [], props: [], baseProps: [] };
      addEntitySet("Copies", { fqName: `${NS1}.Copy` }, []);
      addEntitySet("Media", medium, [{ path: "Copies", target: "Copies" }]);

      const result = dataModel.getNavPropBindingTarget(`${NS1}.Medium`, "Copies");

      expect(result?.odataName).toBe("Copies");
    });

    test("a two-segment path cast to a subtype resolves the property declared on that subtype - without leaking it to any ancestor", () => {
      // mirrors int-test/asp-net's own metadata exactly: Medium <- PrintMedium <- Book, and
      // `Library.Catalog.Book/Publisher`, declared on the `Media` entity set (whose own EntityType is the
      // root `Medium`), reaches `Publisher` only via a cast to `Book` - neither `PrintMedium` nor `Medium`
      // has a `Publisher` property at all, so neither may resolve it.
      const publisherProp = { odataName: "Publisher", dataType: DataTypes.ModelType, fqType: `${NS1}.Publisher` };
      const medium = { fqName: `${NS1}.Medium`, baseClasses: [], props: [], baseProps: [] };
      const printMedium = { fqName: `${NS1}.PrintMedium`, baseClasses: [`${NS1}.Medium`], props: [], baseProps: [] };
      const book = {
        fqName: `${NS1}.Book`,
        baseClasses: [`${NS1}.PrintMedium`],
        props: [publisherProp],
        baseProps: [],
      };
      dataModel.addEntityType(
        NS1,
        "Medium",
        // @ts-expect-error
        medium,
      );
      dataModel.addEntityType(
        NS1,
        "PrintMedium",
        // @ts-expect-error
        printMedium,
      );
      dataModel.addEntityType(
        NS1,
        "Book",
        // @ts-expect-error
        book,
      );
      addEntitySet("Publishers", { fqName: `${NS1}.Publisher` }, []);
      addEntitySet("Media", medium, [{ path: `${NS1}.Book/Publisher`, target: "Publishers" }]);

      expect(dataModel.getNavPropBindingTarget(`${NS1}.Book`, "Publisher")?.odataName).toBe("Publishers");
      expect(dataModel.getNavPropBindingTarget(`${NS1}.PrintMedium`, "Publisher")).toBeUndefined();
      expect(dataModel.getNavPropBindingTarget(`${NS1}.Medium`, "Publisher")).toBeUndefined();
    });

    test("a two-segment path through a nested navigation property resolves the property on the reached type", () => {
      // mirrors int-test/cap's own metadata: `Chapters/up_`, declared on the `Audiobooks` entity set,
      // reaches `up_` only by first following the contained `Chapters` collection to `AudiobookChapter`.
      const chaptersProp = {
        odataName: "Chapters",
        dataType: DataTypes.ModelType,
        isCollection: true,
        fqType: `${NS1}.AudiobookChapter`,
        contained: true,
      };
      const upProp = { odataName: "up_", dataType: DataTypes.ModelType, fqType: `${NS1}.Audiobook` };
      const audiobook = { fqName: `${NS1}.Audiobook`, baseClasses: [], props: [chaptersProp], baseProps: [] };
      const chapter = { fqName: `${NS1}.AudiobookChapter`, baseClasses: [], props: [upProp], baseProps: [] };
      dataModel.addEntityType(
        NS1,
        "AudiobookChapter",
        // @ts-expect-error
        chapter,
      );
      addEntitySet("Audiobooks", audiobook, [{ path: "Chapters/up_", target: "Audiobooks" }]);

      expect(dataModel.getNavPropBindingTarget(`${NS1}.AudiobookChapter`, "up_")?.odataName).toBe("Audiobooks");
    });

    test("an unresolvable intermediate segment yields undefined rather than throwing", () => {
      const medium = { fqName: `${NS1}.Medium`, baseClasses: [], props: [], baseProps: [] };
      addEntitySet("Publishers", { fqName: `${NS1}.Publisher` }, []);
      addEntitySet("Media", medium, [{ path: `${NS1}.Nonexistent/Publisher`, target: "Publishers" }]);

      expect(dataModel.getNavPropBindingTarget(`${NS1}.Nonexistent`, "Publisher")).toBeUndefined();
    });
  });

  describe("getDisplayFqName", () => {
    test("an unaliased namespace's FQN is returned unchanged", () => {
      expect(dataModel.getDisplayFqName(`${NS1}.Reservation`)).toBe(`${NS1}.Reservation`);
    });

    test("an aliased namespace's prefix is replaced by its alias", () => {
      expect(dataModel.getDisplayFqName(`${NS2}.Reservation`)).toBe(`${ALIAS_NS2}.Reservation`);
    });

    test("the bare namespace itself (no local name) resolves to the bare alias", () => {
      expect(dataModel.getDisplayFqName(NS2)).toBe(ALIAS_NS2);
    });

    test("a namespace aliased to the empty string drops the prefix entirely", () => {
      // "" is a deliberate alias value (see NamespaceOptions), distinct from "no alias at all" - the
      // constructor must store it (`alias !== undefined`, not a truthy check) for this to work
      const withEmptyAlias = new DataModel([[NS1], [NS2, ""]], ODataVersion.V4);
      expect(withEmptyAlias.getDisplayFqName(`${NS2}.Reservation`)).toBe("Reservation");
    });

    test("a namespace nested inside another aliased one resolves against the longer, more specific match", () => {
      const outer = "Library";
      const inner = "Library.Circulation";
      const nested = new DataModel(
        [
          [outer, "Lib"],
          [inner, "Circ"],
        ],
        ODataVersion.V4,
      );

      expect(nested.getDisplayFqName(`${inner}.Reservation`)).toBe("Circ.Reservation");
      expect(nested.getDisplayFqName(`${outer}.Branch`)).toBe("Lib.Branch");
    });

    test("a name that isn't qualified by any known namespace is returned unchanged", () => {
      expect(dataModel.getDisplayFqName("Xxx")).toBe("Xxx");
    });
  });

  describe("getDisplayNamespace", () => {
    test("an unaliased namespace falls back to the real, raw namespace - there is always something to prefix with here", () => {
      expect(dataModel.getDisplayNamespace(`${NS1}.Reservation`)).toBe(NS1);
    });

    test("an aliased namespace resolves to its alias", () => {
      expect(dataModel.getDisplayNamespace(`${NS2}.Reservation`)).toBe(ALIAS_NS2);
    });

    test("a namespace aliased to the empty string resolves to the empty string, not the raw namespace", () => {
      const withEmptyAlias = new DataModel([[NS1], [NS2, ""]], ODataVersion.V4);
      expect(withEmptyAlias.getDisplayNamespace(`${NS2}.Reservation`)).toBe("");
    });

    test("a namespace nested inside another aliased one resolves against the longer, more specific match", () => {
      const outer = "Library";
      const inner = "Library.Circulation";
      const nested = new DataModel(
        [
          [outer, "Lib"],
          [inner, "Circ"],
        ],
        ODataVersion.V4,
      );

      expect(nested.getDisplayNamespace(`${inner}.Reservation`)).toBe("Circ");
      expect(nested.getDisplayNamespace(`${outer}.Branch`)).toBe("Lib");
    });

    test("a name with no namespace at all (no dot) is returned unchanged - never a real input in practice", () => {
      expect(dataModel.getDisplayNamespace("Xxx")).toBe("Xxx");
    });
  });
});
