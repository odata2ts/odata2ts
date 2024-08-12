import { NewLineKind } from "@ts-morph/common";
import { ModuleKind, ModuleResolutionKind, ScriptTarget } from "typescript";
import { vi } from "vitest";

import { EmitModes } from "../../src";
import { loadTsMorphCompilerOptions } from "../../src/project/TsMorphHelper";

// global mock for ts-morph to keep this a unit test
vi.mock("ts-morph");

describe("TsMorphHelper Test", () => {
  const DEFAULT_TS_CONFIG = "tsconfig.json";
  const DEFAULT_OUTPUT_DIR = "build/unitTest";
  const DEFAULT_EMIT_MODE = EmitModes.ts;

  // Loads the tsconfig file from this project
  test("Load project tsconfig.json", async () => {
    const result = await loadTsMorphCompilerOptions(DEFAULT_TS_CONFIG, DEFAULT_EMIT_MODE, DEFAULT_OUTPUT_DIR);

    expect(result).toMatchObject({
      // required
      outDir: DEFAULT_OUTPUT_DIR,
      // calculated props
      declaration: false,
      // mapped props
      target: ScriptTarget.ES2016,
      module: ModuleKind.ESNext,
      moduleResolution: ModuleResolutionKind.Node10,
      // passed props
      lib: ["esnext"],
      types: ["node"],
      strict: true,
      allowJs: true,
    });
  });

  // skipped as this doesn't work for CI build
  test.skip("Use alternative tsconfig", async () => {
    const altConfig = "./test/project/fixture/alt-conf.json";
    const result = await loadTsMorphCompilerOptions(altConfig, DEFAULT_EMIT_MODE, DEFAULT_OUTPUT_DIR);

    expect(result).toStrictEqual({
      // required
      outDir: DEFAULT_OUTPUT_DIR,
      // calculated props
      declaration: false,
      // mapped props
      module: ModuleKind.ESNext,
      moduleResolution: ModuleResolutionKind.Classic,
      target: ScriptTarget.ESNext,
      newLine: NewLineKind.CarriageReturnLineFeed,
      // passed props
      strict: false,
      noFallthroughCasesInSwitch: false,
    });
  });

  test("test output dir", async () => {
    const outputDir = "new/outdir";

    const result = await loadTsMorphCompilerOptions(DEFAULT_TS_CONFIG, DEFAULT_EMIT_MODE, outputDir);

    expect(result).toMatchObject({
      outDir: outputDir,
    });
  });

  test("emit modes produce correct declaration setting", async () => {
    let result = await loadTsMorphCompilerOptions(DEFAULT_TS_CONFIG, EmitModes.js_dts, DEFAULT_OUTPUT_DIR);
    expect(result).toMatchObject({ declaration: true });
    result = await loadTsMorphCompilerOptions(DEFAULT_TS_CONFIG, EmitModes.dts, DEFAULT_OUTPUT_DIR);
    expect(result).toMatchObject({ declaration: true });

    result = await loadTsMorphCompilerOptions(DEFAULT_TS_CONFIG, EmitModes.js, DEFAULT_OUTPUT_DIR);
    expect(result).toMatchObject({ declaration: false });
    result = await loadTsMorphCompilerOptions(DEFAULT_TS_CONFIG, EmitModes.ts, DEFAULT_OUTPUT_DIR);
    expect(result).toMatchObject({ declaration: false });
  });
});
