import { PartDto } from './part-dto'
import { Segment } from '../../model/entities/segment'

export class SegmentDto {
  public readonly id: string
  public readonly rundownId: string
  public readonly name: string
  public readonly isOnAir: boolean
  public readonly isNext: boolean
  public readonly isUnsynced: boolean
  public readonly budgetDuration?: number
  public readonly parts: PartDto[]

  constructor(segment: Segment) {
    this.id = segment.id
    this.rundownId = segment.rundownId
    this.name = segment.name
    this.isOnAir = segment.isOnAir()
    this.isNext = segment.isNext()
    this.isUnsynced = segment.isUnsynced()
    this.budgetDuration = segment.budgetDuration
    this.parts = segment.getParts().map((part) => new PartDto(part))
  }
}
