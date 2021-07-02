import { QBinaryPath } from "./../../src/path/QBinaryPath";

describe("QBinaryPath test", () => {
  let toTest: QBinaryPath;

  beforeEach(() => {
    toTest = new QBinaryPath("picture");
  });

  test("fails with null, undefined, empty string", () => {
    // @ts-ignore
    expect(() => new QBinaryPath(null)).toThrow();
    // @ts-ignore
    expect(() => new QBinaryPath()).toThrow();
    // @ts-ignore
    expect(() => new QBinaryPath(undefined)).toThrow();
    expect(() => new QBinaryPath("")).toThrow();
    expect(() => new QBinaryPath(" ")).toThrow();
  });
});
