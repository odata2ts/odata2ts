import { ODataService } from "../src";
import { MockODataClient } from "./mock/MockODataClient";

describe("ODataService Test", () => {
  const odataClient = new MockODataClient();
  const BASE_URL = "/test";

  test("odataService: simple init", async () => {
    const subject = new ODataService(odataClient, BASE_URL);

    expect(subject.getPath()).toBe(BASE_URL);
  });

  test("odataService: fail with insufficient params", async () => {
    // @ts-expect-error
    expect(() => new ODataService(null, BASE_URL)).toThrowError();
    // @ts-expect-error
    expect(() => new ODataService(undefined, BASE_URL)).toThrowError();
    // @ts-expect-error
    expect(() => new ODataService(odataClient, null)).toThrowError();
    expect(() => new ODataService(odataClient, "")).toThrowError();
  });
});
