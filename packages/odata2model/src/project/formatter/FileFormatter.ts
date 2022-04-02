import { ManipulationSettings } from "ts-morph";

export interface FileFormatter {
  /**
   * Returns initialized ts-morph manipulation settings.
   *
   * @returns {Partial<ManipulationSettings>} ts-morph manipulation settings
   */
  getSettings(): Partial<ManipulationSettings>;

  /**
   * Formats a given source code.
   *
   * @param {string} source Source code to format
   * @returns {string} Formatted source code
   */
  format(source: string): Promise<string>;
}
