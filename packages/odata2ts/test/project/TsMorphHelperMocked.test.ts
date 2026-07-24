import { NewLineKind } from "@ts-morph/common";
import { ModuleKind, ModuleResolutionKind, ScriptTarget } from "typescript";
import { describe, expect, test, vi } from "vitest";
import { EmitModes } from "../../src/index.js";
import { loadTsMorphCompilerOptions } from "../../src/project/TsMorphHelper.js";

const mockedLoad = vi.hoisted(() => vi.fn());

vi.mock("ts-morph");
vi.mock("tsconfig-loader", () => ({
  default: mockedLoad,
}));

describe("TsMorphHelper tests (mocked tsconfig-loader)", () => {
  const DEFAULT_TS_CONFIG = "tsconfig.json";
  const DEFAULT_OUTPUT_DIR = "build/unitTest";

  test("no config found falls back to an empty compilerOptions object", async () => {
    mockedLoad.mockReturnValueOnce(undefined);

    const result = await loadTsMorphCompilerOptions(DEFAULT_TS_CONFIG, EmitModes.ts, DEFAULT_OUTPUT_DIR);

    expect(result).toMatchObject({ outDir: DEFAULT_OUTPUT_DIR, declaration: false });
  });

  test("no lib specified: compilerOpts.lib stays unset", async () => {
    mockedLoad.mockReturnValueOnce({ tsConfig: { compilerOptions: {} } });

    const result = await loadTsMorphCompilerOptions(DEFAULT_TS_CONFIG, EmitModes.ts, DEFAULT_OUTPUT_DIR);

    expect(result.lib).toBeUndefined();
  });

  test.each([
    ["lf", NewLineKind.LineFeed],
    ["crlf", NewLineKind.CarriageReturnLineFeed],
  ])("newLine=%s maps to %s", async (newLine, expected) => {
    mockedLoad.mockReturnValueOnce({ tsConfig: { compilerOptions: { newLine } } });

    const result = await loadTsMorphCompilerOptions(DEFAULT_TS_CONFIG, EmitModes.ts, DEFAULT_OUTPUT_DIR);

    expect(result.newLine).toBe(expected);
  });

  test("unrecognized moduleResolution/module/target yield undefined", async () => {
    mockedLoad.mockReturnValueOnce({
      tsConfig: {
        compilerOptions: {
          moduleResolution: "totallyUnknown",
          module: "totallyUnknown",
          target: "totallyUnknown",
        },
      },
    });

    const result = await loadTsMorphCompilerOptions(DEFAULT_TS_CONFIG, EmitModes.ts, DEFAULT_OUTPUT_DIR);

    expect(result.moduleResolution).toBeUndefined();
    expect(result.module).toBeUndefined();
    expect(result.target).toBeUndefined();
  });

  test("undefined moduleResolution/module/target yield undefined", async () => {
    mockedLoad.mockReturnValueOnce({
      tsConfig: {
        compilerOptions: {},
      },
    });

    const result = await loadTsMorphCompilerOptions(DEFAULT_TS_CONFIG, EmitModes.ts, DEFAULT_OUTPUT_DIR);

    expect(result.moduleResolution).toBeUndefined();
    expect(result.module).toBeUndefined();
    expect(result.target).toBeUndefined();
  });

  test("moduleResolution 'node' maps via the nodejs alias to Node10", async () => {
    mockedLoad.mockReturnValueOnce({
      tsConfig: { compilerOptions: { moduleResolution: "node" } },
    });

    const result = await loadTsMorphCompilerOptions(DEFAULT_TS_CONFIG, EmitModes.ts, DEFAULT_OUTPUT_DIR);

    expect(result.moduleResolution).toBe(ModuleResolutionKind.Node10);
  });

  test("module and target are case-insensitively matched", async () => {
    mockedLoad.mockReturnValueOnce({
      tsConfig: { compilerOptions: { module: "commonjs", target: "es2016" } },
    });

    const result = await loadTsMorphCompilerOptions(DEFAULT_TS_CONFIG, EmitModes.ts, DEFAULT_OUTPUT_DIR);

    expect(result.module).toBe(ModuleKind.CommonJS);
    expect(result.target).toBe(ScriptTarget.ES2016);
  });
});
