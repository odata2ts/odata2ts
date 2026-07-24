import { getDefaultConfig, getMinimalConfig } from "../src/index.js";

export function getTestConfig() {
  const config = getDefaultConfig();
  config.allowRenaming = true;

  return config;
}

export function getTestConfigMinimal() {
  const config = getMinimalConfig();
  config.allowRenaming = true;

  return config;
}
