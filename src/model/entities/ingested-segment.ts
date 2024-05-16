import { IngestedPart } from './ingested-part'
import { Invalidity } from '../value-objects/invalidity'

export interface IngestedSegment {
  readonly id: string
  readonly rundownId: string
  readonly name: string
  readonly rank: number
  readonly isHidden: boolean
  readonly referenceTag?: string
  readonly metadata?: unknown
  readonly budgetDuration?: number
  readonly ingestedParts: Readonly<IngestedPart[]>
  readonly invalidity?: Invalidity
}
