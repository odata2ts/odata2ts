const DEFAULT_CONFIG: RequestInit = {
  headers: { Accept: "application/json", "Content-Type": "application/json" },
  cache: "no-cache",
};

/**
 * Available config options for end user when making a given request.
 */
export type FetchRequestConfig = Pick<
  RequestInit,
  "headers" | "credentials" | "cache" | "mode" | "redirect" | "referrerPolicy"
>;

export function getDefaultConfig(config?: FetchRequestConfig): RequestInit {
  return mergeFetchConfig(DEFAULT_CONFIG, config);
}

export function mergeFetchConfig(config?: RequestInit, toMerge?: FetchRequestConfig): RequestInit {
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
