import { RundownEventBuilder } from '../interfaces/rundown-event-builder'
import { RundownEventBuilderImplementation } from '../services/rundown-event-builder-implementation'

export class EventBuilderFacade {
    public static createRundownEventBuilder(): RundownEventBuilder {
        return new RundownEventBuilderImplementation()
    }
}
