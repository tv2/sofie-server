import { Part } from '../entities/part'
import { Segment } from '../entities/segment'
import { Owner } from '../enums/owner'

export interface RundownCursor {
  readonly segment: Segment
  readonly part: Part
  readonly owner: Owner
}
