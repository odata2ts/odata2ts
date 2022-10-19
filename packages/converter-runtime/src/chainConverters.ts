import { ChainableValueConverter, ValueConverter } from "@odata2ts/converter-api";

import { ChainedConverter } from "./ChainedConverter";

export function createChain<Source, Temp, Target>(
  converterA: ValueConverter<Source, Temp>,
  converterB: ValueConverter<Temp, Target>
): ChainableValueConverter<Source, Target> {
  return new ChainedConverter(converterA, converterB);
}
