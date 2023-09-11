import { ObjectCloner } from './interfaces/object-cloner'

export class JsonObjectCloner implements ObjectCloner {
  public clone<T>(object: T): T {
    return JSON.parse(JSON.stringify(object))
  }
}
