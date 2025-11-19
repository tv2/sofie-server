import { DeepObjectCloner } from '../../domain/services/deep-object-cloner'

export class DeepPropertyObjectCloner implements DeepObjectCloner {
  public deepClone<T>(object: T): T {
    return structuredClone(object)
  }
}
