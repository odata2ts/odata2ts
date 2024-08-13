import { NewLineKind } from "@ts-morph/common";
import { CompilerOptions, ModuleKind, ModuleResolutionKind, ScriptTarget } from "ts-morph";
import load from "tsconfig-loader";
import ts from "typescript";

import { EmitModes } from "../OptionModel.js";

/**
 * Loads the TS configuration from the specified path.
 * Then maps the appropriate options to ts-morph compiler options.
 *
 * @param tsConfigPath path to tsconfig.json
 * @param emitMode the used emit mode
 * @param outputDir the used output dir
 */
export async function loadTsMorphCompilerOptions(tsConfigPath: string, emitMode: EmitModes, outputDir: string) {
  const generateDeclarations = EmitModes.js_dts === emitMode || EmitModes.dts === emitMode;

  // load config file
  // NOTE: not async...
  // @ts-ignore
  const conf = load.default({ filename: tsConfigPath });

  const {
    // ignored props
    noEmit, // we always want to emit
    importsNotUsedAsValues, // type is missing
    jsx,
    plugins,
    // mapped props
    moduleResolution,
    lib,
    module,
    newLine,
    target,
    rootDir,
    rootDirs,
    ...passThrough
  } = conf?.tsConfig.compilerOptions || {};

  const compilerOpts: CompilerOptions = {
    ...passThrough,
    outDir: outputDir,
    declaration: generateDeclarations,
    moduleResolution: getModuleResolutionKind(moduleResolution),
    module: getModuleKind(module),
    target: getTarget(target),
  };
  if (lib) {
    compilerOpts.lib = lib as string[];
  }
  if (newLine) {
    compilerOpts.newLine = newLine?.toLowerCase() === "lf" ? NewLineKind.LineFeed : NewLineKind.CarriageReturnLineFeed;
  }

  return compilerOpts;
}

/**
 * Maps to lower case.
 * Also translates "node" to "nodejs".
 *
 * @param moduleResolution
 */
function getModuleResolutionKind(
  moduleResolution: string | undefined | Record<string, any>,
): ModuleResolutionKind | undefined {
  const modRes =
    typeof moduleResolution === "string"
      ? moduleResolution.toLowerCase() === "node"
        ? "nodejs"
        : moduleResolution.toLowerCase()
      : undefined;
  const matchedKey = Object.keys(ts.ModuleResolutionKind).find(
    (mk): mk is keyof typeof ModuleResolutionKind => mk.toLowerCase() === modRes,
  );
  return matchedKey ? (ts.ModuleResolutionKind[matchedKey] as ModuleResolutionKind) : undefined;
}

function getModuleKind(module: string | undefined | Record<string, any>): ModuleKind | undefined {
  const mod = typeof module === "string" ? module.toLowerCase() : undefined;
  const matchedKey = Object.keys(ts.ModuleKind).find((mk): mk is keyof typeof ModuleKind => mk.toLowerCase() === mod);
  return matchedKey ? (ts.ModuleKind[matchedKey] as ModuleKind) : undefined;
}

function getTarget(target: string | undefined | Record<string, any>): ScriptTarget | undefined {
  const t = typeof target === "string" ? target.toLowerCase() : undefined;
  const matchedKey = Object.keys(ts.ScriptTarget).find((st): st is keyof typeof ScriptTarget => st.toLowerCase() === t);
  return matchedKey ? (ts.ScriptTarget[matchedKey] as ScriptTarget) : undefined;
}
