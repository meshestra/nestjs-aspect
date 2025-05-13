// // module/aspect.module.ts
// import { DynamicModule, Module, Provider } from '@nestjs/common';
// import { AspectContextService } from '../context/aspect-context.service';
// import { AspectRegistryService } from '../service/aspect-registry.service';
// import { MethodProxyService } from '../service/method-proxy.service';
// import { PointcutResolverService } from '../service/pointcut-resolver.service';
// import { AspectModuleOptions } from '../interface/aspect.interface';
// import {
//   APP_INTERCEPTOR,
//   DiscoveryModule,
//   DiscoveryService,
//   MetadataScanner,
// } from '@nestjs/core';
// import { AspectInterceptor } from '../interceptor/aspect.interceptor';
// import { ClassProxyFactory } from '../factory/class-proxy.factory';

// @Module({
//   imports: [DiscoveryModule],
//   providers: [
//     AspectContextService,
//     AspectRegistryService,
//     PointcutResolverService,
//     MethodProxyService,
//     ClassProxyFactory,
//   ],
//   exports: [
//     AspectContextService,
//     AspectRegistryService,
//     PointcutResolverService,
//     MethodProxyService,
//     ClassProxyFactory,
//   ],
// })
// export class AspectModule {
//   static register(options: AspectModuleOptions = {}): DynamicModule {
//     console.log('AspectModule.register', options);

//     const providers: Provider[] = [
//       DiscoveryService,
//       MetadataScanner,
//       AspectContextService,
//       AspectRegistryService,
//       PointcutResolverService,
//       MethodProxyService,
//       ClassProxyFactory,
//       {
//         provide: APP_INTERCEPTOR,
//         useClass: AspectInterceptor,
//       },
//     ];

//     // Aspect 클래스들 등록
//     if (options.aspects) {
//       console.log(`Registering ${options.aspects.length} aspects`);
//       options.aspects.forEach((aspect) => {
//         console.log(`Adding aspect provider: ${aspect.name}`);
//         providers.push({
//           provide: aspect,
//           useClass: aspect,
//         });
//       });
//     }

//     // enableAutoDiscovery 옵션이 true인 경우에만 프로바이더 향상 적용
//     const enableAutoDiscovery = options.enableAutoDiscovery !== false; // 기본값 true
//     console.log(`Auto discovery enabled: ${enableAutoDiscovery}`);

//     return {
//       global: true,
//       module: AspectModule,
//       imports: [DiscoveryModule],
//       providers,
//       exports: [
//         AspectRegistryService,
//         AspectContextService,
//         PointcutResolverService,
//         MethodProxyService,
//         ClassProxyFactory,
//       ],
//     };
//   }
// }

import { DynamicModule, Module, OnModuleInit, Provider } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { AspectContextService } from '../context/aspect-context.service';
import { AspectRegistryService } from '../service/aspect-registry.service';
import { MethodProxyService } from '../service/method-proxy.service';

import { AspectModuleOptions } from '../interface/aspect.interface';
import {
  APP_INTERCEPTOR,
  DiscoveryModule,
  DiscoveryService,
  MetadataScanner,
} from '@nestjs/core';
import { AspectInterceptor } from '../interceptor/aspect.interceptor';
import { ClassProxyFactory } from '../factory/class-proxy.factory';
import { PointcutResolverService } from '../service/pointcut-resolver.service';

@Module({
  imports: [DiscoveryModule],
  providers: [
    AspectContextService,
    AspectRegistryService,
    PointcutResolverService,
    MethodProxyService,
    ClassProxyFactory,
  ],
  exports: [
    AspectContextService,
    AspectRegistryService,
    PointcutResolverService,
    MethodProxyService,
    ClassProxyFactory,
  ],
})
export class AspectModule implements OnModuleInit {
  private static options: AspectModuleOptions;

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly classProxyFactory: ClassProxyFactory,
    private readonly moduleRef: ModuleRef,
    private readonly metadataScanner: MetadataScanner,
    private readonly methodProxyService: MethodProxyService,
  ) {}

  async onModuleInit() {
    console.log('AspectModule: onModuleInit');

    // 옵션에 따라 자동 검색 및 프록시 적용
    if (AspectModule.options?.enableAutoDiscovery) {
      console.log(
        'Auto-discovery enabled, searching for providers to proxy...',
      );

      // TODO: AspectRegistry 초기화 대기 로직 구성
      // TODO: 초기화 시간 단축 전략 고민(결국 scanning time 이 문제일듯(어떻게 단축시킬 것인가? Lazy loading 밖에 답이 없나?))
      // AspectRegistryService가 초기화될 때까지 잠시 대기
      // 이는 어드바이스와 포인트컷이 모두 등록되도록 하기 위함임.
      await new Promise((resolve) => setTimeout(resolve, 100));

      this.autoDiscoverProviders();
    }
  }

  private autoDiscoverProviders() {
    // 모든 프로바이더 가져오기
    const providers = this.discovery.getProviders();
    console.log(`Found ${providers.length} providers to check for proxying`);

    // 프록시 대상 프로바이더 필터링
    const eligibleProviders = providers.filter((wrapper) => {
      if (!wrapper.instance || !wrapper.metatype) return false;

      // 이미 프록시된 프로바이더나 AOP 관련 프로바이더 제외
      // TODO: caching
      const className = wrapper.metatype.name;
      if (
        className === 'AspectRegistryService' ||
        className === 'MethodProxyService' ||
        className === 'PointcutResolverService' ||
        className === 'AspectContextService' ||
        className === 'ClassProxyFactory' ||
        className.includes('Aspect') ||
        (wrapper.name && String(wrapper.name).includes('ASPECT_'))
      ) {
        return false;
      }

      return true;
    });

    console.log(
      `Found ${eligibleProviders.length} providers eligible for proxying`,
    );

    // 각 프로바이더 프록시 적용
    for (const wrapper of eligibleProviders) {
      try {
        const instance = wrapper.instance;
        const className = wrapper.metatype.name;
        console.log(`Checking provider ${className} for proxying`);

        // 1. UserService 특별 처리 (직접 매칭)
        if (className === 'UserService') {
          console.log(`Found UserService, applying proxy...`);
          this.proxyProviderMethods(instance, className);
          continue;
        }

        // 2. 포인트컷 표현식과 매칭되는지 확인
        const shouldProxy = this.shouldProxyProvider(className);
        if (shouldProxy) {
          console.log(
            `Provider ${className} matches pointcut expression, applying proxy...`,
          );
          this.proxyProviderMethods(instance, className);
        }
      } catch (error) {
        console.error(`Error while proxying provider:`, error);
      }
    }
  }

  private shouldProxyProvider(className: string): boolean {
    // AspectRegistryService에서 모든 포인트컷 가져오기
    const aspectRegistry = this.moduleRef.get(AspectRegistryService, {
      strict: false,
    });
    const pointcuts = aspectRegistry.getPointcuts();

    // 각 포인트컷에 대해 클래스 이름이 매칭되는지 확인
    for (const [_, pointcut] of pointcuts.entries()) {
      const { expression } = pointcut;

      // UserService에 대한 특수 케이스
      if (
        expression === 'execution(* UserService.*(..))' &&
        className === 'UserService'
      ) {
        return true;
      }

      // 더 복잡한 포인트컷 표현식 처리는 여기에 추가...
    }

    return false;
  }

  private proxyProviderMethods(instance: any, className: string) {
    // 인스턴스의 모든 메서드 스캔
    const methods = this.metadataScanner.scanFromPrototype(
      instance,
      Object.getPrototypeOf(instance),
      (key) => key,
    );

    console.log(`Found ${methods.length} methods in ${className} to proxy`);

    // 각 메서드에 프록시 적용
    for (const methodName of methods) {
      if (
        typeof instance[methodName] === 'function' &&
        methodName !== 'constructor'
      ) {
        console.log(`Proxying method: ${className}.${methodName}`);

        try {
          // 원본 메서드 보관
          const originalMethod = instance[methodName];

          // 메서드 프록시로 교체
          instance[methodName] = this.methodProxyService.createProxy(
            instance,
            methodName,
            originalMethod.bind(instance),
          );

          console.log(
            `Successfully proxied method: ${className}.${methodName}`,
          );
        } catch (error) {
          console.error(
            `Error proxying method ${className}.${methodName}:`,
            error,
          );
        }
      }
    }

    console.log(`Provider ${className} successfully proxied`);
  }

  static register(options: AspectModuleOptions = {}): DynamicModule {
    console.log('AspectModule.register', options);

    // 옵션 저장
    AspectModule.options = options;

    const providers: Provider[] = [
      DiscoveryService,
      MetadataScanner,
      AspectContextService,
      AspectRegistryService,
      PointcutResolverService,
      MethodProxyService,
      ClassProxyFactory,
      {
        provide: APP_INTERCEPTOR,
        useClass: AspectInterceptor,
      },
    ];

    // Aspect 클래스들 등록
    if (options.aspects) {
      console.log(`Registering ${options.aspects.length} aspects`);
      options.aspects.forEach((aspect) => {
        console.log(`Adding aspect provider: ${aspect.name}`);
        providers.push({
          provide: aspect,
          useClass: aspect,
        });
      });
    }

    return {
      global: true,
      module: AspectModule,
      imports: [DiscoveryModule],
      providers,
      exports: [
        AspectRegistryService,
        AspectContextService,
        PointcutResolverService,
        MethodProxyService,
        ClassProxyFactory,
      ],
    };
  }
}
