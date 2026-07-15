import { ODataHttpMethods } from "@odata2ts/http-client-api";
import { RequestConverter } from "./converter/RequestConverter";
import { RequestInfo } from "./RequestInfo";

const GET_AS_POST_URL_SUFFIX = "/$query";
const GET_AS_POST_HEADER = {
  "Content-Type": "text/plain",
};

/**
 * RequestConverter to transform a GET request into a POST request.
 *
 * @param request
 * @constructor
 */
export const GetToPostConverter: RequestConverter<any> = (request) => {
  const [url, body] = request.url.split("?");
  return new RequestInfo(
    ODataHttpMethods.Post,
    url + GET_AS_POST_URL_SUFFIX,
    { ...request.headers, ...GET_AS_POST_HEADER },
    body,
  );
};
