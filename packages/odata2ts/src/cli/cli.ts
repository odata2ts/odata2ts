import { evaluateConfigOptions } from "../evaluateConfig.js";
import { processCliArgs } from "./processCliArgs.js";
import { processConfigFile } from "./processConfigFile.js";
import { startServiceGenerationRun } from "./serviceGenerationRun.js";

export async function run(): Promise<void> {
  let runs;
  const argv: Array<string> = process.argv;
  try {
    const cliOpts = processCliArgs(argv);
    if (cliOpts.debug) {
      console.log("CLI opts:", cliOpts);
    }
    const fileOpts = await processConfigFile();

    runs = evaluateConfigOptions(cliOpts, fileOpts);
  } catch (error: any) {
    console.error("Bad arguments!", error?.message);
    process.exit(1);
  }

  for (let run of runs) {
    await startServiceGenerationRun(run);
  }
}
