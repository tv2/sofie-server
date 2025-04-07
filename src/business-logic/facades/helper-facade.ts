import { ObjectCloner } from '../services/interfaces/object-cloner'
import { DeepPropertyObjectCloner } from '../services/deep-property-object-cloner'

export class HelperFacade {

  public static createObjectCloner(): ObjectCloner {
    return new DeepPropertyObjectCloner()
  }
}
