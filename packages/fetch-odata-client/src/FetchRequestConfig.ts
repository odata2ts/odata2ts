const DEFAULT_CONFIG: RequestInit = {
  headers: { Accept: "application/json", "Content-Type": "application/json" },
  cache: "no-cache",
};

/**
 * Available config options for end user when making a given request.
 */
export interface FetchRequestConfig
  extends Pick<RequestInit, "credentials" | "cache" | "mode" | "redirect" | "referrerPolicy"> {
  headers?: Record<string, string> | Headers;
}

export interface InternalFetchConfig extends Omit<RequestInit, "headers"> {
  headers: Headers;
}

export function getDefaultConfig(config?: FetchRequestConfig): RequestInit {
  return mergeFetchConfig(DEFAULT_CONFIG, config);
}

export function mergeFetchConfig(): undefined;
export function mergeFetchConfig(...configs: Array<RequestInit | undefined>): InternalFetchConfig;
export function mergeFetchConfig(...configs: Array<RequestInit | undefined>) {
  if (!configs.length) {
    return undefined;
  }
  return configs
    .filter((c): c is RequestInit => !!c)
    .reduce<InternalFetchConfig>(
      (collector, current) => {
        const { headers, ...passThrough } = current;
        const collectedHeaders = collector.headers as Headers;

        // headers as Headers object
        if (headers && headers instanceof Headers) {
          headers.forEach((val, key) => collectedHeaders.set(key, val));
        }
        // headers as plain Record<string,string>
        else if (headers) {
          Object.entries(headers).forEach(([key, val]) => collectedHeaders.set(key, val));
        }

        return { ...collector, ...passThrough };
      },
      { headers: new Headers() }
    );
}
