import { TimelineObject } from '../../../rundown-execution/domain/entities/timeline-object'

export interface RundownBaselineRepository {
  getRundownBaseline(rundownId: string): Promise<TimelineObject[]>
}
