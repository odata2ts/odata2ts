import { HttpResponseModel } from "@odata2ts/http-client-api";

export const createResponse = <T>(value: T): HttpResponseModel<T> => {
  return {
    status: 200,
    statusText: "OK",
    headers: {},
    data: value,
  };
};
