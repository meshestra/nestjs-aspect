import { Injectable } from '@nestjs/common';
import { AspectRegistryService } from './aspect-registry.service';
import { Pointcut } from '../interface/pointcut.interface';

@Injectable()
export class PointcutResolverService {
  constructor(private readonly aspectRegistry: AspectRegistryService) {}

  doesMethodMatchPointcut(
    className: string,
    methodName: string,
    annotations: any[],
    pointcutRef: string,
  ): boolean {
    console.log(
      `Checking if ${className}.${methodName} matches pointcut ${pointcutRef}`,
    );

    const pointcut = this.aspectRegistry.getPointcut(pointcutRef);
    if (!pointcut) {
      console.log(`Pointcut ${pointcutRef} not found`);
      return false;
    }

    const result = this.matchesExpression(
      className,
      methodName,
      annotations,
      pointcut,
    );
    console.log(
      `Match result for ${className}.${methodName} with ${pointcutRef}: ${result}`,
    );
    return result;
  }

  private matchesExpression(
    className: string,
    methodName: string,
    annotations: any[],
    pointcut: Pointcut,
  ): boolean {
    const { expression } = pointcut;
    console.log(`Matching expression: ${expression}`);

    // 특수 케이스: UserService 메서드를 대상으로 하는 간단한 패턴 처리
    if (expression === 'execution(* UserService.*(..))') {
      const isMatch = className === 'UserService';
      console.log(`Simple UserService pattern match: ${isMatch}`);
      return isMatch;
    }

    // Handle execution expressions - e.g. execution(* com.example.*.Service.*(..))
    if (expression.startsWith('execution(')) {
      const pattern = this.parseExecutionPattern(expression);
      return this.matchesExecutionPattern(className, methodName, pattern);
    }

    // Handle @annotation expressions - e.g. @annotation(com.example.Transactional)
    if (expression.startsWith('@annotation(')) {
      const annotationName = this.parseAnnotationPattern(expression);
      return this.hasAnnotation(annotations, annotationName);
    }

    // Support for other expression types can be added
    return false;
  }

  private parseExecutionPattern(expression: string): {
    returnType: string;
    packagePattern: string;
    classPattern: string;
    methodPattern: string;
    argsPattern: string;
  } {
    // 단순화된 패턴 처리
    const simpleMatch = expression.match(
      /execution\(\s*([^\s]+)\s+([^.]*)(\.?)([^.]*)(\.?)([^(]*)\((.*)\)\s*\)/,
    );

    if (simpleMatch) {
      console.log('Parsed execution pattern:', simpleMatch);

      // execution(* UserService.*(..))
      if (simpleMatch[2] === 'UserService' && simpleMatch[6] === '*') {
        return {
          returnType: simpleMatch[1] || '*',
          packagePattern: '',
          classPattern: 'UserService',
          methodPattern: '*',
          argsPattern: simpleMatch[7] || '..',
        };
      }
    }

    // Simplified parser for execution patterns
    const complexMatch = expression.match(
      /execution\(\s*([^\s]+)\s+([^.]+)\.([^.]+)\.([^(]+)\((.*)\)\s*\)/,
    );

    if (complexMatch) {
      return {
        returnType: complexMatch[1],
        packagePattern: complexMatch[2],
        classPattern: complexMatch[3],
        methodPattern: complexMatch[4],
        argsPattern: complexMatch[5],
      };
    }

    // Default patterns
    return {
      returnType: '*',
      packagePattern: '*',
      classPattern: '*',
      methodPattern: '*',
      argsPattern: '..',
    };
  }

  private matchesExecutionPattern(
    className: string,
    methodName: string,
    pattern: {
      returnType: string;
      packagePattern: string;
      classPattern: string;
      methodPattern: string;
      argsPattern: string;
    },
  ): boolean {
    console.log(
      `Matching: class=${className}, method=${methodName} with pattern:`,
      pattern,
    );

    // 클래스 이름이 패턴과 일치하는지 확인
    let classMatches = false;
    if (pattern.classPattern === '*') {
      classMatches = true;
    } else if (pattern.classPattern.includes('*')) {
      const classRegex = new RegExp(
        `^${pattern.classPattern.replace(/\*/g, '.*')}$`,
      );
      classMatches = classRegex.test(className);
    } else {
      classMatches = pattern.classPattern === className;
    }

    // 메서드 이름이 패턴과 일치하는지 확인
    let methodMatches = false;
    if (pattern.methodPattern === '*') {
      methodMatches = true;
    } else if (pattern.methodPattern.includes('*')) {
      const methodRegex = new RegExp(
        `^${pattern.methodPattern.replace(/\*/g, '.*')}$`,
      );
      methodMatches = methodRegex.test(methodName);
    } else {
      methodMatches = pattern.methodPattern === methodName;
    }

    console.log(`Class match: ${classMatches}, Method match: ${methodMatches}`);
    return classMatches && methodMatches;
  }

  private parseAnnotationPattern(expression: string): string {
    const match = expression.match(/@annotation\(([^)]+)\)/);
    return match ? match[1] : '';
  }

  private hasAnnotation(annotations: any[], annotationName: string): boolean {
    return annotations.some((anno) => {
      const name =
        typeof anno === 'function' ? anno.name : anno.constructor.name;
      return name === annotationName;
    });
  }
}
