import { PieceLifespan } from '../enums/piece-lifespan'
import { TransitionType } from '../enums/transition-type'
import { TimelineObject } from './timeline-object'

export interface IngestedPiece {
  readonly id: string
  readonly partId: string
  readonly name: string
  readonly layer: string
  readonly pieceLifespan: PieceLifespan
  readonly start: number
  readonly duration?: number
  readonly preRollDuration: number
  readonly postRollDuration: number
  readonly transitionType: TransitionType
  readonly timelineObjects: TimelineObject[]
  readonly metadata?: unknown
  readonly content?: unknown
}
