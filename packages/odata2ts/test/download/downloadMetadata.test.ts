import axios, { AxiosRequestConfig } from "axios";

import { UrlSourceConfiguration } from "../../src";
import { downloadMetadata } from "../../src/download/downloadMetadata";

jest.mock("axios");
jest.mock("fs-extra");

describe("Download Test", () => {
  const DEFAULT_URL = "http://localhost:3000/api";
  const DEFAULT_REQUEST_CONFIG: AxiosRequestConfig = {
    url: DEFAULT_URL + "/$metadata",
    method: "GET",
  };
  const AJAX_RESULT = "ajdfoaifjj";

  let axiosSpy: jest.SpyInstance<any>;
  let logInfoSpy: jest.SpyInstance;
  let logErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    axiosSpy = jest.spyOn(axios, "request").mockImplementation(() => {
      return Promise.resolve({ data: AJAX_RESULT });
    });
    // mock console to keep a clean test output
    logInfoSpy = jest.spyOn(console, "log").mockImplementation(jest.fn);
    logErrorSpy = jest.spyOn(console, "error").mockImplementation(jest.fn);
  });

  afterEach(() => {
    // clear mock state before each test
    jest.clearAllMocks();
  });

  test("download best case", async () => {
    const result = await downloadMetadata(DEFAULT_URL);

    expect(result).toBe(AJAX_RESULT);
    expect(axiosSpy).toHaveBeenCalledWith(DEFAULT_REQUEST_CONFIG);
    expect(logInfoSpy).toHaveBeenCalledTimes(1);
  });

  test("failing request", async () => {
    const myError = new Error("Oh No!");
    // @ts-ignore: simulate failed request
    axios.request.mockRejectedValueOnce(myError);

    await expect(downloadMetadata(DEFAULT_URL)).rejects.toThrow(myError);
  });

  test("with auth", async () => {
    const config: UrlSourceConfiguration = { username: "user", password: "p!wd###1123$%,'" };

    await downloadMetadata(DEFAULT_URL, config);

    expect(axiosSpy).toHaveBeenCalledWith({ ...DEFAULT_REQUEST_CONFIG, auth: config });
  });

  test("incomplete auth gets ignored", async () => {
    await downloadMetadata(DEFAULT_URL, { username: "user", password: undefined });
    expect(axiosSpy).toHaveBeenCalledWith(DEFAULT_REQUEST_CONFIG);

    await downloadMetadata(DEFAULT_URL, { password: "ababab" });
    expect(axiosSpy).toHaveBeenCalledWith(DEFAULT_REQUEST_CONFIG);
  });

  test("auth with empty strings is ok", async () => {
    const config = { username: "", password: "" };
    await downloadMetadata(DEFAULT_URL, config);
    expect(axiosSpy).toHaveBeenCalledWith({ auth: config, ...DEFAULT_REQUEST_CONFIG });
  });

  test("with debug", async () => {
    await downloadMetadata(DEFAULT_URL, undefined, true);

    expect(logInfoSpy).toHaveBeenCalledTimes(2);
  });

  test("with debug - don't log password", async () => {
    await downloadMetadata(DEFAULT_URL, { username: "user", password: "p!wd###1123$%,'" }, true);

    expect(logInfoSpy).toHaveBeenLastCalledWith("Request configuration:", {
      auth: { password: "xxx hidden xxx", username: "user" },
      method: "GET",
      url: "http://localhost:3000/api/$metadata",
    });
  });

  test("custom request config", async () => {
    const config: UrlSourceConfiguration = {
      custom: { baseURL: DEFAULT_URL, auth: { username: "null", password: "" } },
    };

    await downloadMetadata(DEFAULT_URL, config);

    expect(axiosSpy).toHaveBeenCalledWith({ ...DEFAULT_REQUEST_CONFIG, ...config.custom });
  });

  test("custom request config overwrites defaults", async () => {
    const config: UrlSourceConfiguration = {
      custom: { method: "POST", url: "hey" },
    };

    await downloadMetadata(DEFAULT_URL, config);

    expect(axiosSpy).toHaveBeenCalledWith(config.custom);
  });
});
