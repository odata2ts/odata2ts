import prettier from "prettier";
import { IndentationText, NewLineKind, QuoteKind } from "ts-morph";

import { BaseFormatter } from "./BaseFormatter";

export class PrettierFormatter extends BaseFormatter {
  /**
   * Prettier options found in the project.
   *
   * @private
   * @type {prettier.Options}
   * @memberof PrettierFormatter
   */
  private options!: prettier.Options;

  /**
   * Initializes the formatter.
   *
   * @returns {Promise<PrettierFormatter>} Initialized formatter
   * @memberof PrettierFormatter
   */
  public async init(): Promise<PrettierFormatter> {
    const options = await prettier.resolveConfig(this.output);

    if (options) {
      this.options = options;
      this.settings = {
        indentationText: this.convertIndentation(this.options.useTabs, this.options.tabWidth),
        insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces:
          this.options.bracketSpacing !== undefined ? this.options.bracketSpacing : true,
        newLineKind: this.convertNewline(this.options.endOfLine),
        quoteKind: this.options.singleQuote ? QuoteKind.Single : QuoteKind.Double,
        useTrailingCommas: this.options.trailingComma === "none" ? false : true,
      };
    } else {
      this.settings = {};
    };

    return this;
  }

  /**
   * Formats a given source code.
   *
   * @abstract
   * @param {string} source Source code to format
   * @returns {string} Formatted source code
   * @memberof Formatter
   */
  public async format(source: string): Promise<string> {
    return prettier.format(source, {
      parser: "typescript",
      ...this.options,
    });
  }

  /**
   * Converts prettier indentation config to ts-morph settings.
   *
   * @private
   * @param {boolean | undefined} useTabs Flag, whether to use tabs or not
   * @param {number | undefined} tabWidth Width of a simulated tab, each number represents a space
   * @returns {IndentationText} Converted indentation text
   * @memberof PrettierFormatter
   */
  private convertIndentation(useTabs: boolean | undefined, tabWidth: number | undefined): IndentationText {
    if (useTabs) return IndentationText.Tab;

    switch (tabWidth) {
      case 2:
        return IndentationText.TwoSpaces;
      case 4:
        return IndentationText.FourSpaces;
      case 8:
        return IndentationText.EightSpaces;
      default:
        return IndentationText.TwoSpaces;
    }
  }

  /**
   * Converts prettier newline config to ts-morph settings.
   *
   * @private
   * @param {string | undefined} eol prettier end-of-line config
   * @returns {NewLineKind | undefined} Converted new line kind
   * @memberof PrettierFormatter
   */
  private convertNewline(eol: string | undefined): NewLineKind | undefined {
    switch (eol) {
      case "lf":
        return NewLineKind.LineFeed;
      case "crlf":
        return NewLineKind.CarriageReturnLineFeed;
      case "cr":
        return NewLineKind.CarriageReturnLineFeed;
      case "auto":
        return NewLineKind.LineFeed;
      default:
        return NewLineKind.LineFeed;
    }
  }
}
