import { ConverterPackage } from "@odata2ts/converter-api";
import { booleanToNumberConverter } from "./BooleanToNumberConverter";
import { converterWithWrongId } from "./ConverterWithWrongId";
import { guidToGuidStringConverter } from "./GuidToGuidStringConverter";
import { numberToStringConverter } from "./NumberToStringConverter";
import { stringToNamespacedModelConverter } from "./StringToNamespacedModelConverter";
import { stringToPrefixModelConverter } from "./StringToPrefixModelConverter";

const pkg: ConverterPackage = {
  id: "test-converters",
  converters: [booleanToNumberConverter, numberToStringConverter, stringToPrefixModelConverter],
};

export default pkg;
export * from "./FixedDateConverter";
export * from "./StringToNamespacedModelConverter";
export * from "./StringToPrefixModelConverter";
export {
  booleanToNumberConverter,
  stringToPrefixModelConverter,
  stringToNamespacedModelConverter,
  numberToStringConverter,
  converterWithWrongId,
  guidToGuidStringConverter,
};
