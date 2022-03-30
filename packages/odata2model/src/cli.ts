import commander, { Option } from "commander";
import { ensureDir, pathExists, readFile } from "fs-extra";
import { parseStringPromise } from "xml2js";

import { runApp } from "./app";
import { EmitModes, Modes, ProjectOptions, RunOptions } from "./OptionModel";
import { ODataEdmxModel } from "./data-model/edmx/ODataEdmxModel";

export class Cli {
  async run(): Promise<void> {
    const cli = new commander.Command()
      .version("0.1.0")
      .description("CLI to generate Typescript Interfaces for models of a given OData service.")
      .requiredOption("-s, --source <metadata.xml>", "Metadata file describing the OData service")
      .requiredOption("-o, --output <path>", "Output location for generated files")
      .addOption(
        new Option("-m, --mode <mode>", "What kind of stuff gets generated")
          .choices(["models", "qobjects", "service", "all"])
          .default("all")
      )
      .addOption(
        new Option(
          "-e, --emit-mode <mode>",
          "Output TS source files, compiled JS files with/wihthout generated d.ts files"
        )
          .choices(Object.values(EmitModes))
          .default("js-dts")
      )
      .option("-prefix, --model-prefix <prefix>", "Prefix the generated interfaces with a static string", "")
      .option("-suffix, --model-suffix <suffix>", "Sufffix the generated interfaces with a static string", "")
      .option("-p, --prettier", "Format result with prettier", false)
      .option("-d, --debug", "Verbose debug infos", false)
      .parse(process.argv);

    const { source, emitMode, mode, ...opts } = cli.opts() as ProjectOptions;
    const options: RunOptions = {
      mode: Modes[mode],
      emitMode: emitMode as EmitModes,
      ...opts,
    };

    if (options.debug) {
      console.log("Provided Options:", {
        ...options,
        source,
        mode,
        emitMode,
      });
    }

    console.log("Reading file:", source);
    const exists = await pathExists(source);
    if (!exists) {
      console.error(`Input source [${source}] doesn't exist!`);
      process.exit(2);
    }

    // read metadata file and convert to JSON
    const metadataXml = await readFile(source);
    const metadataJson = (await parseStringPromise(metadataXml)) as ODataEdmxModel;

    // ensure that output directory exists
    try {
      await ensureDir(options.output);
    } catch (error) {
      console.error(`Output path [${options.output}] couldn't be created!`, error);
      process.exit(3);
    }

    // run the app
    try {
      await runApp(metadataJson, options);
    } catch (err: any) {
      console.error("Error while running the program", err);
      process.exit(99);
    }
  }
}
