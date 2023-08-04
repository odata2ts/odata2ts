import { PersonIdModel } from "../build/trippin/TrippinModel";
import { BASE_URL, TRIPPIN } from "./infra/TestConstants";

describe("Trippin: Smoke Test", function () {
  test("entitySet", async () => {
    const expected = `${BASE_URL}/People`;

    const toTest = TRIPPIN.people();

    expect(toTest.getPath()).toBe(expected);
    expect(toTest.getKeySpec().length).toBe(1);
    expect(toTest.getKeySpec()[0].getName()).toEqual("UserName");
  });

  test("entity", async () => {
    const testId = "test";
    const expected = `${BASE_URL}/People('${testId}')`;

    const etService = TRIPPIN.people(testId);

    expect(etService.getPath()).toBe(expected);
  });

  test("entity with complex id", async () => {
    const testId: PersonIdModel = { user: "williams" };
    const expected = `${BASE_URL}/People(UserName='williams')`;

    expect(TRIPPIN.people(testId).getPath()).toBe(expected);
  });

  test("complex type", async () => {
    const complex = TRIPPIN.people("tester").homeAddress();

    expect(complex.getPath()).toBe(`${BASE_URL}/People('tester')/HomeAddress`);
  });

  test("complex collection", async () => {
    const complex = TRIPPIN.people("tester").addressInfo();

    expect(complex.getPath()).toBe(`${BASE_URL}/People('tester')/AddressInfo`);
  });

  test("singleton", async () => {
    const result = TRIPPIN.me();

    expect(result.getPath()).toBe(`${BASE_URL}/Me`);
  });

  test("navigation", async () => {
    const result = TRIPPIN.people("tester").bestFriend().bestFriend().bestFriend().homeAddress().city();

    expect(result.getPath()).toBe(`${BASE_URL}/People('tester')/BestFriend/BestFriend/BestFriend/HomeAddress/City`);
  });
});
