import { writeFile } from "node:fs/promises";
import { mkdirp } from "mkdirp";
import { format, resolveConfig } from "prettier";
import { afterEach, describe, expect, test, vi } from "vitest";
import { storeMetadata } from "../../src/download";

vi.mock("mkdirp");
vi.mock("rimraf");
vi.mock("node:fs/promises");
vi.mock("prettier");

describe("StoreMetadata Test", () => {
  const DEFAULT_SOURCE = "./test/dir/test.xml";
  const DEFAULT_INPUT = "ajdfoaifjj";

  afterEach(() => {
    // clear mock state before each test
    vi.clearAllMocks();
  });

  test("store file best case", async () => {
    const result = await storeMetadata(DEFAULT_SOURCE, DEFAULT_INPUT, false);

    expect(result).toBe(DEFAULT_INPUT);
    expect(resolveConfig).not.toHaveBeenCalled();
    expect(format).not.toHaveBeenCalled();
    expect(mkdirp).toHaveBeenCalledWith("./test/dir");
    expect(writeFile).toHaveBeenCalledWith(DEFAULT_SOURCE, DEFAULT_INPUT);
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

    expect(mkdirp).toHaveBeenCalledWith(".");
    expect(writeFile).toHaveBeenCalledWith("justAName", DEFAULT_INPUT);
  });

  test("prettify first", async () => {
    await storeMetadata(DEFAULT_SOURCE, DEFAULT_INPUT, true);

    expect(resolveConfig).toHaveBeenCalled();
    expect(format).toHaveBeenCalledWith(DEFAULT_INPUT, { parser: "xml", plugins: ["@prettier/plugin-xml"] });
  });
});
