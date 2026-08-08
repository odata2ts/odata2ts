/**
 * Blocks inference of `T` from the argument it annotates, so that a type parameter which has a
 * default is only ever what the caller wrote or what the default says - never what the passed object happens
 * to look like.
 *
 * This matters for the request config: {@link ODataRequestConfig} declares nothing but optional properties,
 * so every object structurally satisfies it. Were the type parameter inferable, `execute({ whatever: 1 })`
 * would infer `{ whatever: number }`, pass the constraint and silently accept a config the chosen HTTP
 * client knows nothing about.
 *
 * TypeScript ships this as `NoInfer` since 5.4, but the peer range of the generator declares 4.7 as
 * the lower bound, so it is spelled out here. The indexed access into a one-element tuple defers resolution,
 * which is what keeps the inference engine out of it.
 */
export type NoInferConfig<T> = [T][T extends any ? 0 : never];
