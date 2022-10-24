import { ValueConverterType } from "@odata2ts/converter-api";

/**
 * Allows for further configuration of a converter.
 */
export interface TypeConverterConfig {
  /**
   * The package or module name, e.g. "@odata2ts/converter-v2-to-v4".
   */
  module: string;
  /**
   * Single converter id or list of converter ids of this module to use.
   */
  use?: Array<string>;
  // use?: string | Array<string>;
}

export interface RuntimeConverterPackage {
  package: string;
  /**
   * List of converters offered by this package.
   */
  converters: Array<ValueConverterType>;
}

export interface ValueConverterImport {
  package: string;
  converterId: string;
}

export interface ValueConverterChain {
  from: string;
  to: string;
  toModule?: string;
  converters: Array<ValueConverterImport>;
}
