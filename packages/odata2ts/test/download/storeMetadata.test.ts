import * as fsExtra from "fs-extra";
import * as prettier from "prettier";

import { storeMetadata } from "../../src/download";

jest.mock("fs-extra");
jest.mock("prettier");

describe("StoreMetadata Test", () => {
  const DEFAULT_SOURCE = "./test/dir/test.xml";
  const DEFAULT_INPUT = "ajdfoaifjj";

  let ensureDirSpy: jest.SpyInstance;
  let writeFileSpy: jest.SpyInstance;
  let prettierSpy: jest.SpyInstance;

  beforeAll(() => {
    // mock console to keep a clean test output
    ensureDirSpy = jest.spyOn(fsExtra, "ensureDir").mockImplementation(() => Promise.resolve());
    writeFileSpy = jest.spyOn(fsExtra, "writeFile").mockImplementation(() => Promise.resolve());

    jest.spyOn(prettier, "resolveConfig").mockResolvedValue(null);
    prettierSpy = jest.spyOn(prettier, "format").mockImplementation(() => DEFAULT_INPUT);
  });

  afterEach(() => {
    // clear mock state before each test
    jest.clearAllMocks();
  });

  test("store file best case", async () => {
    const result = await storeMetadata(DEFAULT_SOURCE, DEFAULT_INPUT, false);

    expect(result).toBe(DEFAULT_INPUT);
    expect(prettierSpy).not.toHaveBeenCalled();
    expect(ensureDirSpy).toHaveBeenCalledWith("./test/dir");
    expect(writeFileSpy).toHaveBeenCalledWith(DEFAULT_SOURCE, DEFAULT_INPUT);
  });

  /*
  test("failing request", async () => {
    const myError = new Error("Oh No!");
    // @ts-ignore: simulate failed request
    axios.request.mockRejectedValueOnce(myError);

    await expect(downloadMetadata(DEFAULT_URL)).rejects.toThrow(myError);
  });
*/

  test("store file with name only", async () => {
    await storeMetadata("justAName", DEFAULT_INPUT, false);

    expect(ensureDirSpy).toHaveBeenCalledWith(".");
    expect(writeFileSpy).toHaveBeenCalledWith("justAName", DEFAULT_INPUT);
  });

  test("prettify first", async () => {
    await storeMetadata(DEFAULT_SOURCE, DEFAULT_INPUT, true);

    expect(prettierSpy).toHaveBeenCalledWith(DEFAULT_INPUT, expect.anything());
  });
});
