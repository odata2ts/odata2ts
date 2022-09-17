import { QBasePath } from "../base/QBasePath";

export abstract class DateTimeBasePath<ConvertedType> extends QBasePath<string, ConvertedType> {
  protected formatValue(value: string): string {
    return value;
  }
}
