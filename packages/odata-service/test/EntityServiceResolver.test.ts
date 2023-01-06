import {
  PersonModelV2CollectionService,
  PersonModelV2Service,
  createPersonModelV2ServiceResolver,
} from "./fixture/v2/PersonModelV2Service";
import {
  PersonModelCollectionService,
  PersonModelService,
  createPersonModelServiceResolver,
} from "./fixture/v4/PersonModelService";
import { MockODataClient } from "./mock/MockODataClient";

describe("EntityServiceResolver Tests", function () {
  const CLIENT = new MockODataClient(false);
  const BASE_PATH = "base";
  const NAME = "myName";

  test("smoke test", () => {
    const toTest = createPersonModelServiceResolver(CLIENT, BASE_PATH, NAME);

    expect(toTest.get("charles")).toBeInstanceOf(PersonModelService);
    expect(toTest.get({ userName: "charles" })).toBeInstanceOf(PersonModelService);

    expect(toTest.get()).toBeInstanceOf(PersonModelCollectionService);
    expect(toTest.get(undefined)).toBeInstanceOf(PersonModelCollectionService);
  });

  test("failures", () => {
    const toTest = createPersonModelServiceResolver(CLIENT, BASE_PATH, NAME);

    // @ts-expect-error
    expect(toTest.get(null)).toBeInstanceOf(PersonModelCollectionService);
    // @ts-expect-error
    expect(() => toTest.get({ xxx: "charles" })).toThrow('Unknown parameter "xxx"!');
  });

  test("v2 test", async () => {
    const toTest = createPersonModelV2ServiceResolver(CLIENT, BASE_PATH, NAME);

    expect(toTest.get("charles")).toBeInstanceOf(PersonModelV2Service);
    expect(toTest.get({ userName: "charles" })).toBeInstanceOf(PersonModelV2Service);

    expect(toTest.get()).toBeInstanceOf(PersonModelV2CollectionService);
    expect(toTest.get(undefined)).toBeInstanceOf(PersonModelV2CollectionService);
  });

  test("createKey & parseKey", async () => {
    const toTest = createPersonModelV2ServiceResolver(CLIENT, BASE_PATH, NAME);
    expect(toTest.createKey("123")).toBe(`${NAME}('123')`);
    expect(toTest.createKey({ userName: "456" })).toBe(`${NAME}(UserName='456')`);

    expect(toTest.parseKey(`${NAME}('123')`)).toBe("123");
    expect(toTest.parseKey(`${NAME}(UserName='456')`)).toStrictEqual({ userName: "456" });
  });
});
