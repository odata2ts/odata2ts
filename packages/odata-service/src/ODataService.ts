export class ODataService {
  constructor(private basePath: string, private name: string) {
    if (!basePath || !basePath.trim()) {
      throw Error("[basePath] must be supplied to ODataService!");
    }
    if (!name || !name.trim()) {
      throw Error("[name] must be supplied to ODataService!");
    }
  }
}
