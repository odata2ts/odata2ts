import { QNoopPath } from "./base/QNoopPath";

export class QBinaryPath extends QNoopPath {
  constructor(path: string) {
    super(path);
  }

  public withPath(newPath: string): QBinaryPath {
    return new QBinaryPath(newPath);
  }
}
