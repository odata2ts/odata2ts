import { ODataModelBuilder, ODataVersion } from "./builder/ODataModelBuilder";
import { digest } from "../../src/data-model/DataModelDigestion";
import { EmitModes, Modes, RunOptions } from "../../src/OptionModel";

const NOOP_FN = () => {};

describe("DataModelDigestion Test", () => {
  const SERVICE_NAME = "Tester";

  let odataBuilder: ODataModelBuilder;
  let runOpts: RunOptions;

  function doDigest() {
    return digest(odataBuilder.getSchema(), runOpts);
  }

  beforeEach(() => {
    odataBuilder = new ODataModelBuilder(ODataVersion.V4, SERVICE_NAME);
    runOpts = {
      mode: Modes.all,
      emitMode: EmitModes.js_dts,
      output: "ignore",
      prettier: false,
      debug: false,
      modelPrefix: "",
      modelSuffix: "",
    };
  });

  test("Smoke Test", async () => {
    const result = await digest(odataBuilder.getSchema(), runOpts);

    expect(result).toBeTruthy();
    expect(result.getServiceName()).toBe(SERVICE_NAME);
    expect(result.getServicePrefix()).toBe(SERVICE_NAME + ".");
    expect(result.getFileNames()).toEqual({
      model: `${SERVICE_NAME}Model`,
      qObject: `Q${SERVICE_NAME}`,
      service: `${SERVICE_NAME}Service`,
    });

    expect(result.getModels()).toEqual([]);
    expect(result.getEnums()).toEqual([]);
    expect(result.getEntityContainer()).toEqual({ entitySets: {}, singletons: {}, functions: {}, actions: {} });
    expect(result.getPrimitiveTypeImports()).toEqual([]);
  });

  test("Deduplicate Service Suffix", async () => {
    const newServiceName = "TestService";
    odataBuilder = new ODataModelBuilder(ODataVersion.V4, newServiceName);

    const result = await digest(odataBuilder.getSchema(), runOpts);

    expect(result.getServiceName()).toBe(newServiceName);
    expect(result.getFileNames()).toEqual({
      model: `${newServiceName}Model`,
      qObject: `Q${newServiceName}`,
      service: `TestService`,
    });
  });
});
