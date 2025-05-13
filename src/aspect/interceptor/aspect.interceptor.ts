import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AspectRegistryService } from '../service/aspect-registry.service';
import {
  BEFORE_METADATA,
  AFTER_METADATA,
  AROUND_METADATA,
  AFTER_RETURNING_METADATA,
  AFTER_THROWING_METADATA,
  MetadataKey,
} from '../decorator/advice.decorator';
import {
  JoinPointImpl,
  ProceedingJoinPointImpl,
} from '../context/joinpoint-context';
import { AnyFunction } from '../utils/types';

@Injectable()
export class AspectInterceptor implements NestInterceptor {
  constructor(
    private readonly aspectRegistry: AspectRegistryService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const handler = context.getHandler() as AnyFunction;
    const methodName = handler.name;
    const target = context.getClass();
    const args = context.getArgs();

    // Create JoinPoint
    const joinPoint = new JoinPointImpl(
      target,
      methodName,
      args,
      this.getMethodMetadata(handler),
    );

    // Execute before advices
    this.executeBeforeAdvices(joinPoint);

    // Execute around advices
    const aroundAdvices = this.aspectRegistry.getAdvices(
      AROUND_METADATA,
      this.getPointcutRef(handler, AROUND_METADATA),
    );

    if (aroundAdvices.length > 0) {
      const proceedingJoinPoint = new ProceedingJoinPointImpl(
        target,
        methodName,
        args,
        this.getMethodMetadata(handler),
        (...newArgs: any[]) => handler.apply(target.prototype, newArgs || args),
      );

      // Execute around advices (first one)
      return this.executeAroundAdvice(proceedingJoinPoint, aroundAdvices, 0);
    }

    // No around advices, proceed with normal execution
    return next.handle().pipe(
      tap((result) => {
        // Execute after returning advices
        this.executeAfterReturningAdvices(joinPoint, result);

        // Execute after advices
        this.executeAfterAdvices(joinPoint);
      }),
      catchError((error) => {
        // Execute after throwing advices
        this.executeAfterThrowingAdvices(joinPoint, error);

        // Execute after advices
        this.executeAfterAdvices(joinPoint);

        throw error;
      }),
    );
  }

  private executeBeforeAdvices(joinPoint: JoinPointImpl): void {
    const pointcutRef = this.getPointcutRefFromJoinPoint(
      joinPoint,
      BEFORE_METADATA,
    );

    const beforeAdvices = this.aspectRegistry.getAdvices(
      BEFORE_METADATA,
      pointcutRef,
    );

    beforeAdvices.forEach((advice) => {
      advice(joinPoint);
    });
  }

  private executeAfterAdvices(joinPoint: JoinPointImpl): void {
    const pointcutRef = this.getPointcutRefFromJoinPoint(
      joinPoint,
      AFTER_METADATA,
    );

    const afterAdvices = this.aspectRegistry.getAdvices(
      AFTER_METADATA,
      pointcutRef,
    );

    afterAdvices.forEach((advice) => {
      advice(joinPoint);
    });
  }

  private executeAfterReturningAdvices(
    joinPoint: JoinPointImpl,
    result: any,
  ): void {
    const pointcutRef = this.getPointcutRefFromJoinPoint(
      joinPoint,
      AFTER_RETURNING_METADATA,
    );

    const afterReturningAdvices = this.aspectRegistry.getAdvices(
      AFTER_RETURNING_METADATA,
      pointcutRef,
    );

    afterReturningAdvices.forEach((advice) => {
      advice(joinPoint, result);
    });
  }

  private executeAfterThrowingAdvices(
    joinPoint: JoinPointImpl,
    error: any,
  ): void {
    const pointcutRef = this.getPointcutRefFromJoinPoint(
      joinPoint,
      AFTER_THROWING_METADATA,
    );

    const afterThrowingAdvices = this.aspectRegistry.getAdvices(
      AFTER_THROWING_METADATA,
      pointcutRef,
    );

    afterThrowingAdvices.forEach((advice) => {
      advice(joinPoint, error);
    });
  }

  private executeAroundAdvice(
    proceedingJoinPoint: ProceedingJoinPointImpl,
    advices: AnyFunction[],
    index: number,
  ): Observable<any> {
    if (index >= advices.length) {
      // All around advices executed, proceed with the original method
      return new Observable((subscriber) => {
        proceedingJoinPoint
          .proceed()
          .then((result) => {
            subscriber.next(result);
            subscriber.complete();
          })
          .catch((error) => {
            subscriber.error(error);
          });
      });
    }

    const advice = advices[index];
    return new Observable((subscriber) => {
      try {
        const result = advice(proceedingJoinPoint);
        subscriber.next(result);
        subscriber.complete();
      } catch (error) {
        subscriber.error(error);
      }
    });
  }

  private getPointcutRef(
    handler: AnyFunction,
    adviceType: MetadataKey,
  ): string {
    return Reflect.getMetadata(adviceType, handler);
  }

  private getPointcutRefFromJoinPoint(
    joinPoint: JoinPointImpl,
    adviceType: MetadataKey,
  ): string {
    return `${joinPoint.getTarget().name}.${joinPoint.getMethodName()}`;
  }

  private getMethodMetadata(handler: AnyFunction): any {
    return Reflect.getMetadataKeys(handler).reduce((metadata, key) => {
      metadata[key] = Reflect.getMetadata(key, handler);
      return metadata;
    }, {});
  }
}
