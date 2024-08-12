import * as fsExtra from "fs-extra";
import prettier from "prettier";
import { vi } from "vitest";
import type { MockInstance } from "vitest";

import { storeMetadata } from "../../src/download";

// vi.mock("fs-extra");

describe("StoreMetadata Test", () => {
  const DEFAULT_SOURCE = "./test/dir/test.xml";
  const DEFAULT_INPUT = "ajdfoaifjj";

  let ensureDirSpy: MockInstance;
  let writeFileSpy: MockInstance;
  let prettierSpy: MockInstance;

  beforeAll(() => {
    // mock console to keep a clean test output
    ensureDirSpy = vi.spyOn(fsExtra, "ensureDir").mockImplementation(async () => {});
    writeFileSpy = vi.spyOn(fsExtra, "writeFile").mockImplementation(async () => {});

    vi.spyOn(prettier, "resolveConfig").mockResolvedValue(null);
    prettierSpy = vi.spyOn(prettier, "format").mockImplementation(() => DEFAULT_INPUT);
  });

  afterEach(() => {
    // clear mock state before each test
    vi.clearAllMocks();
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

    expect(prettierSpy).toHaveBeenCalledWith(DEFAULT_INPUT);
  });
});
