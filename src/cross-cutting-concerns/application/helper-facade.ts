import { ObjectCloner } from '../domain/services/object-cloner'
import { DeepPropertyObjectCloner } from '../infrastructure/services/deep-property-object-cloner'

// Should be renamed to something like LanguageSupportFacade
export class HelperFacade {

  public static createObjectCloner(): ObjectCloner {
    return new DeepPropertyObjectCloner()
  }
}