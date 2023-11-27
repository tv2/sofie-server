import { TimelineObject } from './timeline-object'
import { IngestedSegment } from './ingested-segment'
import { RundownTiming } from '../value-objects/rundown-timing'

export interface IngestedRundown {
  id: string
  name: string
  showStyleVariantId: string
  ingestedSegments: IngestedSegment[]
  baselineTimelineObjects: TimelineObject[]
  modifiedAt: number
  timings: RundownTiming
}
