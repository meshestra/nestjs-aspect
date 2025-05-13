import { JoinPoint } from './join-point.interface';

export interface ProceedingJoinPoint extends JoinPoint {
  proceed(): Promise<any>;
  proceed(args: any[]): Promise<any>;
}
