import { evaluateConfigOptions } from "../evaluateConfig";
import { processCliArgs } from "./processCliArgs";
import { processConfigFile } from "./processConfigFile";
import { startServiceGenerationRun } from "./serviceGenerationRun";

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
