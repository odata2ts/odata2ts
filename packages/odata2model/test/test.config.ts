import { getDefaultConfig } from "../src";

export function getTestConfig() {
  const config = getDefaultConfig();
  config.allowRenaming = true;

  return config;
}
