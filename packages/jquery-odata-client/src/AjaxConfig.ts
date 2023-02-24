const DEFAULT_CONFIG: JQuery.AjaxSettings = {
  // we never want caching
  cache: false,
  // we always want JSON
  dataType: "json",
  headers: { Accept: "application/json", "Content-Type": "application/json" },
};

/**
 * Available config options for end user when making a given request.
 */
export type AjaxRequestConfig = Pick<
  JQuery.AjaxSettings,
  "complete" | "beforeSend" | "headers" | "statusCode" | "timeout"
>;

export function getDefaultConfig(config?: AjaxRequestConfig): JQuery.AjaxSettings {
  return mergeAjaxConfig(DEFAULT_CONFIG, config);
}

export function mergeAjaxConfig(config?: JQuery.AjaxSettings, toMerge?: JQuery.AjaxSettings) {
  const { headers, ...passThrough } = config || {};
  const { headers: headers2, ...passThrough2 } = toMerge || {};
  return {
    ...passThrough,
    ...passThrough2,
    headers: {
      ...headers,
      ...headers2,
    },
  };
}
