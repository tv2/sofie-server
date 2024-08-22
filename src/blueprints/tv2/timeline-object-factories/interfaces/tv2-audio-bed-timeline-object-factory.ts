import { Tv2BlueprintConfiguration } from '../../value-objects/tv2-blueprint-configuration'
import { Tv2BlueprintTimelineObject } from '../../value-objects/tv2-metadata'

export interface Tv2AudioBedTimelineObjectFactory {
  createAudioBedTimelineObject(audioBedName: string, blueprintConfiguration: Tv2BlueprintConfiguration): Tv2BlueprintTimelineObject
}
