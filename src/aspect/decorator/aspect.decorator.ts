export const ASPECT_METADATA = Symbol('ASPECT_METADATA');

export function Aspect(): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(ASPECT_METADATA, true, target);
    return target;
  };
}
