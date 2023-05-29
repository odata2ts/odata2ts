import { DEFAULT_ERROR_MESSAGE, FetchODataClient, FetchODataClientError, FetchRequestConfig } from "../src";

describe("Failure Handling Tests", function () {
  let fetchClient: FetchODataClient;
  let requestConfig: RequestInit | undefined;
  let simulateFailure: {
    isFetchFailure?: boolean;
    isJsonFailure?: boolean;
    message?: string;
    isV2?: boolean;
    isOk?: boolean;
  } = {};

  // @ts-ignore: more simplistic parameters and returning different stuff
  global.fetch = jest.fn((url: string, config?: RequestInit | undefined): Promise<MockResponse> => {
    // store last request config
    requestConfig = config;

    const { isFetchFailure, isV2, isOk, isJsonFailure, message } = simulateFailure;
    let jsonResult = { error: { message: isV2 ? { value: message } : message } };

    return isFetchFailure
      ? Promise.reject(new Error(message))
      : Promise.resolve({
          status: isOk ? 200 : 400,
          statusText: "Client error",
          headers: new Headers(),
          ok: !!isOk,
          json: () => (isJsonFailure ? Promise.reject(new Error(message)) : Promise.resolve(jsonResult)),
        });
  });

  beforeEach(() => {
    requestConfig = undefined;
    fetchClient = new FetchODataClient();
    simulateFailure = {};
  });

  test("failure response", async () => {
    simulateFailure.message = "oh no!";

    try {
      await fetchClient.get("");
    } catch (e) {
      expect(e).toBeInstanceOf(FetchODataClientError);

      const error = e as FetchODataClientError;
      expect(error.status).toBe(400);
      expect(error.name).toBe("FetchODataClientError");
      expect(error.message).toContain(simulateFailure.message);
      expect(error.cause).toBeInstanceOf(Error);
      expect(error.cause?.message).toBe(simulateFailure.message);
      expect(error.stack).toContain(simulateFailure.message);
      expect(error.stack).toContain("FetchODataClientError");
    }
  });

  test("generic failure message", async () => {
    await expect(fetchClient.get("")).rejects.toThrow(DEFAULT_ERROR_MESSAGE);
  });

  test("failure message v2 support", async () => {
    simulateFailure = { isV2: true, message: "oh no!" };
    await expect(fetchClient.get("")).rejects.toThrow(simulateFailure.message);
  });

  test("fetch failure", async () => {
    simulateFailure = { isFetchFailure: true, message: "xxxyyyy Dddd!" };

    try {
      await fetchClient.get("");
    } catch (e) {
      expect(e).toBeInstanceOf(FetchODataClientError);

      const error = e as FetchODataClientError;
      expect(error.status).toBeUndefined();
      expect(error.name).toBe("FetchODataClientError");
      expect(error.message).toContain(simulateFailure.message);
      expect(error.cause).toBeInstanceOf(Error);
      expect(error.cause?.message).toBe(simulateFailure.message);
      expect(error.stack).toContain(simulateFailure.message);
      expect(error.stack).toContain("FetchODataClientError");
    }
  });

  test("fetch failure without message", async () => {
    simulateFailure = { isFetchFailure: true, message: undefined };
    await expect(fetchClient.get("")).rejects.toThrow(DEFAULT_ERROR_MESSAGE);
  });

  test("json retrieval failure", async () => {
    simulateFailure = { isJsonFailure: true, isOk: true, message: "xxxyyyy Dddd!" };

    try {
      await fetchClient.get("");
    } catch (e) {
      expect(e).toBeInstanceOf(FetchODataClientError);

      const error = e as FetchODataClientError;
      expect(error.status).toBe(200);
      expect(error.name).toBe("FetchODataClientError");
      expect(error.message).toContain(simulateFailure.message);
      expect(error.cause).toBeInstanceOf(Error);
      expect(error.cause?.message).toBe(simulateFailure.message);
      expect(error.stack).toContain(simulateFailure.message);
      expect(error.stack).toContain("FetchODataClientError");
    }
  });

  // when the whole request failed, any failures that occur on calling the json function are non-fatal
  test("failure request and json retrieval failure", async () => {
    simulateFailure = { isJsonFailure: true, isOk: false, message: "xxxyyyy Dddd!" };

    try {
      await fetchClient.get("");
    } catch (e) {
      expect(e).toBeInstanceOf(FetchODataClientError);

      const error = e as FetchODataClientError;
      expect(error.status).toBe(400);
      expect(error.name).toBe("FetchODataClientError");
      expect(error.message).toContain(DEFAULT_ERROR_MESSAGE);
      expect(error.cause).toBeInstanceOf(Error);
      expect(error.cause?.message).toBe(DEFAULT_ERROR_MESSAGE);
    }
  });

  test("custom failure message retriever", async () => {
    simulateFailure.message = "the failure";
    const customMsg = "Here comes my failure!";
    fetchClient.setErrorMessageRetriever((response) => {
      expect(response.error.message).toBe(simulateFailure.message);
      return customMsg;
    });

    await expect(fetchClient.get("")).rejects.toThrow(customMsg);
  });
});
