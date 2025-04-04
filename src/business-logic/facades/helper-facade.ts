import { ObjectCloner } from '../services/interfaces/object-cloner'
import { JsonObjectCloner } from '../services/json-object-cloner'

export class HelperFacade {

  public static createObjectCloner(): ObjectCloner {
    return new JsonObjectCloner()
  }
}
