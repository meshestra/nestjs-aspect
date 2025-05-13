export interface Pointcut {
  expression: string;
  methods?: string[];
  classes?: string[];
}

export interface PointcutOptions {
  expression: string;
}
