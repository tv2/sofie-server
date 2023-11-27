import { IngestedPart } from './ingested-part'

export interface IngestedSegment {
  id: string
  rundownId: string
  name: string
  rank: number
  ingestedParts: IngestedPart[]
  budgetDuration?: number
}
