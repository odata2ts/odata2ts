import { QParamModel } from "../param/QParamModel";
import { QueryObjectModel } from "../QueryObjectModel";

/**
 * The main ResponseDataConverter interface, which allows to convert from the OData model to the user model.
 */
export type ResponseDataConverter<ConvertedType> =
  | Pick<QParamModel<any, ConvertedType>, "convertFrom">
  | Pick<QueryObjectModel<any, ConvertedType>, "convertFromOData">;

/**
 * OData V2 responds to value queries with a partial entity model only consisting of the given property.
 * Hence, we need a special value converter for V2 which can also map the property name.
 *
 * However, to reduce complexity we hide this fact and publicly use the ResponseConverter interface,
 * while the corresponding converter and adapter implement this prop name mapping feature.
 */
export type ResponseValueConverterV2<ConvertedType> = Pick<QParamModel<any, ConvertedType>, "convertFrom"> &
  Partial<Pick<QParamModel<any, any>, "getName" | "getMappedName">>;
