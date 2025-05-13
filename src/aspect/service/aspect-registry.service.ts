import { Injectable, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import {
  AFTER_METADATA,
  AFTER_RETURNING_METADATA,
  AFTER_THROWING_METADATA,
  AROUND_METADATA,
  ASPECT_METADATA,
  BEFORE_METADATA,
  MetadataKey,
  POINTCUT_METADATA,
} from '../decorator/advice.decorator';
import { Pointcut } from '../interface/pointcut.interface';
import { AnyFunction } from '../utils/types';

@Injectable()
export class AspectRegistryService implements OnModuleInit {
  private readonly aspects = new Map<string, any>();
  private readonly pointcuts = new Map<string, Pointcut>();
  private readonly advices = new Map<MetadataKey, Map<string, AnyFunction[]>>();

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
  ) {}

  onModuleInit() {
    console.log('AspectRegistryService: onModuleInit');
    this.registerAspects();
  }

  private registerAspects() {
    console.log('Registering aspects...');
    const providers = this.discovery.getProviders();
    console.log(`Total providers: ${providers.length}`);

    const aspects = providers.filter((wrapper) => this.isAspect(wrapper));
    console.log(
      `Found ${aspects.length} aspects:`,
      aspects.map((a) => a.metatype?.name || 'unknown').join(', '),
    );

    aspects.forEach((wrapper) => {
      const { instance, metatype } = wrapper;
      if (!instance || !metatype) {
        console.log('Skipping aspect with no instance or metatype');
        return;
      }

      const aspectName = metatype.name;
      console.log(`Registering aspect: ${aspectName}`);
      this.aspects.set(aspectName, instance);

      // Register pointcuts
      this.metadataScanner.scanFromPrototype(
        instance,
        Object.getPrototypeOf(instance),
        (key) => {
          const pointcutMetadata = Reflect.getMetadata(
            POINTCUT_METADATA,
            instance[key],
          );
          if (pointcutMetadata) {
            const pointcutName = `${aspectName}.${key}`;
            console.log(
              `Registering pointcut: ${pointcutName}, expression: ${pointcutMetadata.expression}`,
            );
            this.pointcuts.set(pointcutName, {
              expression: pointcutMetadata.expression,
              methods: [],
              classes: [],
            });
          }

          // Register advices
          this.registerAdviceWithLogging(
            BEFORE_METADATA,
            aspectName,
            instance,
            key,
          );
          this.registerAdviceWithLogging(
            AFTER_METADATA,
            aspectName,
            instance,
            key,
          );
          this.registerAdviceWithLogging(
            AROUND_METADATA,
            aspectName,
            instance,
            key,
          );
          this.registerAdviceWithLogging(
            AFTER_RETURNING_METADATA,
            aspectName,
            instance,
            key,
          );
          this.registerAdviceWithLogging(
            AFTER_THROWING_METADATA,
            aspectName,
            instance,
            key,
          );
        },
      );
    });

    // 등록된 정보 요약
    console.log(`Total registered pointcuts: ${this.pointcuts.size}`);
    console.log(`Total registered advice types: ${this.advices.size}`);
    this.advices.forEach((adviceMap, adviceType) => {
      console.log(`- ${'' + String(adviceType)}: ${adviceMap.size} pointcuts`);
    });
  }

  // 로깅이 추가된 어드바이스 등록 메서드
  private registerAdviceWithLogging(
    adviceType: MetadataKey,
    aspectName: string,
    instance: any,
    methodName: string,
  ) {
    const pointcutRef = Reflect.getMetadata(adviceType, instance[methodName]);
    if (pointcutRef) {
      console.log(
        `Registering ${
          '' + String(adviceType)
        } advice: ${aspectName}.${methodName} -> ${pointcutRef}`,
      );

      if (!this.advices.has(adviceType)) {
        this.advices.set(adviceType, new Map<string, AnyFunction[]>());
      }
      const adviceMap = this.advices.get(adviceType);

      if (!adviceMap.has(pointcutRef)) {
        adviceMap.set(pointcutRef, []);
      }

      adviceMap.get(pointcutRef).push(instance[methodName].bind(instance));
    }
  }

  private isAspect(wrapper: InstanceWrapper): boolean {
    const { instance, metatype } = wrapper;
    if (!instance || !metatype) return false;
    const isAspect = !!Reflect.getMetadata(ASPECT_METADATA, metatype);
    if (isAspect) {
      console.log(`Found aspect: ${metatype.name}`);
    }
    return isAspect;
  }

  getPointcut(pointcutRef: string): Pointcut | undefined {
    return this.pointcuts.get(pointcutRef);
  }

  getAdvices(adviceType: MetadataKey, pointcutRef: string): AnyFunction[] {
    return this.advices.get(adviceType)?.get(pointcutRef) || [];
  }

  getPointcuts(): Map<string, Pointcut> {
    return this.pointcuts;
  }

  async registerAspectsManually(aspects: any[]) {
    console.log('Manual registration of aspects...');
    console.log(`Registering ${aspects.length} aspects manually`);

    for (const AspectClass of aspects) {
      const aspectName = AspectClass.name;
      console.log(`Manually registering aspect: ${aspectName}`);

      // 이미 등록된 인스턴스가 있는지 확인
      if (this.aspects.has(aspectName)) {
        console.log(
          `Aspect ${aspectName} already registered, using existing instance`,
        );
        continue;
      }

      // 새 인스턴스 생성
      const instance = new AspectClass();
      this.aspects.set(aspectName, instance);

      // 포인트컷 및 어드바이스 등록
      this.metadataScanner.scanFromPrototype(
        instance,
        Object.getPrototypeOf(instance),
        (key) => {
          const pointcutMetadata = Reflect.getMetadata(
            POINTCUT_METADATA,
            instance[key],
          );
          if (pointcutMetadata) {
            const pointcutName = `${aspectName}.${key}`;
            console.log(
              `Manually registering pointcut: ${pointcutName}, expression: ${pointcutMetadata.expression}`,
            );
            this.pointcuts.set(pointcutName, {
              expression: pointcutMetadata.expression,
              methods: [],
              classes: [],
            });
          }

          // 어드바이스 등록
          this.registerAdviceWithLogging(
            BEFORE_METADATA,
            aspectName,
            instance,
            key,
          );
          this.registerAdviceWithLogging(
            AFTER_METADATA,
            aspectName,
            instance,
            key,
          );
          this.registerAdviceWithLogging(
            AROUND_METADATA,
            aspectName,
            instance,
            key,
          );
          this.registerAdviceWithLogging(
            AFTER_RETURNING_METADATA,
            aspectName,
            instance,
            key,
          );
          this.registerAdviceWithLogging(
            AFTER_THROWING_METADATA,
            aspectName,
            instance,
            key,
          );
        },
      );
    }

    // 등록된 정보 요약
    console.log(`Total manually registered pointcuts: ${this.pointcuts.size}`);
    console.log(`Total manually registered advice types: ${this.advices.size}`);
    this.advices.forEach((adviceMap, adviceType) => {
      console.log(`- ${'' + String(adviceType)}: ${adviceMap.size} pointcuts`);
    });
  }
}
