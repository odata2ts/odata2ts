import {EMPTY_ACTION_NAME, QEmptyAction} from "../fixture/operation/EmptyAction";
import {ParamActionParamModel, QParamAction} from "../fixture/operation/ParamAction";

describe("QAction Tests", () => {
  test("QAction: base props", () => {
    const exampleOperation = new QEmptyAction("");
    expect(exampleOperation.getName()).toBe(EMPTY_ACTION_NAME);
    expect(exampleOperation.getPath()).toBe("");
    expect(exampleOperation.buildUrl()).toBe("/" + EMPTY_ACTION_NAME);
    expect(exampleOperation.getParams()).toBeUndefined();
    expect(exampleOperation.convertUserParams(undefined)).toBeUndefined();
    expect(exampleOperation.convertODataParams(undefined)).toBeUndefined();
  });

  test("QAction: set path", () => {
    const exampleOperation = new QEmptyAction("test-path");
    expect(exampleOperation.getName()).toBe(EMPTY_ACTION_NAME);
    expect(exampleOperation.getPath()).toBe("test-path");
    expect(exampleOperation.buildUrl()).toBe("test-path/"+EMPTY_ACTION_NAME);
  });

  test("QAction: with params", () => {
    const requiredUserParams: ParamActionParamModel = {
      testGuid: "aaa-bbb",
      testString: "hi",
      testBoolean: true,
      testNumber: 3,
    }
    const allUserParams: ParamActionParamModel = {
      ...requiredUserParams,
      testDate: null,
      testTime: "PY32"
    }
    const requiredODataParams: Record<string, any> = {
      testGuid: requiredUserParams.testGuid,
      TEST_STRING: requiredUserParams.testString,
      testBoolean: requiredUserParams.testBoolean,
      testNumber: requiredUserParams.testNumber,
    }
    const allODataParams: Record<string, any> = {
      ...requiredODataParams,
      testDate: null,
      testTime: "PY32"
    }
    const exampleOperation = new QParamAction("");

    expect(exampleOperation.getParams()).toBeDefined()
    expect(exampleOperation.getParams().length).toBe(7)
    expect(exampleOperation.convertUserParams(requiredUserParams)).toMatchObject(requiredODataParams);
    expect(exampleOperation.convertUserParams(allUserParams)).toMatchObject(allODataParams);
    expect(exampleOperation.convertODataParams(requiredODataParams)).toMatchObject(requiredUserParams);
    expect(exampleOperation.convertODataParams(allODataParams)).toMatchObject(allUserParams);
  })

  // TODO: Edge cases & strict vs lenient parsing, i.e. throwing errors

})
