import { TimelineObject } from '../../../../model/entities/timeline-object'
import { Tv2BlueprintConfiguration } from '../../value-objects/tv2-blueprint-configuration'

export interface Tv2AudioTimelineObjectFactory {
  createStopAudioBedTimelineObject(duration: number): TimelineObject
  createMicrophoneUpTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration): TimelineObject
  createMicrophoneDownTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration): TimelineObject
  createResynchronizeTimelineObject(): TimelineObject

  createFullPilotTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration): TimelineObject
}
