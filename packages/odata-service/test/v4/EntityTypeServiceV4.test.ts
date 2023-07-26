import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataModelResponseV4 } from "@odata2ts/odata-core";
import { ODataQueryBuilderV4 } from "@odata2ts/odata-query-builder";

import { commonEntityTypeServiceTests } from "../EntityTypeServiceTests";
import { PersonModel } from "../fixture/PersonModel";
import { PersonModelService } from "../fixture/v4/PersonModelService";
import { QPersonV4, qPersonV4 } from "../fixture/v4/QPersonV4";
import { MockClient } from "../mock/MockClient";

describe("EntityTypeService V4 Tests", () => {
  const odataClient = new MockClient(false);
  const BASE_URL = "";
  const NAME = "test('tester')";

  let testService: PersonModelService<MockClient>;

  commonEntityTypeServiceTests(odataClient, PersonModelService);

  beforeEach(() => {
    testService = new PersonModelService(odataClient, BASE_URL, NAME);
  });

  test("entityType V4: big numbers", async () => {
    expect(odataClient.bigNumberAsString).toBe(false);
    new PersonModelService(odataClient, BASE_URL, NAME, true);
    expect(odataClient.bigNumberAsString).toBe(true);
  });

  // TODO
  test.skip("entityType V4: query object", async () => {
    expect(testService.getQObject()).toMatchObject(qPersonV4);
  });

  test("entityType V4: typing of query stuff", async () => {
    // typing test of result
    const result: HttpResponseModel<ODataModelResponseV4<PersonModel>> = await testService.query((builder) => {
      // typing test of builder
      const resultB: ODataQueryBuilderV4<QPersonV4> = builder;
    });

    // manual typings provided
    const result2: HttpResponseModel<ODataModelResponseV4<{ userName: string }>> = await testService.query<
      Pick<PersonModel, "userName">
    >((builder) => {
      // typing test of builder
      const resultB: ODataQueryBuilderV4<QPersonV4> = builder;
    });
  });
});
