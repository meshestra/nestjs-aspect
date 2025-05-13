import { Injectable } from '@nestjs/common';
import { MetadataScanner } from '@nestjs/core';
import { MethodProxyService } from '../service/method-proxy.service';
import { AnyFunction } from '../utils/types';

@Injectable()
export class ClassProxyFactory {
  constructor(
    private readonly methodProxyService: MethodProxyService,
    private readonly metadataScanner: MetadataScanner,
  ) {}

  createProxy<T extends object>(
    targetClass: new (...args: any[]) => T,
  ): new (...args: any[]) => T {
    console.log(
      `ClassProxyFactory: Creating proxy for class ${targetClass.name}`,
    );

    // 함수 생성자를 사용하여 프록시 클래스 생성
    const ProxyClass = function (...args: any[]) {
      console.log(`ProxyClass constructor called for ${targetClass.name}`);

      // 인스턴스 생성 및 프록시 적용
      const instance = this.createProxiedInstance(targetClass, args);

      // 인스턴스 반환
      return instance;
    }.bind(this) as unknown as new (...args: any[]) => T;

    // 프로토타입 체인 설정
    Object.setPrototypeOf(ProxyClass.prototype, targetClass.prototype);

    // 정적 속성 복사
    this.copyStaticProperties(targetClass, ProxyClass);

    return ProxyClass;
  }

  /**
   * 원본 클래스의 인스턴스를 생성하고 메서드에 프록시를 적용합니다.
   */
  private createProxiedInstance<T extends object>(
    targetClass: new (...args: any[]) => T,
    args: any[],
  ): T {
    // 원본 클래스의 인스턴스 생성
    const instance = new targetClass(...args);
    console.log(`Original instance created: ${instance.constructor.name}`);

    // 메서드 스캔
    const methods = this.metadataScanner.scanFromPrototype(
      instance,
      Object.getPrototypeOf(instance),
      (key) => key,
    );
    console.log(`Found methods: ${methods.join(', ')}`);

    // 프록시 메서드 적용
    this.applyProxiesToMethods(instance, methods);

    return instance;
  }

  /**
   * 모든 메서드에 프록시를 적용합니다.
   */
  private applyProxiesToMethods(instance: any, methods: string[]): void {
    for (const methodName of methods) {
      const originalMethod = instance[methodName];
      if (
        typeof originalMethod === 'function' &&
        methodName !== 'constructor'
      ) {
        console.log(`Creating proxy for method: ${methodName}`);
        // 원본 메서드를 프록시 메서드로 교체
        instance[methodName] = this.methodProxyService.createProxy(
          instance,
          methodName,
          originalMethod.bind(instance) as AnyFunction,
        );
      }
    }
  }

  /**
   * 정적 속성을 복사합니다.
   */
  private copyStaticProperties(sourceClass: any, targetClass: any): void {
    Object.getOwnPropertyNames(sourceClass).forEach((prop) => {
      const descriptor = Object.getOwnPropertyDescriptor(sourceClass, prop);
      if (descriptor && descriptor.configurable) {
        Object.defineProperty(targetClass, prop, descriptor);
      }
    });
  }
}
