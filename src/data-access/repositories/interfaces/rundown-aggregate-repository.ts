import { RundownRepository } from './rundown-repository'
import { SegmentRepository } from './segment-repository'
import { PartRepository } from './part-repository'

export type RundownAggregateRepository = RundownRepository & SegmentRepository & PartRepository
