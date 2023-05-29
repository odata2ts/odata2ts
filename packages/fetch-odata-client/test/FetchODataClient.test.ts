import { FetchODataClient, FetchRequestConfig } from "../src";

describe("FetchODataClient Tests", function () {
  let fetchClient: FetchODataClient;
  let requestUrl: string | undefined;
  let requestConfig: RequestInit | undefined;
  let simulateNoContent: boolean = false;

  const DEFAULT_URL = "TEST/hi";
  const JSON_VALUE = "application/json";
  const DEFAULT_REQUEST_CONFIG = { method: "GET", cache: "no-cache" };
  const DEFAULT_HEADERS = { accept: JSON_VALUE, "content-type": JSON_VALUE };

  // Mocking fetch
  // @ts-ignore: more simplistic parameters and returning different stuff
  global.fetch = jest.fn((url: string, config?: RequestInit | undefined): Promise<MockResponse> => {
    // store last request url
    requestUrl = url;
    // store last request config
    requestConfig = config;

    let jsonResult = simulateNoContent ? undefined : { success: true };

    return Promise.resolve({
      status: simulateNoContent ? 204 : 200,
      statusText: "OK",
      headers: new Headers(),
      ok: true,
      json: () => Promise.resolve(jsonResult),
    });
  });

  const getDefaultBaseConfigForMethod = (method: string) => {
    return {
      ...DEFAULT_REQUEST_CONFIG,
      method,
      body: "{}",
    };
  };

  const getRequestHeaderRecords = () => {
    const headers = requestConfig?.headers as Headers;
    const result: Record<string, string> = {};

    headers.forEach((val, key) => (result[key] = val));
    return result;
  };

  /**
   * request config without headers
   */
  const getBaseRequestConfig = () => {
    const { headers, ...result } = requestConfig || {};

    return result;
  };

  beforeEach(() => {
    requestUrl = undefined;
    requestConfig = undefined;
    fetchClient = new FetchODataClient();
    simulateNoContent = false;
  });

  test("get request", async () => {
    await fetchClient.get(DEFAULT_URL);

    expect(requestUrl).toBe(DEFAULT_URL);
    expect(getBaseRequestConfig()).toStrictEqual(DEFAULT_REQUEST_CONFIG);
    expect(getRequestHeaderRecords()).toStrictEqual(DEFAULT_HEADERS);
  });

  test("invalid url", async () => {
    await expect(
      // @ts-ignore
      fetchClient.get(null)
    ).rejects.toThrow("Value for URL must be provided!");
    await expect(
      // @ts-ignore
      fetchClient.get(undefined)
    ).rejects.toThrow("Value for URL must be provided!");
  });

  test("using config", async () => {
    const headers = { hey: "Ho" };
    const config: FetchRequestConfig = {
      referrerPolicy: "unsafe-url",
      redirect: "error",
      mode: "cors",
      credentials: "include",
    };

    await fetchClient.get("", { headers, ...config });

    expect(getBaseRequestConfig()).toStrictEqual({ ...DEFAULT_REQUEST_CONFIG, ...config });
    expect(getRequestHeaderRecords()).toStrictEqual({ ...DEFAULT_HEADERS, ...headers });
  });

  test("using config with overrides", async () => {
    const headers = { Accept: "hey", "Content-Type": "Ho" };
    const config: FetchRequestConfig = {
      // @ts-ignore: method is not exposed as it should not be overridden
      method: "POST",
      cache: "force-cache",
    };

    await fetchClient.get("", { headers, ...config });

    // method has not been overridden
    expect(getBaseRequestConfig()).toStrictEqual({ method: "GET", cache: config.cache });
    // headers have been overridden
    expect(getRequestHeaderRecords()).toStrictEqual({
      accept: headers.Accept,
      "content-type": headers["Content-Type"],
    });
  });

  test("post request", async () => {
    await fetchClient.post(DEFAULT_URL, {});

    expect(requestUrl).toBe(DEFAULT_URL);
    expect(getBaseRequestConfig()).toStrictEqual(getDefaultBaseConfigForMethod("POST"));
    expect(getRequestHeaderRecords()).toStrictEqual(DEFAULT_HEADERS);
  });

  test("post request with different data", async () => {
    await fetchClient.post("", undefined);
    expect(requestConfig?.body).toBeUndefined();
    await fetchClient.post("", null);
    expect(requestConfig?.body).toStrictEqual("null");
    await fetchClient.post("", "");
    expect(requestConfig?.body).toStrictEqual('""');
    const dataStructure = { test: "hey", collection: [{ hey: 3 }] };
    await fetchClient.post("", dataStructure);
    expect(requestConfig?.body).toBe(JSON.stringify(dataStructure));
  });

  test("put request", async () => {
    await fetchClient.put(DEFAULT_URL, {});

    expect(requestUrl).toBe(DEFAULT_URL);
    expect(getBaseRequestConfig()).toStrictEqual(getDefaultBaseConfigForMethod("PUT"));
    expect(getRequestHeaderRecords()).toStrictEqual(DEFAULT_HEADERS);
  });

  test("patch request", async () => {
    await fetchClient.patch(DEFAULT_URL, {});

    expect(requestUrl).toBe(DEFAULT_URL);
    expect(getBaseRequestConfig()).toStrictEqual(getDefaultBaseConfigForMethod("PATCH"));
    expect(getRequestHeaderRecords()).toStrictEqual(DEFAULT_HEADERS);
  });

  test("merge request", async () => {
    await fetchClient.merge(DEFAULT_URL, {});

    expect(requestUrl).toBe(DEFAULT_URL);
    expect(getBaseRequestConfig()).toStrictEqual(getDefaultBaseConfigForMethod("POST"));
    expect(getRequestHeaderRecords()).toStrictEqual({ ...DEFAULT_HEADERS, "x-http-method": "MERGE" });
  });

  test("delete request", async () => {
    await fetchClient.delete(DEFAULT_URL);

    expect(requestUrl).toBe(DEFAULT_URL);
    expect(getBaseRequestConfig()).toStrictEqual({ ...DEFAULT_REQUEST_CONFIG, method: "DELETE" });
    expect(getRequestHeaderRecords()).toStrictEqual(DEFAULT_HEADERS);
  });

  test("simulate 204 no content", async () => {
    simulateNoContent = true;
    const response = await fetchClient.post(DEFAULT_URL, {});

    expect(response.status).toBe(204);
    expect(response.data).toBeUndefined();
  });
});
