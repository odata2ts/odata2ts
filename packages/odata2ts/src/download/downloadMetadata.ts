import axios, { AxiosRequestConfig } from "axios";
import deepmerge from "deepmerge";
import { UrlSourceConfiguration } from "../OptionModel.js";

const METADATA_PATH = "$metadata";
const PWD_BLIND_TEXT = { password: "xxx hidden xxx" };

function evaluateRequestConfig(url: string, config: UrlSourceConfiguration): AxiosRequestConfig {
  const defaultReqConfig: AxiosRequestConfig = {
    url: url,
    method: "GET",
    headers: {
      // Added Accept: "application/xml" to ensure OData API servers
      // return metadata in XML format, as axios defaults to application/json.
      Accept: "application/xml",
    },
  };
  const reqConfig: AxiosRequestConfig = config.custom
    ? config.custom
    : typeof config.username === "string" && typeof config?.password === "string"
      ? { auth: { username: config.username, password: config.password } }
      : {};
  return deepmerge(defaultReqConfig, reqConfig);
}

/**
 * Retrieves the metadata from the given URL using the given configuration.
 *
 * Failure handling must be implemented by consumer.
 * Exception is thrown for failed requests (400, 401, ...).
 *
 * @param sourceUrl
 * @param sourceConfig
 * @param debug
 */
export async function downloadMetadata(
  sourceUrl: string,
  sourceConfig: UrlSourceConfiguration = {},
  debug: boolean = false,
): Promise<string> {
  // add the $metadata suffix
  const url = sourceUrl.endsWith(METADATA_PATH)
    ? sourceUrl
    : sourceUrl + (sourceUrl.endsWith("/") ? "" : "/") + METADATA_PATH;
  console.log(`Reading metadata from URL:`, url);

  // evaluate configured request config options
  const config = evaluateRequestConfig(url, sourceConfig);

  // log request configuration without password
  if (debug) {
    const { auth, ...loggable } = config;
    const safeConfig = auth ? { ...loggable, auth: { ...auth, ...(auth.password ? PWD_BLIND_TEXT : {}) } } : loggable;
    console.log(`Request configuration:`, safeConfig);
  }

  // execute the request & return response data
  const response = await axios.request(config);
  return response.data;
}
