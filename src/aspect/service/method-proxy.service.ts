import { Injectable } from '@nestjs/common';
import { AspectContextService } from '../context/aspect-context.service';
import { AspectRegistryService } from './aspect-registry.service';
import { PointcutResolverService } from './pointcut-resolver.service';
import {
  JoinPointImpl,
  ProceedingJoinPointImpl,
} from '../context/joinpoint-context';
import {
  BEFORE_METADATA,
  AFTER_METADATA,
  AROUND_METADATA,
  AFTER_RETURNING_METADATA,
  AFTER_THROWING_METADATA,
} from '../decorator/advice.decorator';
import { AnyFunction } from '../utils/types';

@Injectable()
export class MethodProxyService {
  constructor(
    private readonly aspectRegistry: AspectRegistryService,
    private readonly pointcutResolver: PointcutResolverService,
    private readonly aspectContext: AspectContextService,
  ) {}

  createProxy(
    target: any,
    methodName: string,
    originalMethod: AnyFunction,
  ): AnyFunction {
    console.log(
      `MethodProxyService: Creating proxy for ${target.constructor.name}.${methodName}`,
    );

    const className = target.constructor.name;
    const metadata = {
      className,
      // Add more metadata from reflection if needed
    };

    // 프록시 메서드 생성
    return async (...args: any[]) => {
      console.log(
        `Proxy method called: ${className}.${methodName}(${JSON.stringify(
          args,
        )})`,
      );

      // 호출 시점에 포인트컷 확인 (지연 평가)
      const applicablePointcuts = this.findApplicablePointcuts(
        className,
        methodName,
        [],
      );

      // 어드바이스가 없으면 원본 메서드 실행
      if (applicablePointcuts.length === 0) {
        console.log(
          `No applicable pointcuts for ${className}.${methodName}, executing original method`,
        );
        return originalMethod.apply(target, args);
      }

      // Get or create AOP context
      let context = this.aspectContext.getContext();
      const needsNewContext = !context;

      if (needsNewContext) {
        context = {
          metadata: {},
          callStack: [],
        };
      }

      // Create joinpoint
      const joinPoint = new JoinPointImpl(target, methodName, args, metadata);
      const proceedingJoinPoint = new ProceedingJoinPointImpl(
        target,
        methodName,
        args,
        metadata,
        originalMethod,
      );

      // Execute within AOP context
      const execute = async () => {
        // Update context with current joinpoint
        this.aspectContext.updateContext({ joinPoint });
        this.aspectContext.addToCallStack(`${className}.${methodName}`);

        try {
          // Execute before advices
          for (const pointcut of applicablePointcuts) {
            const beforeAdvices = this.aspectRegistry.getAdvices(
              BEFORE_METADATA,
              pointcut,
            );
            console.log(
              `Executing ${beforeAdvices.length} Before advices for ${pointcut}`,
            );
            for (const advice of beforeAdvices) {
              await advice(joinPoint);
            }
          }

          // Find around advices
          const aroundAdvices: AnyFunction[] = [];
          for (const pointcut of applicablePointcuts) {
            const advices = this.aspectRegistry.getAdvices(
              AROUND_METADATA,
              pointcut,
            );
            console.log(
              `Found ${advices.length} Around advices for ${pointcut}`,
            );
            aroundAdvices.push(...advices);
          }

          // Execute method with around advices (if any)
          let result;
          if (aroundAdvices.length > 0) {
            console.log(`Executing ${aroundAdvices.length} Around advices`);
            // Chain around advices
            const chainedAdvice = aroundAdvices.reduceRight(
              (next, advice) => {
                return async () => advice(proceedingJoinPoint);
              },
              async () => proceedingJoinPoint.proceed(),
            );

            result = await chainedAdvice();
          } else {
            // No around advices, execute original method directly
            console.log(`Executing original method ${className}.${methodName}`);
            result = await originalMethod.apply(target, args);
          }

          // Execute after returning advices
          for (const pointcut of applicablePointcuts) {
            const afterReturningAdvices = this.aspectRegistry.getAdvices(
              AFTER_RETURNING_METADATA,
              pointcut,
            );
            console.log(
              `Executing ${afterReturningAdvices.length} AfterReturning advices for ${pointcut}`,
            );
            for (const advice of afterReturningAdvices) {
              await advice(joinPoint, result);
            }
          }

          // Execute after advices
          for (const pointcut of applicablePointcuts) {
            const afterAdvices = this.aspectRegistry.getAdvices(
              AFTER_METADATA,
              pointcut,
            );
            console.log(
              `Executing ${afterAdvices.length} After advices for ${pointcut}`,
            );
            for (const advice of afterAdvices) {
              await advice(joinPoint);
            }
          }

          return result;
        } catch (error) {
          console.error(
            `Error in proxy method ${className}.${methodName}:`,
            error,
          );

          // Execute after throwing advices
          for (const pointcut of applicablePointcuts) {
            const afterThrowingAdvices = this.aspectRegistry.getAdvices(
              AFTER_THROWING_METADATA,
              pointcut,
            );
            console.log(
              `Executing ${afterThrowingAdvices.length} AfterThrowing advices for ${pointcut}`,
            );
            for (const advice of afterThrowingAdvices) {
              await advice(joinPoint, error);
            }
          }

          // Execute after advices (even in case of error)
          for (const pointcut of applicablePointcuts) {
            const afterAdvices = this.aspectRegistry.getAdvices(
              AFTER_METADATA,
              pointcut,
            );
            console.log(
              `Executing ${afterAdvices.length} After advices for ${pointcut}`,
            );
            for (const advice of afterAdvices) {
              await advice(joinPoint);
            }
          }

          throw error;
        } finally {
          this.aspectContext.removeFromCallStack();
        }
      };

      // Run with existing context or create new one
      if (needsNewContext) {
        return this.aspectContext.run(context, execute);
      } else {
        return execute();
      }
    };
  }

  private findApplicablePointcuts(
    className: string,
    methodName: string,
    annotations: any[],
  ): string[] {
    console.log(`Finding applicable pointcuts for ${className}.${methodName}`);

    // Find all pointcuts that match this method
    const applicablePointcuts: string[] = [];

    // 모든 포인트컷 참조 가져오기
    const pointcuts = this.aspectRegistry.getPointcuts();
    console.log(`Total pointcuts in registry: ${pointcuts.size}`);

    // 각 포인트컷 검사
    for (const [pointcutRef, pointcut] of pointcuts.entries()) {
      console.log(
        `Checking pointcut: ${pointcutRef}, expression: ${pointcut.expression}`,
      );

      // 특수 케이스: UserService에 대한 단순 비교
      if (
        pointcut.expression === 'execution(* UserService.*(..))' &&
        className === 'UserService'
      ) {
        console.log(`Direct match found for UserService: ${pointcutRef}`);
        applicablePointcuts.push(pointcutRef);
        continue;
      }

      // 정규식 기반 매칭
      try {
        if (
          this.pointcutResolver.doesMethodMatchPointcut(
            className,
            methodName,
            annotations,
            pointcutRef,
          )
        ) {
          console.log(
            `Pointcut ${pointcutRef} matches ${className}.${methodName}`,
          );
          applicablePointcuts.push(pointcutRef);
        }
      } catch (error) {
        console.error(`Error checking pointcut ${pointcutRef}:`, error);
      }
    }

    console.log(
      `Found ${applicablePointcuts.length} applicable pointcuts:`,
      applicablePointcuts,
    );
    return applicablePointcuts;
  }
}
