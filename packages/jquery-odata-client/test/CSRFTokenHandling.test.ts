import { JQueryODataClient } from "../src";
import { JqMock } from "./JQueryMock";

describe("Automatic CSRF Handling Test", function () {
  let jqMock: JqMock;
  let jqClient: JQueryODataClient;

  beforeEach(() => {
    jqMock = new JqMock();
    jqClient = new JQueryODataClient(jqMock as unknown as JQueryStatic, undefined, {
      useCsrfProtection: true,
      csrfTokenFetchUrl: "/root/",
    });
  });

  test("added generated token", async () => {
    jqMock.successResponse();
    await jqClient.post("test", {});

    const reqSettings = jqMock.getRequestConfig();
    const token = jqMock.getCsrfToken();

    expect(token).toBeTruthy();
    expect(reqSettings?.headers).toMatchObject({ "x-csrf-token": token });
  });

  test("no token generation for GET requests", async () => {
    jqMock.successResponse();
    await jqClient.get("test");
    const token = jqMock.getCsrfToken();

    expect(token).toBeUndefined();
  });

  test("token caching", async () => {
    jqMock.successResponse();
    await jqClient.post("test", {});
    const token = jqMock.getCsrfToken();

    jqMock.successResponse();
    await jqClient.post("test", {});
    const token2 = jqMock.getCsrfToken();

    expect(token).toBe(token2);
  });

  test("token expiration", async () => {
    jqMock.successResponse();
    await jqClient.post("test", {});
    const token = jqMock.getCsrfToken();

    jqMock.successResponse();
    jqMock.simulateExpiredCsrfToken();
    await jqClient.post("test", {});
    const token2 = jqMock.getCsrfToken();

    expect(token2).toBeTruthy();
    expect(token).not.toBe(token2);
  });

  test("token generation for PUT, PATCH, DELETE", async () => {
    jqMock.successResponse();
    await jqClient.put("test", {});
    const token = jqMock.getCsrfToken();
    expect(jqMock.getRequestConfig()?.headers).toMatchObject({ "x-csrf-token": token });

    jqMock.successResponse();
    await jqClient.patch("test", {});
    expect(jqMock.getRequestConfig()?.headers).toMatchObject({ "x-csrf-token": token });

    jqMock.successResponse();
    await jqClient.delete("test", {});
    expect(jqMock.getRequestConfig()?.headers).toMatchObject({ "x-csrf-token": token });
  });
});
