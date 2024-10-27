import { AxiosClient } from "@odata2ts/http-client-axios";
import { describe, expect, test } from "vitest";
import { EditablePlanItemModel, PlanItemModel } from "../../build/trippin-rw/TrippinRwModel";
import { TrippinRwService } from "../../build/trippin-rw/TrippinRwService";
import { EditableEventModel } from "../../build/trippin/TrippinModel";

describe("Integration Testing of Service Generation", () => {
  const BASE_URL = "https://services.odata.org/V4/(S(xjqbds2oavibr01gt1fny24s))/TripPinServiceRW";
  const odataClient = new AxiosClient();

  const trippinService = new TrippinRwService(odataClient, BASE_URL);

  test("casting derived entity type", async () => {
    const response = await trippinService.people("russellwhyte").trips(0).planItems(11).asFlightService().query();

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
      });

    expect(response.data.value).toStrictEqual([
      {
        "@odata.type": "#Microsoft.OData.SampleService.Models.TripPin.Flight",
        flightNumber: "AA26",
      },
    ]);
  });

  test("create derived entity", async () => {
    const model: EditableEventModel = {
      // @ts-ignore
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
    const response = await trippinService.people("russellwhyte").trips(0).planItems().create(model);
    const {
      //@ts-ignore
      "@odata.context": ctxt,
      ...data
    } = response.data;

    expect(data).toStrictEqual(model);
  });
});
