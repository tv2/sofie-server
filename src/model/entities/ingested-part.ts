import { InTransition } from '../value-objects/in-transition'
import { OutTransition } from '../value-objects/out-transition'
import { AutoNext } from '../value-objects/auto-next'
import { PartTimings } from '../value-objects/part-timings'
import { IngestedPiece } from './ingested-piece'

export interface IngestedPart {
  readonly id: string
  readonly segmentId: string
  readonly rundownId: string
  readonly name: string
  readonly rank: number
  readonly expectedDuration?: number

  readonly inTransition: InTransition
  readonly outTransition: OutTransition

  readonly autoNext?: AutoNext
  readonly disableNextInTransition: boolean

  readonly isUntimed: boolean
  readonly timings?: PartTimings

  ingestedPieces: IngestedPiece[]
}
