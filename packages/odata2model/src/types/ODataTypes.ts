/**
 * Represents an ISO 8601 date.
 * Format: YYYY-MM-DD
 * Example: "2021-01-31"
 */
export type DateString = string;

/**
 * Represents an ISO 8601 time.
 * Format: hh:mm:ss.sss
 * Example: "13:21:00"
 * Example: "13:21:00.123"
 */
export type TimeOfDayString = string;

/**
 * Represents an ISO 8601 date time with offset.
 * Format: YYYY-MM-DD'T'hh:mm:ss'Z'
 * Example: "2021-01-31T13:21:00Z"
 */
export type DateTimeOffsetString = string;
