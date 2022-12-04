import { ODataService } from "../src";
import { MockODataClient } from "./mock/MockODataClient";

class TestODataService extends ODataService<MockODataClient> {
  public exposeAddFullPath(path?: string) {
    return this.addFullPath(path);
  }
}

describe("ODataService Test", () => {
  const odataClient = new MockODataClient(false);
  const BASE_URL = "/test";

  test("odataService: simple init", async () => {
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
});
