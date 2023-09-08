import { PartDto } from './part-dto'
import { Segment } from '../../model/entities/segment'

export class SegmentDto {
  public readonly id: string
  public readonly rundownId: string
  public readonly name: string
  public readonly parts: PartDto[]
  public readonly isOnAir: boolean
  public readonly isNext: boolean

  constructor(segment: Segment) {
    this.id = segment.id
    this.rundownId = segment.rundownId
    this.name = segment.name
    this.parts = segment.getParts().map((part) => new PartDto(part))
    this.isOnAir = segment.isOnAir()
    this.isNext = segment.isNext()
  }
}
