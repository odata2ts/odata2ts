import { readFile } from "fs/promises";

// @ts-ignore: typings not up-to-date
import { emptyDir, pathExists } from "fs-extra/esm";
import { parseStringPromise } from "xml2js";

import { runApp } from "../app.js";
import { ODataEdmxModelBase } from "../data-model/edmx/ODataEdmxModelBase.js";
import { downloadMetadata, storeMetadata } from "../download/index.js";
import { Modes, RunOptions } from "../OptionModel.js";

export async function startServiceGenerationRun(options: RunOptions) {
  const { source, output, sourceUrl, refreshFile, sourceUrlConfig, debug, mode, emitMode, prettier, serviceName } =
    options;
  console.log("---------------------------");
  console.log(
    `Starting generation process. Service name ${serviceName ? `"${serviceName}"` : "will be detected automatically!"}`
  );

  if (debug) {
    console.log("Resolved config:", {
      source,
      output,
      sourceUrl,
      refreshFile,
      debug,
      mode: Modes[mode],
      emitMode,
      prettier,
      serviceName,
    });
  }

  // evaluate source
  const exists = await pathExists(source);
  console.log(`${exists ? "Found" : "Didn't find"} metadata file at: `, source);

  let metadataXml;
  // download metadata and store on disk
  if (sourceUrl && (!exists || refreshFile)) {
    try {
      metadataXml = await downloadMetadata(sourceUrl, sourceUrlConfig, debug);
    } catch (e) {
      console.error(`Failed to load metadata! Message: ${(e as Error)?.message}`);
      process.exit(10);
    }
    metadataXml = await storeMetadata(source, metadataXml, prettier);
  }
  // otherwise file must exist
  else if (!exists) {
    console.error(`Input source [${source}] doesn't exist!`);
    process.exit(2);
  }
  // read the metadata from file
  else {
    console.log("Reading metadata from file:", source);
    metadataXml = await readFile(source);
  }

  const metadataJson = (await parseStringPromise(metadataXml)) as ODataEdmxModelBase<any>;
  // TODO find out if "1.0" and "4.0" are really correct
  // TODO exit here if no version not suitable version was detected
  // console.log(`OData version detected: ${metadataJson["edmx:Edmx"].$.Version}`);

  // ensure that output directory exists
  try {
    await emptyDir(output);
  } catch (error) {
    console.error(`Output path [${output}] couldn't be created!`, error);
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
