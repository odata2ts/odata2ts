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
}

export interface RunOptions extends Omit<ProjectOptions, "source" | "mode" | "emitMode"> {
  mode: Modes;
  emitMode: EmitModes;
}
