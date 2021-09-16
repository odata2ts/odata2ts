import { DateTimeBasePath } from "./DateTimeBase";
import { dayFn, monthFn, yearFn } from "./DateTimeFunctions";

export class QDatePath extends DateTimeBasePath {
  constructor(path: string) {
    super(path);
  }

  public withPath(newPath: string): QDatePath {
    return new QDatePath(newPath);
  }

  public year = yearFn(this.path);
  public month = monthFn(this.path);
  public day = dayFn(this.path);
}
