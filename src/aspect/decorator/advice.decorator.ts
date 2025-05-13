import { SetMetadata } from '@nestjs/common';

export type MetadataKey = string | symbol;

export const ASPECT_METADATA = Symbol('aspect');
export const POINTCUT_METADATA = Symbol('pointcut');
export const BEFORE_METADATA = Symbol('before');
export const AFTER_METADATA = Symbol('after');
export const AROUND_METADATA = Symbol('around');
export const AFTER_RETURNING_METADATA = Symbol('afterReturning');
export const AFTER_THROWING_METADATA = Symbol('afterThrowing');

export const Aspect = () => SetMetadata(ASPECT_METADATA, true);

export const Pointcut = (expression: string) =>
  SetMetadata(POINTCUT_METADATA, { expression });

export const Before = (pointcutRef: string) =>
  SetMetadata(BEFORE_METADATA, pointcutRef);

export const After = (pointcutRef: string) =>
  SetMetadata(AFTER_METADATA, pointcutRef);

export const Around = (pointcutRef: string) =>
  SetMetadata(AROUND_METADATA, pointcutRef);

export const AfterReturning = (pointcutRef: string) =>
  SetMetadata(AFTER_RETURNING_METADATA, pointcutRef);

export const AfterThrowing = (pointcutRef: string) =>
  SetMetadata(AFTER_THROWING_METADATA, pointcutRef);
