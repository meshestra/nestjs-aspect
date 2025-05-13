/**
 * 일반적인 함수 타입을 위한 별칭.
 * eslint의 @typescript-eslint/ban-types 규칙을 우회하기 위해 사용합니다.
 */
export type AnyFunction = (...args: any[]) => any;
