import { ConverterPackage } from "@odata2ts/converter-api";
import { booleanToNumberConverter } from "./BooleanToNumberConverter.js";
import { converterWithWrongId } from "./ConverterWithWrongId.js";
import { guidToGuidStringConverter } from "./GuidToGuidStringConverter.js";
import { numberToStringConverter } from "./NumberToStringConverter.js";
import { stringToPrefixModelConverter } from "./StringToPrefixModelConverter.js";

const pkg: ConverterPackage = {
  id: "test-converters",
  converters: [booleanToNumberConverter, numberToStringConverter, stringToPrefixModelConverter],
};

export default pkg;
export * from "./FixedDateConverter.js";
export * from "./StringToPrefixModelConverter.js";
export {
  booleanToNumberConverter,
  stringToPrefixModelConverter,
  numberToStringConverter,
  converterWithWrongId,
  guidToGuidStringConverter,
};
