import { IngestedPart } from './ingested-part'

export interface IngestedSegment {
  readonly id: string
  readonly rundownId: string
  readonly name: string
  readonly rank: number
  readonly isHidden: boolean
  readonly metadata?: unknown
  readonly budgetDuration?: number
  readonly ingestedParts: Readonly<IngestedPart[]>
}
