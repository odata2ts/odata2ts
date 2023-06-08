import { AxiosClient, AxiosClientError } from "@odata2ts/http-client-axios";

import { FeatureModel, PersonGenderModel, PersonModel } from "../build/trippin/TrippinModel";
import { PersonIdModel } from "../build/trippin/TrippinModel";
import { TrippinService } from "../build/trippin/TrippinService";

describe("Integration Testing of Service Generation", () => {
  const BASE_URL = "https://services.odata.org/TripPinRESTierService/(S(sivik5crfo3qvprrreziudlp))";
  const odataClient = new AxiosClient();

  const testService = new TrippinService(odataClient, BASE_URL);

  // skipped, because it breaks the session state
  // => new session id must be chosen
  test.skip("unbound action", async () => {
    const result = await testService.resetDataSourceAction();
    expect(result.data).toBe("");
  });

  test("unbound function", async () => {
    const result = await testService.getPersonWithMostFriendsFunction();
    expect(result.data.firstName).toBe("Russell");
    expect(result.data.lastName).toBe("Whyte");
  });

  test("unbound function with params", async () => {
    const result = await testService.getNearestAirportFunction({ lat: 123, lon: 345 });
    expect(result.data.icaoCode).toBe("ZBAA");
  });

  test("get entity by id", async () => {
    const expected: PersonModel = {
      user: "russellwhyte",
      firstName: "Russell",
      lastName: "Whyte",
      middleName: null,
      age: null,
      traditionalGenderCategories: PersonGenderModel.Male,
      emails: ["Russell@example.com", "Russell@contoso.com"],
      favoriteFeature: FeatureModel.Feature1,
      features: [FeatureModel.Feature1, FeatureModel.Feature2],
      homeAddress: null,
      addressInfo: [
        {
          address: "187 Suffolk Ln.",
          city: {
            countryRegion: "United States",
            name: "Boise",
            region: "ID",
          },
        },
      ],
      // bestFriend: null,
      // friends: [],
      // trips: [],
    };

    const result = await testService.navToPeople("russellwhyte").query();
    expect(result.status).toBe(200);
    expect(result.data).toBeDefined();

    const rw: PersonModel = result.data;
    expect(rw.firstName).toBe("Russell");
    expect(result.data).toMatchObject(expected);
  });

  test("get entity with related entities", async () => {
    const expectedBestFriend: Partial<PersonModel> = {
      firstName: "Scott",
      lastName: "Ketchum",
    };
    const result = await testService
      .navToPeople("russellwhyte")
      .query((qb) => qb.select("bestFriend", "friends").expand("bestFriend", "friends"));

    expect(result.status).toBe(200);
    expect(result.data.bestFriend).toMatchObject(expectedBestFriend);
    expect(result.data.friends?.length).toBe(3);
    expect(result.data.friends![0]).toMatchObject(expectedBestFriend);
  });

  test("fail to get unknown person", async () => {
    const axiosClientMsgPrefix = "OData server responded with error: ";
    const axiosFailMsg = "The request resource is not found.";

    await expect(() => testService.navToPeople("XXX").query()).rejects.toThrow(
      new Error(axiosClientMsgPrefix + axiosFailMsg)
    );

    // again, but now inspect error in detail
    try {
      await testService.navToPeople("XXX").query();
      // we expect an error and no success
      expect(1).toBe(2);
    } catch (error) {
      const e = error as AxiosClientError;
      expect(e.name).toBe("AxiosClientError");
      expect(e.message).toBe(axiosClientMsgPrefix + axiosFailMsg);
      expect(e.status).toBe(404);
      expect(e.cause).toBeDefined();
    }
  });

  test("entitySet query", async () => {
    const result = await testService.navToPeople().query();
    expect(result.status).toBe(200);
    expect(result.data).toBeDefined();
    expect(result.data.value.length).toBe(20);
  });

  test("entitySet query people with any Feature 1", async () => {
    const result = await testService.navToPeople().query((builder, qPerson) => {
      return builder
        .count()
        .top(10)
        .select("firstName", "lastName")
        .filter(qPerson.trips.any((qTrip) => qTrip.budget.gt(2999)))
        .expanding("trips", (tBuilder) => tBuilder.select("description", "budget"));
    });
    expect(result.status).toBe(200);
    expect(result.data).toBeDefined();
    expect(result.data).toMatchObject({ "@odata.count": 4 });
    expect(result.data.value.length).toBe(4);
    expect(result.data.value).toStrictEqual([
      {
        firstName: "Ronald",
        lastName: "Mundy",
        trips: [
          {
            budget: 6000,
            description: "Gradution trip with friends",
          },
        ],
      },
      {
        firstName: "Russell",
        lastName: "Whyte",
        trips: [
          {
            budget: 3000,
            description: "Trip from San Francisco to New York City",
          },
          {
            budget: 2000,
            description: "Trip from Shanghai to Beijing",
          },
          {
            budget: 2650,
            description: "Happy honeymoon trip",
          },
        ],
      },
      {
        firstName: "Scott",
        lastName: "Ketchum",
        trips: [
          {
            budget: 5000,
            description: "Trip from San Francisco to New York City",
          },
          {
            budget: 11000,
            description: "Trip from Shanghai to Beijing",
          },
        ],
      },
      {
        firstName: "Willie",
        lastName: "Ashmore",
        trips: [
          {
            budget: 3800.5,
            description: "This is my first business trip",
          },
          {
            budget: 2000,
            description: "The trip is currently in plan.",
          },
        ],
      },
    ]);
  });

  test("collection of strings", async () => {
    const result = await testService.navToPeople("russellwhyte").navToAddressInfo().query();

    expect(result.status).toBe(200);
    expect(result.data).toBeDefined();
    expect(result.data.value.length).toBe(1);
    expect(result.data.value[0].address).toBe("187 Suffolk Ln.");
  });

  test("create key and parse key", async () => {
    const simpleInput = "test@testing.de";
    const simpleResult = "test%40testing.de";
    const complexInput: PersonIdModel = { user: simpleInput };

    // simple version
    let result = testService.navToPeople().createKey(simpleInput);
    expect(result).toBe(`People('${simpleResult}')`);
    expect(testService.navToPeople().parseKey(result)).toBe(simpleInput);

    // complex version
    result = testService.navToPeople().createKey(complexInput);
    expect(result).toBe(`People(UserName='${simpleResult}')`);
    expect(testService.navToPeople().parseKey(result)).toStrictEqual(complexInput);
  });
});
