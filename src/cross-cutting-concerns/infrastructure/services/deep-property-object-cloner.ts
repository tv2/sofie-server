import { DeepObjectCloner } from '../../domain/services/deep-object-cloner'

export class DeepPropertyObjectCloner implements DeepObjectCloner {
  // Implementation found at: https://plainenglish.io/blog/deep-clone-an-object-and-preserve-its-type-with-typescript-d488c35e5574
  public deepClone<T>(object: T): T {
    return Array.isArray(object)
      ? object.map(item => this.deepClone(item))
      : object instanceof Date
        ? new Date(object.getTime())
        : object && typeof object === 'object'
          ? Object.getOwnPropertyNames(object).reduce((o, prop) => {
            Object.defineProperty(o, prop, Object.getOwnPropertyDescriptor(object, prop)!)
            o[prop] = this.deepClone((object as { [key: string]: unknown })[prop])
            return o
          }, Object.create(Object.getPrototypeOf(object)))
          : object as T
  }
}
