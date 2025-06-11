import { ObjectCloner } from '../domain/object-cloner'
import { DeepPropertyObjectCloner } from '../infrastructure/deep-property-object-cloner'

export class HelperFacade {

  public static createObjectCloner(): ObjectCloner {
    return new DeepPropertyObjectCloner()
  }
}
