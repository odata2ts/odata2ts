import { ODataService } from "../src";
import { MockClient } from "./mock/MockClient";

class TestODataService extends ODataService<MockClient> {
  public exposeAddFullPath(path?: string) {
    return this.__base.addFullPath(path);
  }
}

describe("ODataService Test", () => {
  const odataClient = new MockClient(false);
  const BASE_URL = "/test";

  test("odataService: simple init", () => {
    const subject = new TestODataService(odataClient, BASE_URL);

    expect(subject.getPath()).toBe(BASE_URL);
    expect(subject.exposeAddFullPath()).toBe(BASE_URL);
    expect(subject.exposeAddFullPath("test")).toBe(BASE_URL + "/test");
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

  test("odataService: init with big number", () => {
    const testService = new TestODataService(odataClient, BASE_URL, true);
    expect(testService).toBeDefined();
  });
});
