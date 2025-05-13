export interface JoinPoint {
  target: any;
  methodName: string;
  args: any[];
  metadata: {
    className: string;
    returnType?: any;
    paramTypes?: any[];
    [key: string]: any;
  };
  getThis(): any;
  getArgs(): any[];
  getMethodName(): string;
  getTarget(): any;
}
