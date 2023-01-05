import path from "path";

export function logFilePath(filePath: string) {
  // we only show file paths relative to work dir of running process
  const relativePath = path.relative(process.cwd(), filePath);
  // beautify slashes for windows
  return relativePath.split(path.sep).join("/");
}
