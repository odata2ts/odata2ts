import { EmitModes, Modes, RunOptions } from "../../src/OptionModel";
import { ODataModelBuilderV4 } from "./builder/v4/ODataModelBuilderV4";
import { DataModel } from "../../src/data-model/DataModel";
import { Schema } from "../../src/data-model/edmx/ODataEdmxModelBase";
import { ODataVersion } from "../../src/data-model/DataTypeModel";
import { ODataModelBuilder } from "./builder/ODataModelBuilder";

export type DigestionFunction = <S extends Schema<any, any>>(schema: S, runOpts: RunOptions) => Promise<DataModel>;
export type ModelBuilderConstructor<MB extends ODataModelBuilder<any, any, any, any>> = new (serviceName: string) => MB;

export function createDataModelTests(
  version: ODataVersion,
  ODataBuilderConstructor: ModelBuilderConstructor<any>,
  digest: DigestionFunction
) {
  const SERVICE_NAME = "Tester";

  let odataBuilder: ODataModelBuilder<any, any, any, any>;
  let runOpts: RunOptions;

  beforeEach(() => {
    odataBuilder = new ODataBuilderConstructor(SERVICE_NAME);
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
    expect(result.getODataVersion()).toBe(version);

    expect(result.getModels()).toEqual([]);
    expect(result.getEnums()).toEqual([]);
    expect(result.getEntityContainer()).toEqual({ entitySets: {}, singletons: {}, functions: {}, actions: {} });
  });

  test("Deduplicate Service Suffix", async () => {
    const newServiceName = "TestService";
    odataBuilder = new ODataModelBuilderV4(newServiceName);

    const result = await digest(odataBuilder.getSchema(), runOpts);

    expect(result.getServiceName()).toBe(newServiceName);
    expect(result.getFileNames()).toEqual({
      model: `${newServiceName}Model`,
      qObject: `Q${newServiceName}`,
      service: `TestService`,
    });
  });
}
