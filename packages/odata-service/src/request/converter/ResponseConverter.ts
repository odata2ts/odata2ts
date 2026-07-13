import { HttpResponseModel } from "@odata2ts/http-client-api";

/**
 * Custom response converter supplied by end user.
 * The whole response structure can be changed.
 */
export type ResponseConverter<Source, Target> = (response: HttpResponseModel<Source>) => HttpResponseModel<Target>;
