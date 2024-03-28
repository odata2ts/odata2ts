import { ModuleKind, ModuleResolutionKind, ScriptTarget } from "ts-morph";
import ts from "typescript";

export function getModuleResolutionKind(
  moduleResolution: string | undefined | Record<string, any>
): ModuleResolutionKind | undefined {
  const modRes =
    typeof moduleResolution === "string"
      ? moduleResolution.toLowerCase() === "node"
        ? "nodejs"
        : moduleResolution.toLowerCase()
      : undefined;
  const matchedKey = Object.keys(ts.ModuleResolutionKind).find(
    (mk): mk is keyof typeof ModuleResolutionKind => mk.toLowerCase() === modRes
  );
  return matchedKey ? (ts.ModuleResolutionKind[matchedKey] as ModuleResolutionKind) : undefined;
}

export function getModuleKind(module: string | undefined | Record<string, any>): ModuleKind | undefined {
  const mod = typeof module === "string" ? module.toLowerCase() : undefined;
  const matchedKey = Object.keys(ts.ModuleKind).find((mk): mk is keyof typeof ModuleKind => mk.toLowerCase() === mod);
  return matchedKey ? (ts.ModuleKind[matchedKey] as ModuleKind) : undefined;
}

export function getTarget(target: string | undefined | Record<string, any>): ScriptTarget | undefined {
  const t = typeof target === "string" ? target.toLowerCase() : undefined;
  const matchedKey = Object.keys(ts.ScriptTarget).find((st): st is keyof typeof ScriptTarget => st.toLowerCase() === t);
  return matchedKey ? (ts.ScriptTarget[matchedKey] as ScriptTarget) : undefined;
}
