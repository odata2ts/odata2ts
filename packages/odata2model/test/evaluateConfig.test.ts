import { CliOptions, ConfigFileOptions, EmitModes, Modes, getDefaultConfig } from "../src";
import { evaluateConfigOptions } from "../src/evaluateConfig";

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
      "Without any configuration file options --source and --output must be specified!"
    );
    expect(() => evaluateConfigOptions({ source: "source" }, undefined)).toThrow(
      "Without any configuration file options --source and --output must be specified!"
    );
    expect(() => evaluateConfigOptions({ output: "output" }, undefined)).toThrow(
      "Without any configuration file options --source and --output must be specified!"
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

  test("fail with config but without source or output", () => {
    const opts: ConfigFileOptions = { debug: true, mode: Modes.qobjects };
    expect(() => evaluateConfigOptions({}, opts)).toThrow(
      "No services were configured in config file, so options --source and --output must be specified!"
    );
    expect(() => evaluateConfigOptions({ source: "source" }, opts)).toThrow(
      "No services were configured in config file, so options --source and --output must be specified!"
    );
    expect(() => evaluateConfigOptions({ output: "output" }, opts)).toThrow(
      "No services were configured in config file, so options --source and --output must be specified!"
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

  test("with service config: using base config", () => {
    const testService = { source: "source", output: "output", mode: Modes.models };
    const opts: ConfigFileOptions = { mode: Modes.qobjects, emitMode: EmitModes.ts, services: { test: testService } };
    const result = evaluateConfigOptions({}, opts);

    expect(result.length).toBe(1);
    expect(result[0]).toStrictEqual({
      ...defaultConfig,
      emitMode: EmitModes.ts,
      ...testService,
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

  test("with service config: CLI options with source ignore service config", () => {
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
});
