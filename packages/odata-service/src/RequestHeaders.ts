const JSON_VALUE = "application/json";
const BIG_NUMBER_FORMAT = `${JSON_VALUE};IEEE754Compatible=true`;

export const DEFAULT_HEADERS = { Accept: JSON_VALUE, "Content-Type": JSON_VALUE };
export const BIG_NUMBERS_HEADERS = { Accept: BIG_NUMBER_FORMAT, "Content-Type": BIG_NUMBER_FORMAT };
export const MERGE_HEADERS = { "X-Http-Method": "MERGE" };
/**
 * odata2ts targets OData 4.0 for V4 services: it is the more widely deployed and the more compatible version.
 *
 * Only declared on requests carrying a body, since the OData-Version header governs how the service interprets
 * the request payload. It is what makes the `@odata.bind` notation valid, which clients must not use when
 * declaring 4.01 (see OData JSON Format v4.01, chap. 8.5).
 */
export const ODATA_VERSION_HEADERS = { "OData-Version": "4.0" };
