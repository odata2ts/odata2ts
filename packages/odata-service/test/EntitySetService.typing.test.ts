import { expectType, TypeEqual } from "ts-expect";
import { ODataResponse, ODataCollectionResponse } from "@odata2ts/odata-client-api";
import { Unnominalized } from "@odata2ts/odata-query-objects";

import { MockODataClient } from "./MockODataClient";
import { TestCollectionService, TestService, TestModel } from "./fixture/TypingModelService";
import { Feature, PersonModel, PersonModelCollectionService } from "./fixture/PersonModelService";

// Compare to TestModel => no nominal types like GuidString, DateString, etc.
type ExpectedTestType = {
  ID: string;
  counter: number;
  date?: string;
  tags: Array<string>;
  other?: ExpectedTestType;
  others?: Array<ExpectedTestType>;
};

type ExpectedCreateType = Omit<ExpectedTestType, "ID">;
type ExpectedCreateType2 = Unnominalized<Omit<PersonModel, "UserName">>;

describe("EntitySetService Typing Test", () => {
  const odataClient = new MockODataClient();
  const BASE_URL = "/test";

  const testService: TestCollectionService = new TestCollectionService(odataClient, BASE_URL);
  const personService: PersonModelCollectionService = new PersonModelCollectionService(odataClient, BASE_URL);

  test("entitySet: query return type", () => {
    expectType<
      TypeEqual<ODataResponse<ODataCollectionResponse<ExpectedTestType>>, ReturnType<typeof testService.query>>
    >(true);
  });

  test("entitySet: create params without Guid Id", () => {
    expectType<TypeEqual<[ExpectedCreateType], Parameters<typeof testService.create>>>(true);
  });

  /* test("entitySet: create params with optional id", () => {
    expectType<TypeEqual<[ExpectedCreateType2], Parameters<typeof personService.create>>>(true);
  }); */
});
