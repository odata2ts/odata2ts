import { describe, expect, test } from "vitest";
import { evaluateConfigOptions } from "../src/evaluateConfig.js";
import {
  CacheKeyMode,
  CliOptions,
  ConfigFileOptions,
  DeepInsertProps,
  EmitModes,
  getDefaultConfig,
  Modes,
  NamingStrategies,
  resolveCacheKeyMode,
} from "../src/index.js";

describe("Config Evaluation Tests", () => {
  const defaultConfig = getDefaultConfig();

  test("minimal CLI opts", () => {
    const minOpts = { source: "source", output: "output" };
    const result = evaluateConfigOptions(minOpts, undefined);

    expect(result.length).toBe(1);
    expect(result[0]).toStrictEqual({
      ...minOpts,
      ...defaultConfig,
    });
  });

  test("fail without source or output", () => {
    expect(() => evaluateConfigOptions({}, undefined)).toThrow(
      "Without any configuration file options --source and --output must be specified!",
    );
    expect(() => evaluateConfigOptions({ source: "source" }, undefined)).toThrow(
      "Without any configuration file options --source and --output must be specified!",
    );
    expect(() => evaluateConfigOptions({ output: "output" }, undefined)).toThrow(
      "Without any configuration file options --source and --output must be specified!",
    );
  });

  test("CLI options over default opts", () => {
    const allOpts: CliOptions = {
      source: "source",
      output: "output",
      serviceName: "test",
      mode: Modes.models,
      emitMode: EmitModes.ts,
      debug: true,
      prettier: true,
    };
    const result = evaluateConfigOptions(allOpts, undefined);

    expect(result[0]).toStrictEqual({
      ...defaultConfig,
      ...allOpts,
    });
  });

  test("with config file opts", () => {
    const { prettier } = defaultConfig;
    const minOpts: CliOptions = { source: "source", output: "output" };
    const opts: ConfigFileOptions = { debug: true, mode: Modes.qobjects, skipIdModels: true, converters: ["test"] };
    const result = evaluateConfigOptions(minOpts, opts);

    expect(result.length).toBe(1);
    expect(result[0]).toMatchObject({
      ...minOpts,
      prettier,
      ...opts,
    });
  });

  test("with min naming", () => {
    const minOpts: CliOptions = { source: "source", output: "output" };
    const resultMin = evaluateConfigOptions(minOpts, { naming: { minimalDefaults: true } });
    const resultDefault = evaluateConfigOptions(minOpts, { naming: { minimalDefaults: false } });

    const idModels = {
      applyModelNaming: true,
      prefix: "",
      suffix: "Id",
    };

    expect(resultMin.length).toBe(1);
    expect(resultMin[0].naming.models.idModels).toStrictEqual(idModels);
    expect(resultMin[0].naming.models.namingStrategy).toBeUndefined();
    expect(resultMin[0].naming.models.propNamingStrategy).toBeUndefined();

    expect(resultDefault[0].naming.models.idModels).toStrictEqual(idModels);
    expect(resultDefault[0].naming.models.namingStrategy).toStrictEqual(NamingStrategies.PASCAL_CASE);
    expect(resultDefault[0].naming.models.propNamingStrategy).toStrictEqual(NamingStrategies.CAMEL_CASE);
  });

  test("fail with config but without source or output", () => {
    const opts: ConfigFileOptions = { debug: true, mode: Modes.qobjects };
    expect(() => evaluateConfigOptions({}, opts)).toThrow(
      "No services were configured in config file, so options --source and --output must be specified!",
    );
    expect(() => evaluateConfigOptions({ source: "source" }, opts)).toThrow(
      "No services were configured in config file, so options --source and --output must be specified!",
    );
    expect(() => evaluateConfigOptions({ output: "output" }, opts)).toThrow(
      "No services were configured in config file, so options --source and --output must be specified!",
    );
  });

  test("CLI options over config file opts", () => {
    const cliOpts: CliOptions = {
      source: "source",
      output: "output",
      mode: Modes.models,
      emitMode: EmitModes.ts,
    };
    const result = evaluateConfigOptions(cliOpts, { mode: Modes.qobjects });

    expect(result[0].mode).toBe(cliOpts.mode);
    expect(result[0].emitMode).toBe(cliOpts.emitMode);
  });

  test("with service config", () => {
    const testService = { source: "source", output: "output" };
    const opts: ConfigFileOptions = { services: { test: testService } };
    const result = evaluateConfigOptions({}, opts);

    expect(result.length).toBe(1);
    expect(result[0]).toStrictEqual({
      ...defaultConfig,
      ...testService,
    });
  });

  test("with service config: using minimal default naming", () => {
    const testService = { source: "source", output: "output", naming: { minimalDefaults: true } };
    const opts: ConfigFileOptions = { services: { test: testService } };
    let result = evaluateConfigOptions({}, opts);

    expect(result.length).toBe(1);
    expect(result[0].naming.models.namingStrategy).toBeUndefined();
    expect(result[0].naming.models.propNamingStrategy).toBeUndefined();

    result = evaluateConfigOptions({}, { naming: { minimalDefaults: true }, services: { test: testService } });
    expect(result[0].naming.models.namingStrategy).toBeUndefined();
    expect(result[0].naming.models.propNamingStrategy).toBeUndefined();
  });

  test("with service config: using base config", () => {
    const testService = { source: "source", output: "output", mode: Modes.models };
    const opts: ConfigFileOptions = {
      mode: Modes.qobjects,
      emitMode: EmitModes.ts,
      converters: ["test"],
      services: { test: testService },
    };
    const result = evaluateConfigOptions({}, opts);

    expect(result.length).toBe(1);
    expect(result[0]).toStrictEqual({
      ...defaultConfig,
      emitMode: EmitModes.ts,
      converters: ["test"],
      ...testService,
    });
  });

  test("with service config: converters", () => {
    const testService = { source: "source", output: "output", converters: ["serviceConverters"] };
    const opts: ConfigFileOptions = {
      converters: ["baseConverters"],
      services: { test: testService },
    };
    const result = evaluateConfigOptions({}, opts);

    expect(result.length).toBe(1);
    expect(result[0]).toStrictEqual({
      ...defaultConfig,
      ...testService,
      converters: ["baseConverters", "serviceConverters"],
    });
  });

  test("with service config: multiple services", () => {
    const testService = { source: "source", output: "output", mode: Modes.models };
    const opts: ConfigFileOptions = {
      mode: Modes.qobjects,
      emitMode: EmitModes.ts,
      services: { test: testService, test2: testService },
    };
    const result = evaluateConfigOptions({}, opts);

    expect(result.length).toBe(2);
    expect(result[1]).toStrictEqual({
      ...defaultConfig,
      emitMode: EmitModes.ts,
      ...testService,
    });
  });

  test("with service config: CLI options win", () => {
    const testService = { source: "source", output: "output", mode: Modes.models };
    const opts: ConfigFileOptions = { mode: Modes.qobjects, services: { test: testService } };
    const result = evaluateConfigOptions({ mode: Modes.service }, opts);

    expect(result.length).toBe(1);
    expect(result[0]).toStrictEqual({
      ...defaultConfig,
      ...testService,
      mode: Modes.service,
    });
  });

  test("with service config: CLI options with source ignores service config", () => {
    const cliOpts: CliOptions = { source: "testSource", output: "testOutput" };
    const service = { source: "source", output: "output", mode: Modes.models };
    const baseOpts = {
      mode: Modes.qobjects,
      emitMode: EmitModes.ts,
    };
    const opts: ConfigFileOptions = {
      ...baseOpts,
      services: { test: service, test2: service },
    };
    const result = evaluateConfigOptions(cliOpts, opts);

    expect(result.length).toBe(1);
    expect(result[0]).toStrictEqual({
      ...defaultConfig,
      ...baseOpts,
      ...cliOpts,
    });
  });

  test("with service config: use specified services", () => {
    const cliOpts: CliOptions = { services: ["test2", "test3"] };
    const service = { source: "source", output: "output", mode: Modes.models };
    const service2 = { source: "source2", output: "output2" };
    const service3 = { source: "source3", output: "output3" };
    const baseOpts = {
      mode: Modes.qobjects,
      emitMode: EmitModes.ts,
    };
    const opts: ConfigFileOptions = {
      ...baseOpts,
      services: { test: service, test2: service2, test3: service3 },
    };
    const result = evaluateConfigOptions(cliOpts, opts);

    expect(result.length).toBe(2);
    expect(result[0]).toStrictEqual({
      ...defaultConfig,
      ...baseOpts,
      ...service2,
    });
  });

  test("fail if CLI specifies non existing service", () => {
    const testService = { source: "source", output: "output" };
    const cliOpts: CliOptions = { services: ["xxx"] };
    const opts: ConfigFileOptions = { services: { test: testService } };
    expect(() => evaluateConfigOptions(cliOpts, opts)).toThrow(
      `Specified service "xxx" doesn't exist in configuration!`,
    );
  });

  test("safeguard skip options", () => {
    const cliOpts: CliOptions = { source: "source", output: "output" };
    const opts: ConfigFileOptions = {
      mode: Modes.service,
      debug: true,
      skipEditableModels: true,
      skipIdModels: true,
      skipOperations: true,
    };
    const result = evaluateConfigOptions(cliOpts, opts);

    expect(result.length).toBe(1);
    expect(result[0]).toMatchObject({
      debug: true,
      skipEditableModels: false,
      skipIdModels: false,
      skipOperations: false,
    });
  });

  /**
   * The wrapping is what the service sends and expects, so it concerns every generated artefact. The
   * client passes the structure through untouched, which is why a generated service has to state it in
   * its types just as a bare model does.
   */
  test("both extra wrapping options survive in every mode", () => {
    const cliOpts: CliOptions = { source: "source", output: "output" };
    const wrappingOpts = {
      v2ResponseResultsWrapping: true,
      v2PayloadResultsWrapping: true,
    };

    [Modes.models, Modes.qobjects, Modes.service, Modes.all].forEach((mode) => {
      const result = evaluateConfigOptions(cliOpts, { mode, ...wrappingOpts });

      expect(result[0], `mode ${mode}`).toMatchObject(wrappingOpts);
    });
  });

  /**
   * The deep insert props, unlike the wrapping, are meant for the generated services as well - that is
   * where a deep insert is actually sent.
   */
  test("deep insert props survive every mode", () => {
    const cliOpts: CliOptions = { source: "source", output: "output" };

    [Modes.service, Modes.qobjects, Modes.all, Modes.models].forEach((mode) => {
      const result = evaluateConfigOptions(cliOpts, { mode, deepInsertProps: DeepInsertProps.compositionOnly });

      expect(result[0], `mode ${mode}`).toMatchObject({ deepInsertProps: DeepInsertProps.compositionOnly });
    });
  });

  describe("cacheKeys option", () => {
    test("absent means off", () => {
      expect(resolveCacheKeyMode(undefined)).toBe(CacheKeyMode.off);
    });

    test("a named mode is passed through", () => {
      expect(resolveCacheKeyMode({ mode: CacheKeyMode.on })).toBe(CacheKeyMode.on);
      expect(resolveCacheKeyMode({ mode: CacheKeyMode.off })).toBe(CacheKeyMode.off);
    });

    test("the default is off, so a config saying nothing generates nothing", () => {
      const [only] = evaluateConfigOptions({}, { services: { a: { source: "a.xml", output: "a" } } });
      expect(only.cacheKeys).toEqual({ mode: CacheKeyMode.off });
      expect(resolveCacheKeyMode(only.cacheKeys)).toBe(CacheKeyMode.off);
    });

    test("it is a per-service option, overridable from the base settings", () => {
      const [first, second] = evaluateConfigOptions(
        {},
        {
          cacheKeys: { mode: CacheKeyMode.on },
          services: {
            a: { source: "a.xml", output: "a" },
            b: { source: "b.xml", output: "b", cacheKeys: { mode: CacheKeyMode.off } },
          },
        },
      );
      expect(first.cacheKeys).toEqual({ mode: CacheKeyMode.on });
      expect(second.cacheKeys).toEqual({ mode: CacheKeyMode.off });
    });

    test("a service overrides the default rather than merging with it", () => {
      // deepmerge folds the default {mode:"off"} under the service's own entry; the service must win
      const [only] = evaluateConfigOptions(
        {},
        { services: { a: { source: "a.xml", output: "a", cacheKeys: { mode: CacheKeyMode.on } } } },
      );
      expect(only.cacheKeys).toEqual({ mode: CacheKeyMode.on });
    });
  });
});
