import { DynamicModule, Provider } from '@nestjs/common';
import { AspectModule } from './aspect.module';

export class AspectModuleBuilder {
  private options: any = {};
  private providers: Provider[] = [];

  setOptions(options: any): AspectModuleBuilder {
    this.options = options;
    return this;
  }

  addProvider(provider: Provider): AspectModuleBuilder {
    this.providers.push(provider);
    return this;
  }

  build(): DynamicModule {
    const { imports = [], isGlobal = false } = this.options;

    return {
      module: AspectModule,
      imports,
      providers: this.providers,
      exports: this.providers,
      global: isGlobal,
    };
  }
}
