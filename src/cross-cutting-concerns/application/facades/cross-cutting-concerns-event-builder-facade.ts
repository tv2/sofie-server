import {StatusMessageEventBuilder} from '../interfaces/status-message-event-builder'
import {CrossCuttingConcernsEventBuilder} from '../services/cross-cutting-concerns-event-builder'

export class CrossCuttingConcernsEventBuilderFacade {
  public static getStatusMessageEventBuilder(): StatusMessageEventBuilder {
    return new CrossCuttingConcernsEventBuilder()
  }
}