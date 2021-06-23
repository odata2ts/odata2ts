import {
  QNumberPath,
  QStringPath,
  QEntityPath,
  QEntityFactory,
  QBooleanPath,
  QEntityCollectionPath,
} from "@odata2ts/odata-query-objects";
import { ODataUriBuilder } from "../src/ODataUriBuilder";

interface Address {
  street: string;
}

interface Person {
  age: number;
  name: string;
  deceased: boolean;
  address: Address;
  altAdresses: Array<Address>;
}

/**
 * Helper function which adds the base path.
 *
 * @param urlPart
 * @returns
 */
function addBase(urlPart: string) {
  return `/Persons?${urlPart}`;
}

describe("ODataUriBuilder Test", () => {
  let toTest: ODataUriBuilder<Person, "name" | "age">;

  /* const qSalesTotals = QEntityFactory.create<Sales_Totals_by_Amount, "CompanyName" | "OrderID">(
    "Sales_Totals_by_Amounts",
    {
      CompanyName: new QStringPath("CompanyName"),
      OrderID: new QNumberPath("OrderID"),
      SaleAmount: new QNumberPath("SaleAmount"),
      ShippedDate: new QDateTimeOffsetPath("ShippedDate"),
    }
  ); */

  const QAddress = QEntityFactory.create<Address, "street">("Addresses", {
    street: new QStringPath("street"),
  });

  const QPerson = QEntityFactory.create<Person, "name" | "age">("Persons", {
    age: new QNumberPath("age"),
    name: new QStringPath("name"),
    deceased: new QBooleanPath("deceased"),
    get address() {
      return new QEntityPath<Address>("address", QAddress);
    },
    get altAdresses() {
      return new QEntityCollectionPath<Address>("altAdresses", QAddress);
    },
  });

  /**
   * Always use a new builder for each  test.
   */
  beforeEach(() => {
    toTest = ODataUriBuilder.create(QPerson, { unencoded: true });
  });

  test("minimal default", () => {
    expect(toTest.build()).toBe("/Persons");
  });

  test("fail with empty collection", () => {
    // @ts-ignore
    expect(() => ODataUriBuilder.create(null)).toThrow();
    // @ts-expect-error
    expect(() => ODataUriBuilder.create()).toThrow();
    // @ts-expect-error
    expect(() => ODataUriBuilder.create({})).toThrow();
    expect(() => ODataUriBuilder.create({ entityName: " " })).toThrow();
  });

  // TODO check config

  test("select 2 props", () => {
    const candidate = toTest.select("name", "age").build();
    const expected = addBase("$select=name,age");

    expect(candidate).toBe(expected);
  });

  /*
  TODO: ignore null / undefined to support evaluations & select nothing is also not problematic
  test("fail with null or empty clause", () => {
    expect(() => toTest.select(qEmployee.id, null)).toThrow();
    expect(() => toTest.select(qEmployee.id, undefined)).toThrow();
    expect(() => toTest.select()).toThrow();
  });
 */

  test("test skip", () => {
    const candidate = toTest.skip(5).build();
    const expected = addBase("$skip=5");

    expect(candidate).toBe(expected);
  });

  test("test skip with zero", () => {
    const candidate = toTest.skip(0).build();
    const expected = addBase("$skip=0");

    expect(candidate).toBe(expected);
  });

  test("fail skip with negative number", () => {
    expect(() => toTest.skip(-2)).toThrow();
  });

  test("test top", () => {
    const candidate = toTest.top(15).build();
    const expected = addBase("$top=15");

    expect(candidate).toBe(expected);
  });

  test("test top with zero", () => {
    const candidate = toTest.top(0).build();
    const expected = addBase("$top=0");

    expect(candidate).toBe(expected);
  });

  test("fail top with negative number", () => {
    expect(() => toTest.top(-1)).toThrow();
  });

  test("test count", () => {
    const candidate = toTest.count().build();
    const expected = addBase("$count=true");

    expect(candidate).toBe(expected);
  });

  test("test count=true", () => {
    const candidate = toTest.count(true).build();
    const expected = addBase("$count=true");

    expect(candidate).toBe(expected);
  });

  test("test count=false", () => {
    const candidate = toTest.count(false).build();
    const expected = addBase("$count=false");

    expect(candidate).toBe(expected);
  });

  test("one simple expand", () => {
    const candidate = toTest.expand("address").build();
    const expected = addBase("$expand=address");

    expect(candidate).toBe(expected);
  });

  test("two simple expands", () => {
    const candidate = toTest.expand("address", "altAdresses").build();
    const expected = addBase("$expand=address,altAdresses");

    expect(candidate).toBe(expected);
  });

  test("one fairly simple expand", async () => {
    const candidate = toTest.expanding("address", (builder) => {}).build();
    const expected = addBase("$expand=address");

    expect(candidate).toBe(expected);
  });

  test("one expand with select", async () => {
    const candidate = toTest
      .expanding("address", (builder, qEntity) => {
        builder.select("street");
      })
      .build();
    const expected = addBase("$expand=address($select=street)");

    expect(candidate).toBe(expected);
  });

  /* test("expand 1:n with skip & top", async () => {
    const candidate = toTest
      .expanding<Order>("Orders", (builder) => {
        builder.select("OrderID", "ShipName").skip(1).top(0);
      })
      .build();
    const expected = addBase("$expand=Orders($select=OrderID,ShipName;$skip=1;$top=0)");

    expect(candidate).toBe(expected);
  });

  test("deeply nested expand", async () => {
    const candidate = toTest
      .select("EmployeeID", "LastName")
      .expanding<Order>("Orders", (builder) => {
        builder.select("OrderID").expanding<Customer>("Customer", (custExpand) => {
          custExpand.select("CustomerID");
        });
      })
      .build();
    const expected = addBase(
      "$select=EmployeeID,LastName&$expand=Orders($select=OrderID;$expand=Customer($select=CustomerID))"
    );

    expect(candidate).toBe(expected);
  });

  test("combining simple & complex expand", async () => {
    const candidate = toTest
      .expanding<Order>("Orders", (builder) => {
        builder.select("OrderID");
      })
      .expand("Employees1", "Employee1")
      .build();
    const expected = addBase("$expand=Orders($select=OrderID),Employees1,Employee1");

    expect(candidate).toBe(expected);
  }); */

  ODataUriBuilder.create(QPerson)
    .byKey({ name: "Heinz", age: 12 })
    .count()
    .select("name", "age")
    .expanding("address", (builder) => builder.select("street"))
    .build();
});
