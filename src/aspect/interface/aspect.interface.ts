import { JoinPoint } from './join-point.interface';
import { Pointcut } from './pointcut.interface';

export interface Aspect {
  pointcuts?: Map<string, Pointcut>;
  [key: string]: any;
}

export interface AspectContext {
  joinPoint?: JoinPoint;
  metadata: Record<string, any>;
  callStack: string[];
}

export interface AspectModuleOptions {
  aspects?: any[];
  enableAutoDiscovery?: boolean;
}
