import { RundownRepository } from './rundown-repository'
import { SegmentRepository } from './segment-repository'
import { PartRepository } from './part-repository'
import { PieceRepository } from './piece-repository'

export interface RundownAggregateRepository extends RundownRepository, SegmentRepository, PartRepository, PieceRepository {}
