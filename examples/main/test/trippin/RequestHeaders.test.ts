import { beforeEach, describe, expect, test } from "vitest";
import { EditablePersonModel, FeatureModel, PersonGenderModel } from "../../src-generated/trippin/TrippinModel.js";
import { ODATA_CLIENT, TRIPPIN } from "./TrippinTestConstants.js";

/**
 * odata2ts targets OData 4.0, which is declared via the OData-Version header on each request carrying a body.
 * It is what makes the payload notations we generate valid, e.g. `@odata.bind` for association binding.
 */
describe("Testing OData version header of TrippinService", () => {
  const ID = "williams";
  const userModel: EditablePersonModel = {
    traditionalGenderCategories: PersonGenderModel.Unknown,
    user: ID,
    age: 66,
    favoriteFeature: FeatureModel.Feature1,
    features: [],
    firstName: "Heinz",
  };

  beforeEach(() => {
    ODATA_CLIENT.additionalHeaders = undefined;
  });

  test("create declares version 4.0", async () => {
    await TRIPPIN.people().create(userModel).execute();

    expect(ODATA_CLIENT.lastOperation).toBe("POST");
    expect(ODATA_CLIENT.additionalHeaders?.["OData-Version"]).toBe("4.0");
  });

  test("update declares version 4.0", async () => {
    await TRIPPIN.people(ID).update(userModel).execute();

    expect(ODATA_CLIENT.lastOperation).toBe("PUT");
    expect(ODATA_CLIENT.additionalHeaders?.["OData-Version"]).toBe("4.0");
  });

  test("patch declares version 4.0", async () => {
    await TRIPPIN.people(ID).patch({ age: 30 }).execute();

    expect(ODATA_CLIENT.lastOperation).toBe("PATCH");
    expect(ODATA_CLIENT.additionalHeaders?.["OData-Version"]).toBe("4.0");
  });

  test("collection update declares version 4.0", async () => {
    await TRIPPIN.people(ID).addressInfo().update([]).execute();

    expect(ODATA_CLIENT.lastOperation).toBe("PUT");
    expect(ODATA_CLIENT.additionalHeaders?.["OData-Version"]).toBe("4.0");
  });

  test("no version is declared without a request body", async () => {
    await TRIPPIN.people().query().execute();

    expect(ODATA_CLIENT.lastOperation).toBe("GET");
    expect(ODATA_CLIENT.additionalHeaders?.["OData-Version"]).toBeUndefined();
  });

  test("no version is declared when deleting", async () => {
    await TRIPPIN.people(ID).delete().execute();

    expect(ODATA_CLIENT.lastOperation).toBe("DELETE");
    expect(ODATA_CLIENT.additionalHeaders?.["OData-Version"]).toBeUndefined();
  });
});
