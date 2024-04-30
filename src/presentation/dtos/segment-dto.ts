import { PartDto } from './part-dto'
import { Segment } from '../../model/entities/segment'

export class SegmentDto {
  public readonly id: string
  public readonly rundownId: string
  public readonly name: string
  public readonly isOnAir: boolean
  public readonly isNext: boolean
  public readonly isUntimed: boolean
  public readonly isUnsynced: boolean
  public readonly rank: number
  public readonly isHidden: boolean
  public readonly referenceTag?: string
  public readonly metadata?: unknown
  public readonly expectedDurationInMs?: number
  public readonly executedAtEpochTime?: number
  public readonly parts: PartDto[]

  constructor(segment: Segment) {
    this.id = segment.id
    this.rundownId = segment.rundownId
    this.name = segment.name
    this.isOnAir = segment.isOnAir()
    this.isNext = segment.isNext()
    this.isUntimed = segment.isSegmentUntimed()
    this.isUnsynced = segment.isUnsynced()
    this.rank = segment.rank
    this.isHidden = segment.isHidden
    this.referenceTag = segment.referenceTag
    this.metadata = segment.metadata
    this.expectedDurationInMs = segment.expectedDurationInMs
    this.executedAtEpochTime = segment.getExecutedAtEpochTime()
    this.parts = segment.getParts().map((part) => new PartDto(part))
  }
}
