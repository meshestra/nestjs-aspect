# @Meshcraft/aspect

![npm](https://img.shields.io/npm/v/@meshcraft/aspect)
![License](https://img.shields.io/github/license/meshcraft/aspect)
![Build Status](https://img.shields.io/github/workflow/status/meshcraft/aspect/CI)
![Coverage](https://img.shields.io/codecov/c/github/meshcraft/aspect)
![Downloads](https://img.shields.io/npm/dm/@meshcraft/aspect)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)

> Powerful Aspect Oriented Programming (AOP) for JavaScript/TypeScript, inspired by Spring AOP

## Features

- ✂️ **Clean Separation of Concerns** - Isolate cross-cutting concerns from your business logic
- 🔄 **Method Interception** - Before, After, Around, AfterReturning, AfterThrowing advice
- 🎯 **Pointcut Expressions** - Target specific methods and classes with powerful expressions
- 🧩 **Composable Aspects** - Create reusable aspects and combine them effortlessly
- ⚡  **Performance Optimized** - Minimal runtime overhead with smart caching
- 📏 **TypeScript First** - Full type safety with excellent IDE support
- 🔍 **Transparent Proxies** - Maintains original method signatures and stack traces

## Installation

```bash
npm install @meshcraft/aspect
# OR
yarn add @meshcraft/aspect
# OR
pnpm add @meshcraft/aspect
```

## Quick Start

```typescript
import { createAspect, Around, Pointcut } from '@meshcraft/aspect';

// Create a simple logging aspect
const LoggingAspect = createAspect({
  // Define a pointcut that targets service methods
  @Pointcut('execution(*.service.*(..))')
  serviceMethod() {},

  // Apply "around" advice to all methods matching the pointcut
  @Around('serviceMethod()')
  async logMethodExecution(joinPoint) {
    const { method, args, proceed } = joinPoint;
    console.log(`Executing ${method} with arguments:`, args);

    const startTime = performance.now();
    try {
      // Proceed with the original method call
      const result = await proceed();
      console.log(`${method} returned:`, result);
      return result;
    } catch (error) {
      console.error(`${method} threw an error:`, error);
      throw error;
    } finally {
      const endTime = performance.now();
      console.log(`${method} execution time: ${endTime - startTime}ms`);
    }
  }
});

// Create a class with some business logic
class UserService {
  async findById(id: string) {
    // Database operations...
    return { id, name: 'John Doe' };
  }

  async createUser(userData: any) {
    // User creation logic...
    return { id: '123', ...userData };
  }
}

// Apply the aspect to the service
const userService = LoggingAspect.apply(new UserService());

// Use the proxied service - aspects will be applied automatically
await userService.findById('123');
// Console:
// Executing findById with arguments: ['123']
// findById returned: { id: '123', name: 'John Doe' }
// findById execution time: 5.23ms
```

## Core Concepts

### Aspects

Aspects are the core containers for cross-cutting concerns. They define pointcuts and advice that describe where and how to apply additional behavior.

### Joinpoints

Joinpoints represent specific points in your application's execution where aspects can be applied. In @Meshcraft/aspect, joinpoints are typically method executions.

### Pointcuts

Pointcuts are expressions that select specific joinpoints in your code. They determine which methods your aspects will target.

```typescript
@Pointcut('execution(com.example.service.*.*(..))')
serviceLayer() {}
```

### Advice

Advice defines the behavior to apply at selected joinpoints. @Meshcraft/aspect offers several types of advice:

- **@Before** - Executes before the joinpoint
- **@After** - Executes after the joinpoint (regardless of outcome)
- **@AfterReturning** - Executes after successful completion
- **@AfterThrowing** - Executes if the joinpoint throws an exception
- **@Around** - Wraps the joinpoint with custom behavior

## Advanced Examples

### Transaction Management

```typescript
const TransactionAspect = createAspect({
  @Pointcut('execution(@Transactional *.*(..))')
  transactionalMethod() {},

  @Around('transactionalMethod()')
  async manageTransaction(joinPoint) {
    const tx = await db.beginTransaction();
    try {
      const result = await joinPoint.proceed();
      await tx.commit();
      return result;
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }
});

// Usage with decorator
class OrderService {
  @Transactional()
  async createOrder(order) {
    // Order creation logic that will be automatically wrapped in a transaction
  }
}
```

### Caching

```typescript
const CachingAspect = createAspect({
  @Pointcut('execution(@Cacheable *.*(..))')
  cacheableMethod() {},

  @Around('cacheableMethod()')
  async cache(joinPoint) {
    const { target, method, args } = joinPoint;
    const cacheKey = `${target.constructor.name}.${method}(${JSON.stringify(args)})`;

    const cachedValue = await cacheManager.get(cacheKey);
    if (cachedValue) {
      return cachedValue;
    }

    const result = await joinPoint.proceed();
    await cacheManager.set(cacheKey, result);
    return result;
  }
});
```

## Pointcut Expression Syntax

@Meshcraft/aspect provides a powerful expression language for defining pointcuts:

| Expression | Description |
|------------|-------------|
| `execution(* *.*(..))` | All methods in all classes |
| `execution(com.example.service.*.*(..))` | All methods in service classes |
| `execution(* *.find*(..))` | All methods starting with "find" |
| `execution(@Transactional * *.*(..))` | Methods with @Transactional annotation |
| `execution(* *.*(String, ..))` | Methods with String as first parameter |
| `within(com.example.service.*)` | All joinpoints within service package |

## Performance Considerations

@Meshcraft/aspect is designed with performance in mind:

- Pointcut expressions are parsed and optimized at load time
- Proxies use minimal reflection to maintain performance
- Advanced caching mechanisms reduce runtime overhead

For production environments, consider:

```typescript
// Enable production mode to apply additional optimizations
import { configure } from '@meshcraft/aspect';

configure({
  production: process.env.NODE_ENV === 'production',
  cacheSize: 1000
});
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Spring Framework - For the original AOP concepts and implementation
- TypeScript team - For the amazing type system that makes this possible
