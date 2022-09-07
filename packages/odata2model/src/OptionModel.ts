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

export interface GenerationOptions {
  /**
   * If activated, no Editable models are generated.
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
}

export interface RunOptions extends Omit<ProjectOptions, "source" | "mode" | "emitMode"> {
  mode: Modes;
  emitMode: EmitModes;
}
