import crypto from "crypto";

import { FetchODataClient } from "../src";

type MockResponse = Required<Pick<Response, "status" | "statusText" | "ok" | "json" | "headers">>;

describe("Automatic CSRF Handling Test", function () {
  let fetchClient: FetchODataClient;
  let requestUrl: string | undefined;
  let requestConfig: RequestInit | undefined;
  let csrfToken: string | undefined;
  let simulateExpiredCsrfToken: boolean = false;

  const successResponse = {
    success: true,
  };
  const getTokenFromRequest = () => {
    return (requestConfig?.headers as Headers)?.get("x-csrf-token");
  };

  // @ts-ignore: more simplistic parameters and returning different stuff
  global.fetch = jest.fn((url: string, config?: RequestInit | undefined): Promise<MockResponse> => {
    // store last request url
    requestUrl = url;
    // store last request config
    requestConfig = config;

    const requestHeaders = config?.headers as Headers;
    let status = 200;
    let statusText = "OK";
    let ok: boolean = true;
    let jsonResult: any = successResponse;
    const headers = new Headers();

    // CSRF token request => custom response
    if (requestHeaders?.get("x-csrf-token") === "Fetch") {
      csrfToken = crypto.randomBytes(4).toString("hex");
      headers.set("x-csrf-token", csrfToken);
      jsonResult = undefined;
    }
    // Simulate expired CSRF token => custom response
    else if (simulateExpiredCsrfToken) {
      ok = false;
      status = 403;
      statusText = "Forbidden";
      jsonResult = undefined;
      headers.set("x-csrf-token", "Required");
      simulateExpiredCsrfToken = false;
    }

    return Promise.resolve({
      status,
      statusText,
      headers,
      ok,
      json: () => Promise.resolve(jsonResult),
    });
  });

  beforeEach(() => {
    requestUrl = undefined;
    requestConfig = undefined;
    csrfToken = undefined;
    simulateExpiredCsrfToken = false;
    fetchClient = new FetchODataClient(undefined, {
      useCsrfProtection: true,
      csrfTokenFetchUrl: "/root/",
    });
  });

  test("fail without csrfTokenFetchUrl", async () => {
    expect(() => new FetchODataClient(undefined, { useCsrfProtection: true })).toThrow("URL");
  });

  test("added generated token", async () => {
    const response = await fetchClient.post("test", {});

    expect(csrfToken).toBeTruthy();
    expect(getTokenFromRequest()).toBe(csrfToken);
  });

  test("no token generation for GET requests", async () => {
    const response = await fetchClient.get("test");

    expect(csrfToken).toBeUndefined();
    expect(response.headers["x-csrf-token"]).toBeUndefined();
  });

  test("token generation for PUT, PATCH, DELETE and caching", async () => {
    await fetchClient.put("test", {});
    const token = csrfToken;
    expect(getTokenFromRequest()).toBe(token);

    await fetchClient.patch("test", {});
    expect(getTokenFromRequest()).toBe(token);

    await fetchClient.delete("test");
    expect(getTokenFromRequest()).toBe(token);
  });

  test("token expiration", async () => {
    await fetchClient.post("test", {});
    const token = csrfToken;

    simulateExpiredCsrfToken = true;
    await fetchClient.post("test", {});
    const token2 = csrfToken;

    expect(token2).toBeTruthy();
    expect(token).not.toBe(token2);
  });
});
