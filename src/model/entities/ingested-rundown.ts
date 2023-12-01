import { TimelineObject } from './timeline-object'
import { IngestedSegment } from './ingested-segment'
import { RundownTiming } from '../value-objects/rundown-timing'

export interface IngestedRundown {
  readonly id: string
  readonly name: string
  readonly showStyleVariantId: string
  readonly modifiedAt: number
  readonly timings: RundownTiming

  ingestedSegments: IngestedSegment[]
  baselineTimelineObjects: TimelineObject[]
}
