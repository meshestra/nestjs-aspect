// import { Module } from '@nestjs/common';
// import { AspectModule } from './module/aspect.module';
// import { LoggingAspect } from './logging.aspect';
// import { UserController } from './user.controller';
// import { UserService } from './user.service';
// import { ClassProxyFactory } from './factory/class-proxy.factory';

// @Module({
//   imports: [
//     AspectModule.register({
//       aspects: [LoggingAspect],
//       enableAutoDiscovery: true,
//     }),
//   ],
//   controllers: [UserController],
//   providers: [
//     {
//       provide: UserService,
//       useFactory: (classProxyFactory: ClassProxyFactory) => {
//         console.log('Creating proxy for UserService');
//         const ProxiedUserService = classProxyFactory.createProxy(UserService);
//         return new ProxiedUserService();
//       },
//       inject: [ClassProxyFactory],
//     },
//   ],
// })
// export class AppModule {}

// app.module.ts
import { Module } from '@nestjs/common';
import { AspectModule } from '../aspect/module/aspect.module';
import { LoggingAspect } from './logging.aspect';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    AspectModule.register({
      aspects: [LoggingAspect],
      enableAutoDiscovery: true, // 자동 검색 활성화
    }),
  ],
  controllers: [UserController],
  providers: [UserService], // 일반적인 방식으로 등록
})
export class AppModule {}
