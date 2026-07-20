import { IndentationText, NewLineKind, QuoteKind } from "ts-morph";
import { afterEach, describe, expect, test, vi } from "vitest";
import { PrettierFormatter } from "../../../src/project/formatter/PrettierFormatter";

const mockedPrettier = vi.hoisted(() => ({
  resolveConfig: vi.fn(),
  format: vi.fn(),
}));

vi.mock("prettier", () => ({
  default: mockedPrettier,
}));

describe("PrettierFormatter tests", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("init: no config found falls back to empty settings", async () => {
    mockedPrettier.resolveConfig.mockResolvedValueOnce(null);

    const formatter = new PrettierFormatter("./test.ts");
    await formatter.init();

    expect(formatter.getSettings()).toStrictEqual({});
  });

  test("init: bracketSpacing/singleQuote/trailingComma settings", async () => {
    mockedPrettier.resolveConfig.mockResolvedValueOnce({
      bracketSpacing: false,
      singleQuote: true,
      trailingComma: "none",
    });

    const formatter = new PrettierFormatter("./test.ts");
    await formatter.init();

    expect(formatter.getSettings()).toMatchObject({
      insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces: false,
      quoteKind: QuoteKind.Single,
      useTrailingCommas: false,
    });
  });

  test("init: default bracketSpacing and trailingComma when not specified", async () => {
    mockedPrettier.resolveConfig.mockResolvedValueOnce({});

    const formatter = new PrettierFormatter("./test.ts");
    await formatter.init();

    expect(formatter.getSettings()).toMatchObject({
      insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces: true,
      quoteKind: QuoteKind.Double,
      useTrailingCommas: true,
    });
  });

  test("format delegates to prettier.format with the typescript parser", async () => {
    mockedPrettier.resolveConfig.mockResolvedValueOnce({ singleQuote: true });
    mockedPrettier.format.mockResolvedValueOnce("formatted!");

    const formatter = new PrettierFormatter("./test.ts");
    await formatter.init();
    const result = await formatter.format("const x=1");

    expect(result).toBe("formatted!");
    expect(mockedPrettier.format).toHaveBeenCalledWith(
      "const x=1",
      expect.objectContaining({ parser: "typescript" }),
    );
  });

  test.each([
    [true, undefined, IndentationText.Tab],
    [false, 2, IndentationText.TwoSpaces],
    [false, 4, IndentationText.FourSpaces],
    [false, 8, IndentationText.EightSpaces],
    [false, undefined, IndentationText.TwoSpaces],
  ])("convertIndentation: useTabs=%s tabWidth=%s => %s", async (useTabs, tabWidth, expected) => {
    mockedPrettier.resolveConfig.mockResolvedValueOnce({ useTabs, tabWidth });

    const formatter = new PrettierFormatter("./test.ts");
    await formatter.init();

    expect(formatter.getSettings().indentationText).toBe(expected);
  });

  test.each([
    ["lf", NewLineKind.LineFeed],
    ["crlf", NewLineKind.CarriageReturnLineFeed],
    ["cr", NewLineKind.CarriageReturnLineFeed],
    ["auto", NewLineKind.LineFeed],
    [undefined, NewLineKind.LineFeed],
  ])("convertNewline: endOfLine=%s => %s", async (endOfLine, expected) => {
    mockedPrettier.resolveConfig.mockResolvedValueOnce({ endOfLine });

    const formatter = new PrettierFormatter("./test.ts");
    await formatter.init();

    expect(formatter.getSettings().newLineKind).toBe(expected);
  });
});
