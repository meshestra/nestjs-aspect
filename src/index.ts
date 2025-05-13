export {
  Aspect,
  Pointcut,
  Before,
  After,
  Around,
  AfterReturning,
  AfterThrowing,
  ASPECT_METADATA,
  POINTCUT_METADATA,
  BEFORE_METADATA,
  AFTER_METADATA,
  AROUND_METADATA,
  AFTER_RETURNING_METADATA,
  AFTER_THROWING_METADATA,
} from './aspect/decorator/advice.decorator';

export { JoinPoint } from './aspect/interface/join-point.interface';
export { ProceedingJoinPoint } from './aspect/interface/proceed-joinpoint.interface';
export { Pointcut as PointcutInterface } from './aspect/interface/pointcut.interface';
export { AspectModuleOptions } from './aspect/interface/aspect.interface';

export {
  JoinPointImpl,
  ProceedingJoinPointImpl,
} from './aspect/context/joinpoint-context';

export { AspectContextService } from './aspect/context/aspect-context.service';

export { AspectRegistryService } from './aspect/service/aspect-registry.service';

export { PointcutResolverService } from './aspect/service/pointcut-resolver.service';

export { MethodProxyService } from './aspect/service/method-proxy.service';

export { ClassProxyFactory } from './aspect/factory/class-proxy.factory';

export { AspectInterceptor } from './aspect/interceptor/aspect.interceptor';

export { AspectModule } from './aspect/module/aspect.module';

export { AnyFunction } from './aspect/utils/types';
