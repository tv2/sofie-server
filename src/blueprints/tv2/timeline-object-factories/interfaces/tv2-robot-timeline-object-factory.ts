import { Tv2BlueprintTimelineObject } from '../../value-objects/tv2-metadata'

export interface Tv2RobotTimelineObjectFactory {
  createCallPresetTimelineObject(preset: number): Tv2BlueprintTimelineObject
}
