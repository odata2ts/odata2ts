const JSON_VALUE = "application/json";
const BIG_NUMBER_FORMAT = `${JSON_VALUE};IEEE754Compatible=true`;

export const DEFAULT_HEADERS = { Accept: JSON_VALUE, "Content-Type": JSON_VALUE };
export const BIG_NUMBERS_HEADERS = { Accept: BIG_NUMBER_FORMAT, "Content-Type": BIG_NUMBER_FORMAT };
export const MERGE_HEADERS = { "X-Http-Method": "MERGE" };
