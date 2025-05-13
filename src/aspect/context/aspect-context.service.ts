import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { AspectContext } from '../interface/aspect.interface';

import { JoinPoint } from '../interface/join-point.interface';

@Injectable()
export class AspectContextService {
  private readonly storage = new AsyncLocalStorage<AspectContext>();

  getContext(): AspectContext | undefined {
    return this.storage.getStore();
  }

  run(context: AspectContext, callback: () => any): any {
    return this.storage.run(context, callback);
  }

  updateContext(updates: Partial<AspectContext>): void {
    const context = this.getContext();
    if (context) {
      Object.assign(context, updates);
    }
  }

  addToCallStack(methodName: string): void {
    const context = this.getContext();
    if (context) {
      context.callStack.push(methodName);
    }
  }

  removeFromCallStack(): string | undefined {
    const context = this.getContext();
    if (context) {
      return context.callStack.pop();
    }
    return undefined;
  }

  getCurrentJoinPoint(): JoinPoint | undefined {
    return this.getContext()?.joinPoint;
  }
}
