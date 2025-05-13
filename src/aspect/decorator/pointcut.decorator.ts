import { SetMetadata } from '@nestjs/common';
import { PointcutOptions } from '../interface/pointcut.interface';

export const POINTCUT_METADATA = Symbol('POINTCUT_METADATA');

export function Pointcut(options: PointcutOptions): MethodDecorator {
  return (
    target: any,
    key: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    SetMetadata(POINTCUT_METADATA, options)(target, key, descriptor);
    return descriptor;
  };
}
