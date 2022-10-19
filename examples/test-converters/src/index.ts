import { ConverterPackage } from "@odata2ts/converter-api";

import { booleanToNumberConverter } from "./BooleanToNumberConverter";
import { converterWithWrongId } from "./ConverterWithWrongId";
import { numberToStringConverter } from "./NumberToStringConverter";
import { stringToPrefixModelConverter } from "./StringToPrefixModelConverter";

const pkg: ConverterPackage = {
  id: "test-converters",
  converters: [booleanToNumberConverter, numberToStringConverter, stringToPrefixModelConverter],
};

export default pkg;
export * from "./FixedDateConverter";
export * from "./StringToPrefixModelConverter";
export { booleanToNumberConverter, stringToPrefixModelConverter, numberToStringConverter, converterWithWrongId };
