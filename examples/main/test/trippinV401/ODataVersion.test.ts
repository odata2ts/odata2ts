import { beforeEach, describe, expect, test } from "vitest";
import type { EditablePerson } from "../../src-generated/trippin-v401/TrippinV401Model.js";
import { Feature, PersonGender } from "../../src-generated/trippin-v401/TrippinV401Model.js";
import { TrippinV401Service } from "../../src-generated/trippin-v401/TrippinV401Service.js";
import { MockODataClient } from "../MockODataClient.js";

/**
 * Generated from the same model as the trippin service, but with odataVersionV4 set to "4.01".
 * Counterpart to test/trippin/RequestHeaders.test.ts, which covers the default of 4.0.
 *
 * That the generate actually uses the 4.01 response types is covered by the type check of this
 * package (see the "test" script), since TrippinV401Service imports them from odata-core.
 */
describe("Testing OData 4.01 generation of TrippinService", () => {
  const BASE_URL = "/test";
  const ODATA_CLIENT = new MockODataClient();
  const TRIPPIN = new TrippinV401Service(ODATA_CLIENT, BASE_URL, { noUrlEncoding: true });

  const ID = "williams";
  const userModel: EditablePerson = {
    gender: PersonGender.Unknown,
    userName: ID,
    age: 66,
    favoriteFeature: Feature.Feature1,
    features: [],
    firstName: "Heinz",
  };

  beforeEach(() => {
    ODATA_CLIENT.additionalHeaders = undefined;
  });

  test("create declares version 4.01", async () => {
    await TRIPPIN.people().create(userModel).execute();

    expect(ODATA_CLIENT.lastOperation).toBe("POST");
    expect(ODATA_CLIENT.additionalHeaders?.["OData-Version"]).toBe("4.01");
  });

  test("update declares version 4.01", async () => {
    await TRIPPIN.people(ID).update(userModel).execute();

    expect(ODATA_CLIENT.lastOperation).toBe("PUT");
    expect(ODATA_CLIENT.additionalHeaders?.["OData-Version"]).toBe("4.01");
  });

  test("patch declares version 4.01", async () => {
    await TRIPPIN.people(ID).patch({ age: 30 }).execute();

    expect(ODATA_CLIENT.lastOperation).toBe("PATCH");
    expect(ODATA_CLIENT.additionalHeaders?.["OData-Version"]).toBe("4.01");
  });

  test("no version is declared without a request body", async () => {
    await TRIPPIN.people().query().execute();

    expect(ODATA_CLIENT.lastOperation).toBe("GET");
    expect(ODATA_CLIENT.additionalHeaders?.["OData-Version"]).toBeUndefined();
  });

  test("the type control info of a payload uses the short form", async () => {
    const request = TRIPPIN.people(ID)
      .asEmployeeService()
      .patch({ cost: 5 }, { withTypeControlInfo: true })
      .getInfoConverted();

    expect(request.data).toStrictEqual({ Cost: 5, "@type": "#Trippin.Employee" });
  });

  test("control info supplied by the user wins", async () => {
    const request = TRIPPIN.people(ID)
      .asEmployeeService()
      .patch({ cost: 5, "@type": "#Trippin.Manager" }, { withTypeControlInfo: true })
      .getInfoConverted();

    expect(request.data).toStrictEqual({ Cost: 5, "@type": "#Trippin.Manager" });
  });

  test("the spelling of the other version is rejected", () => {
    TRIPPIN.people(ID).asEmployeeService().patch({
      cost: 5,
      // @ts-expect-error: a client targeting 4.01 must not use the prefixed form
      "@odata.type": "#Trippin.Manager",
    });
  });

  test("standard operations use the short form of the control information", async () => {
    ODATA_CLIENT.responseData = { "@count": 1, value: [] };

    const response = await TRIPPIN.people().query().execute();

    expect(response.data["@count"]).toBe(1);
  });

  test("a nested service keeps the version of the client it belongs to", async () => {
    ODATA_CLIENT.responseData = { "@count": 2, value: [] };

    const response = await TRIPPIN.people(ID).addressInfo().query().execute();

    expect(response.data["@count"]).toBe(2);
  });
});
