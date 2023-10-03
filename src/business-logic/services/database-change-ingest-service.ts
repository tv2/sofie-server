import { IngestService } from './interfaces/ingest-service'
import { RundownRepository } from '../../data-access/repositories/interfaces/rundown-repository'
import { Rundown } from '../../model/entities/rundown'
import { DataChangedListener } from '../../data-access/repositories/interfaces/data-changed-listener'
import { RundownEventEmitter } from './interfaces/rundown-event-emitter'
import { RundownEventBuilder } from './interfaces/rundown-event-builder'
import { SegmentCreatedEvent, SegmentDeletedEvent } from '../../model/value-objects/rundown-event'
import { SegmentRepository } from '../../data-access/repositories/interfaces/segment-repository'
import { Segment } from '../../model/entities/segment'
import { TimelineBuilder } from './interfaces/timeline-builder'
import { TimelineRepository } from '../../data-access/repositories/interfaces/timeline-repository'
import { Timeline } from '../../model/entities/timeline'

export class DatabaseChangeIngestService implements IngestService {

  constructor(
    private readonly rundownRepository: RundownRepository,
    private readonly segmentRepository: SegmentRepository,
    private readonly timelineRepository: TimelineRepository,
    private readonly timelineBuilder: TimelineBuilder,
    private readonly eventEmitter: RundownEventEmitter,
    private readonly eventBuilder: RundownEventBuilder,
    segmentChangedListener: DataChangedListener
  ) {
    segmentChangedListener.onCreated(segmentId => this.segmentCreated(segmentId))
    segmentChangedListener.onDeleted(segmentId => this.segmentDeleted(segmentId))
  }

  public async segmentCreated(segmentId: string): Promise<void> {
    const segment: Segment = await this.segmentRepository.getSegment(segmentId)
    const rundown: Rundown = await this.rundownRepository.getRundown(segment.rundownId)
    rundown.addSegment(segment)

    await this.buildAndPersistTimelineIfActiveRundown(rundown)

    const event: SegmentCreatedEvent = this.eventBuilder.buildSegmentCreatedEvent(rundown, segment)
    this.eventEmitter.emitRundownEvent(event)

    await this.rundownRepository.saveRundown(rundown)
  }

  private async buildAndPersistTimelineIfActiveRundown(rundown: Rundown): Promise<void> {
    if (!rundown.isActive()) {
      return
    }
    const timeline: Timeline = await this.timelineBuilder.buildTimeline(rundown)
    await this.timelineRepository.saveTimeline(timeline)
  }

  public async segmentDeleted(segmentId: string): Promise<void> {
    try {
      const rundown: Rundown = await this.rundownRepository.getRundownBySegmentId(segmentId)
      rundown.removeSegment(segmentId)

      await this.buildAndPersistTimelineIfActiveRundown(rundown)

      const event: SegmentDeletedEvent = this.eventBuilder.buildSegmentDeletedEvent(rundown, segmentId)
      this.eventEmitter.emitRundownEvent(event)

      await this.rundownRepository.saveRundown(rundown)
    } catch (error) {
      console.error('Error while processing Segment Deleted event', error)
    }
  }
}
