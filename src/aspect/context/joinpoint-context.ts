import { JoinPoint } from '../interface/join-point.interface';
import { ProceedingJoinPoint } from '../interface/proceed-joinpoint.interface';
import { AnyFunction } from '../utils/types';

export class JoinPointImpl implements JoinPoint {
  constructor(
    public readonly target: any,
    public readonly methodName: string,
    public readonly args: any[],
    public readonly metadata: any,
  ) {}

  getThis(): any {
    return this.target;
  }

  getArgs(): any[] {
    return this.args;
  }

  getMethodName(): string {
    return this.methodName;
  }

  getTarget(): any {
    return this.target;
  }
}

export class ProceedingJoinPointImpl
  extends JoinPointImpl
  implements ProceedingJoinPoint
{
  private readonly originalMethod: AnyFunction;

  constructor(
    target: any,
    methodName: string,
    args: any[],
    metadata: any,
    originalMethod: AnyFunction,
  ) {
    super(target, methodName, args, metadata);
    this.originalMethod = originalMethod;
  }

  async proceed(args?: any[]): Promise<any> {
    return this.originalMethod.apply(this.target, args || this.args);
  }
}
