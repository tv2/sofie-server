import { PieceLifespan } from '../enums/piece-lifespan'
import { TransitionType } from '../enums/transition-type'
import { TimelineObject } from './timeline-object'

export interface IngestedPiece {
  id: string
  partId: string
  name: string
  layer: string
  pieceLifespan: PieceLifespan
  start: number
  duration?: number
  preRollDuration: number
  postRollDuration: number
  transitionType: TransitionType
  timelineObjects: TimelineObject[]
  metadata?: unknown
  content?: unknown
}
