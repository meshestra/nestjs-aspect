import { FactoryProvider } from '@nestjs/common';
import { ClassProxyFactory } from './class-proxy.factory';

export function createAopProvider(target: any): FactoryProvider {
  return {
    provide: target,
    useFactory: (classProxyFactory: ClassProxyFactory) => {
      const ProxyClass = classProxyFactory.createProxy(target);
      return new ProxyClass();
    },
    inject: [ClassProxyFactory],
  };
}
