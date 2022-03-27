import { BaseFormatter } from "./BaseFormatter";

/**
 * Prettier formatter.
 *
 * NOTE: Should be created like this => const formatter = await new NoopFormatter("./test.ts").init();
 *
 * @export
 * @class NoopFormatter
 * @extends {Formatter}
 */
export class NoopFormatter extends BaseFormatter {
  /**
   * Initializes the formatter.
   *
   * @abstract
   * @returns {Promise<Formatter>} Initialized formatter
   * @memberof Formatter
   */
  public async init(): Promise<BaseFormatter> {
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
    return source;
  }
}
