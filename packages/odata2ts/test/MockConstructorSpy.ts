export function MockConstructorSpy(module: string, className: string, isDefault: boolean) {
  const spyMethod = jest.fn();
  jest.mock(module, () => {
    let mockClass = null;
    if (isDefault) {
      mockClass = jest.requireActual(module).default;
    } else {
      const { [className]: mockedModuleClass } = jest.requireActual(module);
      mockClass = mockedModuleClass;
    }
    class Mock extends mockClass {
      constructor(...args: any) {
        super(...args);
        spyMethod(...args);
      }
    }
    if (isDefault) return Mock;
    else return { [className]: Mock };
  });
  return spyMethod;
}
