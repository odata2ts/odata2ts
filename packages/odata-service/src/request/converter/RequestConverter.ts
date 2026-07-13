import { QParamModel, QueryObjectModel } from "@odata2ts/odata-query-objects";
import { RequestInfo } from "../RequestInfo";

/**
 * Custom request converter supplied by end user. The whole request can be changed: URL, method, headers and data.
 */
export type RequestConverter<UserType, ODataType = UserType> = (
  request: RequestInfo<UserType>,
) => RequestInfo<ODataType>;

/**
 * QueryObjects serve to convert data from user model to OData conform model when it comes the typical CRUD methods.
 * For actions data is converted by QParamModel.
 *
 * The end user can supply custom request converters.
 */
export type MainRequestConverter<UserType, ODataType = UserType> =
  | Pick<QueryObjectModel<ODataType, UserType>, "convertToOData">
  | Pick<QParamModel<ODataType, UserType>, "convertTo">;
