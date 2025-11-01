import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV4, ODataModelResponseV4 } from "@odata2ts/odata-core";
import { describe, expect, test } from "vitest";
import { PersonIdModel, PersonModel } from "../../src-generated/trippin/TrippinModel";
import { BASE_URL, ODATA_CLIENT, TRIPPIN } from "./TrippinTestConstants";

type SelectedPersonShape = Pick<PersonModel, "user" | "lastName" | "addressInfo">;

describe("Trippin: Testing Query Functionality", function () {
  test("entitySet", async () => {
    const expected = `${BASE_URL}/People`;

    const response: HttpResponseModel<ODataCollectionResponseV4<PersonModel>> = await TRIPPIN.people().query();

    expect(ODATA_CLIENT.lastUrl).toBe(expected);
    expect(ODATA_CLIENT.lastOperation).toBe("GET");
    expect(ODATA_CLIENT.lastData).toBeUndefined();
  });

  test("entitySet: get with complex id", async () => {
    const testId: PersonIdModel = { user: "williams" };
    const expected = `${BASE_URL}/People(UserName='williams')`;

    const response: HttpResponseModel<ODataModelResponseV4<PersonModel>> = await TRIPPIN.people(testId).query();

    expect(ODATA_CLIENT.lastUrl).toBe(expected);
    expect(ODATA_CLIENT.lastOperation).toBe("GET");
    expect(ODATA_CLIENT.lastData).toBeUndefined();
  });

  test("entitySet: query with select", async () => {
    const expected = `${BASE_URL}/People?$select=UserName,LastName,AddressInfo`;

    // const response = await TRIPPIN.people().query((builder) => builder.select("user", "lastName", "addressInfo"));

    const response = await TRIPPIN.people().query((builder) => builder.select("user", "lastName", "addressInfo"));
    const dataType: Array<SelectedPersonShape> = response?.data?.value;

    expect(ODATA_CLIENT.lastUrl).toBe(expected);
  });

  test("entitySet: query with unknown select", async () => {
    const expected = `${BASE_URL}/People?$select=UserName,TheTest,test2`;

    // const response = await TRIPPIN.people().query((builder) => builder.select("user", "lastName", "addressInfo"));

    const response = await TRIPPIN.people().query((builder) =>
      builder
        // @ts-ignore
        .select("user", "TheTest", "test2"),
    );

    expect(ODATA_CLIENT.lastUrl).toBe(expected);
  });

  test("complex type: query", async () => {
    await TRIPPIN.people("tester").homeAddress().query();

    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/People('tester')/HomeAddress`);
    expect(ODATA_CLIENT.lastOperation).toBe("GET");
    expect(ODATA_CLIENT.lastData).toBeUndefined();
  });

  test("complex collection: query", async () => {
    await TRIPPIN.people("tester").addressInfo().query();

    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/People('tester')/AddressInfo`);
    expect(ODATA_CLIENT.lastOperation).toBe("GET");
    expect(ODATA_CLIENT.lastData).toBeUndefined();
  });

  test("primitive type: get value", async () => {
    await TRIPPIN.people("tester").age().getValue();

    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/People('tester')/Age`);
    expect(ODATA_CLIENT.lastOperation).toBe("GET");
    expect(ODATA_CLIENT.lastData).toBeUndefined();
  });

  test("any: without args", async () => {
    await TRIPPIN.people().query((builder, qPerson) => {
      return builder.filter(qPerson.trips.any());
    });

    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/People?$filter=Trips/any()`);
  });

  test("any: without return type", async () => {
    await TRIPPIN.people().query((builder, qPerson) => {
      return builder.filter(qPerson.trips.any(() => {}));
    });

    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/People?$filter=Trips/any()`);
  });

  test("no url encoding", async () => {
    await TRIPPIN.people("hei/ner").query((b, q) => b.filter(q.age.gt(18)));

    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/People('hei/ner')?$filter=Age gt 18`);
  });

  test("function without url encoding", async () => {
    await TRIPPIN.people("heiner").getFriendsTrips({ userName: "hei/ner" });

    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/People('heiner')/Trippin.GetFriendsTrips(userName='hei/ner')`);
  });

  test("casting derived entity type", async () => {
    await TRIPPIN.people("russellwhyte").trips(0).planItems().asFlightCollectionService().query();

    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/People('russellwhyte')/Trips(0)/PlanItems/Trippin.Flight`);
  });

  test("select & expand casted prop of derived entity type", async () => {
    await TRIPPIN.people("russellwhyte")
      .trips(0)
      .planItems()
      .query((b, q) => {
        return b.select("QFlight_airline").expand("QFlight_airline");
      });

    expect(ODATA_CLIENT.lastUrl).toBe(
      `${BASE_URL}/People('russellwhyte')/Trips(0)/PlanItems?$select=Trippin.Flight/Airline&$expand=Trippin.Flight/Airline`,
    );
  });

  test("filter casted prop of derived entity type", async () => {
    await TRIPPIN.people("russellwhyte")
      .trips(0)
      .planItems()
      .query((b, q) => {
        return b.filter(q.QFlight_flightNumber.eq("123"));
      });

    expect(ODATA_CLIENT.lastUrl).toBe(
      `${BASE_URL}/People('russellwhyte')/Trips(0)/PlanItems?$filter=Trippin.Flight/FlightNumber eq '123'`,
    );
  });
});
