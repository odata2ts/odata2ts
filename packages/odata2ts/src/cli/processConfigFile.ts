import { cosmiconfig } from "cosmiconfig";
import { TypeScriptLoader } from "cosmiconfig-typescript-loader";

import { ConfigFileOptions } from "../OptionModel.js";
import { logFilePath } from "../project/logger/logFilePath.js";

export async function processConfigFile() {
  const moduleName = "odata2ts";
  const explorer = cosmiconfig(moduleName, {
    searchPlaces: [`${moduleName}.config.js`, `${moduleName}.config.ts`, `${moduleName}.config.cjs`],
    loaders: {
      ".ts": TypeScriptLoader(),
    },
  });
  const discoveredConfig = await explorer.search();

  if (discoveredConfig?.config) {
    console.log("Loaded config file: ", logFilePath(discoveredConfig.filepath));
  } else {
    console.log("No config file found.");
  }

  return discoveredConfig?.config as ConfigFileOptions;
}
