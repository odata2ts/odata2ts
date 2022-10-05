import { ValueConverter } from "@odata2ts/odata-query-objects";

import { ODataTypesV3 } from "./data-model/edmx/ODataEdmxModelV3";
import { ODataTypesV4 } from "./data-model/edmx/ODataEdmxModelV4";

export enum Modes {
  models,
  qobjects,
  service,
  all,
}

export enum EmitModes {
  ts = "ts",
  js = "js",
  dts = "dts",
  js_dts = "js-dts",
}

export interface ProjectOptions {
  source: string;
  output: string;
  mode: keyof typeof Modes;
  modelPrefix: string;
  modelSuffix: string;
  prettier: boolean;
  debug: boolean;
  emitMode: keyof typeof EmitModes;
  serviceName?: string;
  generation?: GenerationOptions;
}

export interface ConfigOptions extends Omit<Partial<ProjectOptions>, "source" | "output"> {}

export interface RunOptions extends Omit<ProjectOptions, "source" | "mode" | "emitMode"> {
  mode: Modes;
  emitMode: EmitModes;
}

export interface GenerationOptions {
  /**
   * If activated, no Editable models are generated.
   * Only applies if mode is set to model or Q-object generation; required by service generation.
   *
   * False by default.
   */
  skipEditableModel?: boolean;
  /**
   * If set to true, id models and QId functions are not generated.
   * Only applies if mode is set to model or Q-object generation; required by service generation.
   *
   * False by default.
   */
  skipIdModel?: boolean;
  /**
   * If activated, neither models for operation params nor QActions or QFunctions are generated.
   * Only applies if mode is set to model or Q-object generation; required by service generation.
   *
   * False by default.
   */
  skipOperationModel?: boolean;

  model?: EntityGenerationOptions;
  idModel?: EntityGenerationOptions;
  paramModel?: EntityGenerationOptions;
  qEntity?: EntityGenerationOptions;
  qIdFunction?: EntityGenerationOptions;
  qFunction?: EntityGenerationOptions;
  qAction?: EntityGenerationOptions;
  service?: EntityGenerationOptions;

  typeConverters?: Map<ODataTypesV3 | ODataTypesV4, string | Array<string>>;
  custom?: ServiceSpecificGenerationOptions;
}

export interface EntityGenerationOptions {
  prefix?: string;
  suffix?: string;
  // namingStrategy?: PascalCaseNamingStrategy,
  // propNamingStrategy?: CamelCaseNamingStrategy
}

export interface ServiceSpecificGenerationOptions extends Record<string, CustomGenerationOptions> {}

export interface CustomGenerationOptions extends Record<string, any> {
  entityType?: Record<string, EntityTypeGenerationOptions>;
}

export interface EntityTypeGenerationOptions {
  mappedName?: string;
  // converter: string | Array<string>
  properties?: Record<string, PropertyGenerationOptions>;
}

export interface PropertyGenerationOptions {
  mappedName?: string;
  converter?: string | Array<string>;
}
