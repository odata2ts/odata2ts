import { AxiosClient } from "@odata2ts/http-client-axios";

import { EditablePersonModel, FeatureModel, LocationModel, PersonGenderModel } from "../build/trippin/TrippinModel";
import { TrippinService } from "../build/trippin/TrippinService";

describe.skip("CRUD Integration Tests", function () {
  const homeBase: LocationModel = {
    address: "123 Westham Road",
    city: {
      name: "Burlington",
      countryRegion: "UK",
      region: "any",
    },
  };

  const horst: EditablePersonModel = {
    user: "horst",
    firstName: "Horst",
    lastName: "Tester",
    // homeAddress: homeBase,
    traditionalGenderCategories: PersonGenderModel.Male,
    age: 66,
    // addressInfo: [homeBase],
    emails: ["test@testing.de"],
    favoriteFeature: FeatureModel.Feature3,
    features: [],
    // features: [FeatureModel.Feature1, FeatureModel.Feature4],
  };

  const BASE_URL = "https://services.odata.org/TripPinRESTierService/(S(sivik5crfo3qvprrreziudlp))";
  const trippinService = new TrippinService(new AxiosClient(), BASE_URL);

  test("create, update and delete person", async () => {
    jest.setTimeout(15000);

    const horstService = trippinService.people(horst.user);

    try {
      await horstService.delete();
    } catch (e) {}

    // when creating a new person
    let result = await trippinService.people().create(horst);
    // then returned object matches our person
    expect(result.data).toMatchObject(horst);

    // given a service for the new person
    // when updating some props, we expect no error
    await horstService.patch({ middleName: "middle", age: 33 });

    // when deleting this new product, we expect no error
    // await new Promise((res) => global.setTimeout(res, 1000));
    await horstService.delete();
  });
});
