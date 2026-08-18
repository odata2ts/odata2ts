/*
 * Helper types to mark immutable properties and to filter them out when needed.
 *
 * Properties are recognised as immutable either by the annotation `Core.Immutable` or by virtue of being an
 * entity key that is not otherwise annotated. Immutable properties are special as they require a differentiation
 * between creatable and updatable: On create the property is optional or required (decided by `nullable`) and on
 * update the value is not allowed to change.
 */

declare const immutable: unique symbol;

/**
 * Marks the properties of a creatable model which may be stated when the entity is created and never
 * after: an immutable property, and a key.
 */
export interface Immutable<K extends string> {
  readonly [immutable]?: K;
}

/**
 * Turns a creatable model into the updatable one, all the way down: every immutable property is dropped,
 * from the model itself and from every model nested in it through a complex or navigation property.
 */
export type Updatable<T> =
  T extends Array<infer E>
    ? Array<Updatable<E>>
    : T extends Immutable<infer K>
      ? { [P in keyof T as Exclude<P, K | typeof immutable>]: Updatable<T[P]> }
      : T extends object
        ? { [P in keyof T]: Updatable<T[P]> }
        : T;
