export type TestFuncParams =
  | {
      myParam: string;
    }
  | {
      anyParam: boolean;
    }
  | {
      x: number;
      y?: number | null;
    };
