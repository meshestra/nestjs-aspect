// logging.aspect.ts
import { Injectable } from '@nestjs/common';
import {
  After,
  AfterReturning,
  AfterThrowing,
  Around,
  Aspect,
  Before,
  JoinPoint,
  Pointcut,
  ProceedingJoinPoint,
} from '..';

@Injectable()
@Aspect()
export class LoggingAspect {
  constructor() {
    console.log('LoggingAspect 인스턴스 생성됨');
  }

  @Pointcut('execution(* UserService.*(..))')
  userServiceMethods() {
    // 포인트컷 정의
    console.log('Pointcut definition method called - this should not happen');
  }

  @Before('LoggingAspect.userServiceMethods')
  logBefore(joinPoint: JoinPoint) {
    console.log(
      `[Before Advice] ${
        joinPoint.getTarget().constructor.name
      }.${joinPoint.getMethodName()} 실행 전`,
    );
    console.log(
      `[Before Advice] 파라미터: ${JSON.stringify(joinPoint.getArgs())}`,
    );
  }

  @After('LoggingAspect.userServiceMethods')
  logAfter(joinPoint: JoinPoint) {
    console.log(
      `[After Advice] ${
        joinPoint.getTarget().constructor.name
      }.${joinPoint.getMethodName()} 실행 후`,
    );
  }

  @Around('LoggingAspect.userServiceMethods')
  async logAround(proceedingJoinPoint: ProceedingJoinPoint) {
    const methodName = proceedingJoinPoint.getMethodName();
    const className = proceedingJoinPoint.getTarget().constructor.name;
    console.log(`[Around Advice] ${className}.${methodName} 실행 전`);
    const startTime = new Date().getTime();
    try {
      // 원래 메서드 실행
      const result = await proceedingJoinPoint.proceed();
      const endTime = new Date().getTime();
      console.log(
        `[Around Advice] ${className}.${methodName} 실행 완료, 소요시간: ${
          endTime - startTime
        }ms`,
      );
      return result;
    } catch (error) {
      console.error(
        `[Around Advice] ${className}.${methodName} 실행 중 오류 발생:`,
        error,
      );
      throw error;
    }
  }

  @AfterReturning('LoggingAspect.userServiceMethods')
  logAfterReturning(joinPoint: JoinPoint, result: any) {
    console.log(
      `[AfterReturning Advice] ${
        joinPoint.getTarget().constructor.name
      }.${joinPoint.getMethodName()} 반환값: ${JSON.stringify(result)}`,
    );
  }

  @AfterThrowing('LoggingAspect.userServiceMethods')
  logAfterThrowing(joinPoint: JoinPoint, error: Error) {
    console.error(
      `[AfterThrowing Advice] ${
        joinPoint.getTarget().constructor.name
      }.${joinPoint.getMethodName()} 예외 발생:`,
      error,
    );
  }
}
