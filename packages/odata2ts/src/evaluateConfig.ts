import deepmerge from "deepmerge";

import { getDefaultConfig, getMinimalConfig } from "./defaultConfig";
import { CliOptions, ConfigFileOptions, Modes, RunOptions } from "./OptionModel";

/**
 * Provides default values and evaluates the various config file and CLI options.
 * This function always returns a list of RunOptions,
 * whereby each item represents one generation run / one service.
 *
 * Configurations are merged in the following order (last one wins):
 * - default values
 * - config file: base settings
 * - config file: service specific settings
 * - CLI options
 *
 * If the CLI options specify source and output, then the service config is completely ignored and only the
 * base settings are applied from the config file.
 *
 * If the CLI options do not specify source and output, but do specify services, then these services must
 * exist in the config file and each service must supply values for source and output as a minimum.
 *
 * If the CLI options neither entail source nor services, then at least one service must be configured in the
 * config file. All configured services are returned.
 *
 * @param cliOpts CLI passed options
 * @param configOpts config file options
 */
export function evaluateConfigOptions(
  cliOpts: CliOptions,
  configOpts: ConfigFileOptions | undefined
): Array<RunOptions> {
  const defaultConfig = configOpts?.naming?.minimalDefaults ? getMinimalConfig() : getDefaultConfig();
  // No config file
  if (!configOpts) {
    if (!cliOpts.source || !cliOpts.output) {
      throw new Error("Without any configuration file options --source and --output must be specified!");
    }
    return [deepmerge(defaultConfig, cliOpts)];
  }

  const { services: cliServices, source, output, ...cliBaseOpts } = cliOpts;
  const { services: confServices, ...confBaseOpts } = configOpts;

  // No configurations of services in config file
  // or CLI opts specify source and output => ignore service config
  if ((source && output) || !confServices) {
    if (!source || !output) {
      throw new Error(
        "No services were configured in config file, so options --source and --output must be specified!"
      );
    }
    const merged = deepmerge.all([defaultConfig, confBaseOpts, cliOpts]) as RunOptions;
    return [safeGuardOptions(merged)];
  }

  // Either services are specified or we use all configured services
  const servicesToUse = cliServices?.length ? cliServices : Object.keys(confServices);
  return servicesToUse.map((s) => {
    const service = confServices[s];
    if (!service) {
      throw new Error(`Specified service "${s}" doesn't exist in configuration!`);
    }
    const serviceDefault =
      service.naming?.minimalDefaults && !configOpts.naming?.minimalDefaults ? getMinimalConfig() : defaultConfig;
    const merged = deepmerge.all([serviceDefault, confBaseOpts, service, cliBaseOpts]) as RunOptions;
    return safeGuardOptions(merged);
  });
}

/**
 * Make sure that some options are only active if in correct mode.
 * @param options
 */
function safeGuardOptions(options: RunOptions): RunOptions {
  // skip options are not valid for service generation
  if (options.mode === Modes.service || options.mode === Modes.all) {
    options.skipEditableModels = false;
    options.skipIdModels = false;
    options.skipOperations = false;
  }
  // special option which is only valid for model generation
  if (options.mode !== Modes.models) {
    options.v2ModelsWithExtraResultsWrapping = false;
  }

  return options;
}
