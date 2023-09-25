import { TimelineObjectGroup } from './timeline-object'

export interface Timeline {
  timelineGroups: TimelineObjectGroup[]
  autoNext?: {
    epochTimeToTakeNext: number
  }
}
