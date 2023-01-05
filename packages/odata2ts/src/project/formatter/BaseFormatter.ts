import { ManipulationSettings } from "ts-morph";
import { FileFormatter } from "./FileFormatter";

/**
 * Abstract formatter.
 *
 * @export
 * @abstract
 * @class Formatter
 */
export abstract class BaseFormatter implements FileFormatter {
  /**
   * Path of the output file.
   *
   * @protected
   * @type {string}
   * @memberof Formatter
   */
  protected output: string;

  /**
   * Initialized ts-morph manipulation settings for project creation.
   *
   * @protected
   * @type {Partial<ManipulationSettings>}
   * @memberof Formatter
   */
  protected settings!: Partial<ManipulationSettings>;

  /**
   * Default constructor
   * @param {string} output Path of the output file
   * @memberof Formatter
   */
  constructor(output: string) {
    this.output = output;
  }

  /**
   * Initializes the formatter.
   *
   * @abstract
   * @returns {Promise<BaseFormatter>} Initialized formatter
   * @memberof Formatter
   */
  public abstract init(): Promise<BaseFormatter>;

  /**
   * Returns initialized ts-morph manipuation settings.
   *
   * @returns {Promise<Partial<ManipulationSettings>>} ts-morph manipulation settings
   * @memberof Formatter
   */
  public getSettings(): Partial<ManipulationSettings> {
    return this.settings;
  }

  public abstract format(source: string): Promise<string>;
}
