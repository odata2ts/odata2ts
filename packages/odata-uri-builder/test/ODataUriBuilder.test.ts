import { ODataUriBuilder } from "../src/ODataUriBuilder";
import { Customer, Employee, Order } from "./types/NorthwindModel";

/**
 * Helper function which adds the base path.
 *
 * @param urlPart
 * @returns
 */
function addBase(urlPart: string) {
  return `/Employee?${urlPart}`;
}

describe("ODataUriBuilder Test", () => {
  let toTest: ODataUriBuilder<Employee>;

  /**
   * Always use a new builder for each test.
   */
  beforeEach(() => {
    toTest = new ODataUriBuilder<Employee>("Employee", { unencoded: true });
  });

  test("minimal default", () => {
    expect(toTest.build()).toBe("/Employee");
  });

  test("fail with empty collection", () => {
    expect(() => new ODataUriBuilder<Employee>(" ").build()).toThrow();
  });

  test("select 2 props", () => {
    const candidate = toTest.select("EmployeeID", "LastName").build();
    const expected = addBase("$select=EmployeeID,LastName");

    expect(candidate).toBe(expected);
  });

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
    const candidate = toTest.expand("Employee1").build();
    const expected = addBase("$expand=Employee1");

    expect(candidate).toBe(expected);
  });

  test("two simple expands", () => {
    const candidate = toTest.expand("Employee1", "Employees1").build();
    const expected = addBase("$expand=Employee1,Employees1");

    expect(candidate).toBe(expected);
  });

  test("one fairly simple expand", async () => {
    const candidate = toTest.expanding("Employee1", (builder) => {}).build();
    const expected = addBase("$expand=Employee1");

    expect(candidate).toBe(expected);
  });

  test("one expand with select", async () => {
    const candidate = toTest
      .expanding<Employee>("Employee1", (builder) => {
        builder.select("EmployeeID", "LastName", "FirstName");
      })
      .build();
    const expected = addBase("$expand=Employee1($select=EmployeeID,LastName,FirstName)");

    expect(candidate).toBe(expected);
  });

  test("expand 1:n with skip & top", async () => {
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
  });
});
