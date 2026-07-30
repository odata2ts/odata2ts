/*
 * Helpers to combine the prefixed control information of OData 4.0 with the short form of 4.01 without
 * allowing a mix of both. Package private on purpose: only the composed types are part of the public API.
 */

/**
 * The given type, with all properties exclusive to the other one forbidden.
 */
export type Only<T, U> = T & { [K in Exclude<keyof U, keyof T>]?: never };

/**
 * One of the two types, but never a mix of both. Properties of either can still be read,
 * yielding {@code undefined} for the type which doesn't declare them.
 */
export type EitherOr<T, U> = Only<T, U> | Only<U, T>;
