import { FetchClient } from "@odata2ts/http-client-fetch";
import { describe, expect, test } from "vitest";
import { EditableEventModel } from "../../src-generated/trippin-rw/microsoft-o-data-sample-service-models-trip-pin/event/EventModel";
import { TrippinRwService } from "../../src-generated/trippin-rw/TrippinRwService";

describe("Integration Testing of Service Generation", () => {
  const BASE_URL = "https://services.odata.org/V4/(S(xjqbds2oavibr01gt1fny24s))/TripPinServiceRW";
  const odataClient = new FetchClient();

  const trippinService = new TrippinRwService(odataClient, BASE_URL);

  test("casting derived entity type", async () => {
    const response = await trippinService
      .people("russellwhyte")
      .trips(0)
      .planItems(11)
      .asFlightService()
      .query()
      .execute();

    const { "@odata.context": ignore, ...result } = response.data;
    expect(result).toStrictEqual({
      confirmationCode: "JH58493",
      duration: "PT0S",
      endsAt: "2014-01-01T11:35:00Z",
      flightNumber: "AA26",
      planItemId: 11,
      seatNumber: null,
      startsAt: "2014-01-01T06:15:00Z",
    });
  });

  test("filter & select derived entity prop", async () => {
    const response = await trippinService
      .people("russellwhyte")
      .trips(0)
      .planItems()
      .query((builder, q) => {
        return builder.select("QFlight_flightNumber").filter(q.QFlight_flightNumber.eq("AA26"));
      })
      .execute();

    expect(response.data.value).toStrictEqual([
      {
        "@odata.type": "#Microsoft.OData.SampleService.Models.TripPin.Flight",
        flightNumber: "AA26",
      },
    ]);
  });

  test("create derived entity", async () => {
    const model: EditableEventModel & { "@odata.type"?: string } = {
      "@odata.type": "#Microsoft.OData.SampleService.Models.TripPin.Event",
      planItemId: 33,
      confirmationCode: "4372899DD",
      description: "Client Meeting",
      duration: "PT3H",
      startsAt: "2014-05-25T23:11:17.5459178-07:00",
      endsAt: "2014-06-01T23:11:17.5479185-07:00",
      occursAt: {
        address: "100 Church Street, 8th Floor, Manhattan, 10007",
        buildingInfo: "Regus Business Center",
        city: {
          countryRegion: "United States",
          name: "New York City",
          region: "New York",
        },
      },
    };
    const response = await trippinService.people("russellwhyte").trips(0).planItems().create(model).execute();
    const { "@odata.context": ctxt, ...data } = response.data;

    expect(data).toStrictEqual(model);
  });

  test("composable function: with additional query", async () => {
    const baseRequest = trippinService.getNearestAirport({ lat: 1, lon: 2 });

    const request = baseRequest.compose().query((builder) => builder.select("icaoCode", "name"));
    expect(request.getUrl()).toBe(baseRequest.getUrl() + "?%24select=IcaoCode%2CName");

    const response = await request.execute();

    // expectTypeOf(response).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<AirportModel>>>();

    expect(response.status).toBe(200);
    expect(response.data).toMatchObject({ icaoCode: "LIRA", name: "Rome Ciampino Airport" });
    expect(response.data.iataCode).toBeUndefined();
  });

  test("composable function: with additional path segments", async () => {
    const baseRequest = trippinService.getNearestAirport({ lat: 1, lon: 2 });

    expect(baseRequest.compose().location().query().getUrl()).toBe(baseRequest.getUrl() + "/Location");
  });

  test("composable function: action afterwards", async () => {
    const baseRequest = trippinService.getNearestAirport({ lat: 1, lon: 2 });
    const originalName = "Rome Ciampino Airport";
    const expectedName = "Tester";

    try {
      await trippinService.airports("LIRA").patch({ name: originalName }).execute();
    } catch (e) {}

    const request = baseRequest.compose().patch({
      name: expectedName,
    });

    expect(request.getInfo()).toMatchObject({
      url: baseRequest.getUrl() + "",
      method: "PATCH",
    });

    const response = await request.execute();

    // expectTypeOf(response).toEqualTypeOf<HttpResponseModel<undefined>>();

    expect(response.status).toBe(204);
    expect(response.data).toBeUndefined;

    const result = await trippinService.airports("LIRA").query().execute();

    expect(result.data.name).toBe(expectedName);
  });
});
