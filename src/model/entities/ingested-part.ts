import { InTransition } from '../value-objects/in-transition'
import { OutTransition } from '../value-objects/out-transition'
import { AutoNext } from '../value-objects/auto-next'
import { PartTimings } from '../value-objects/part-timings'
import { IngestedPiece } from './ingested-piece'

export interface IngestedPart {
  id: string
  segmentId: string
  rundownId: string
  name: string
  rank: number
  ingestedPieces: IngestedPiece[]
  expectedDuration?: number

  inTransition: InTransition
  outTransition: OutTransition

  autoNext?: AutoNext
  disableNextInTransition: boolean

  isUntimed: boolean
  timings?: PartTimings
}
