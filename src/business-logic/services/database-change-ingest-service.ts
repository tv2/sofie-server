import { IngestService } from './interfaces/ingest-service'
import { RundownRepository } from '../../data-access/repositories/interfaces/rundown-repository'
import { Rundown } from '../../model/entities/rundown'
import { DataChangedListener } from '../../data-access/repositories/interfaces/data-changed-listener'
import { RundownEventEmitter } from './interfaces/rundown-event-emitter'
import { RundownEventBuilder } from './interfaces/rundown-event-builder'
import {
  PartCreatedEvent,
  PartDeletedEvent,
  SegmentCreatedEvent,
  SegmentDeletedEvent
} from '../../model/value-objects/rundown-event'
import { Segment } from '../../model/entities/segment'
import { TimelineBuilder } from './interfaces/timeline-builder'
import { TimelineRepository } from '../../data-access/repositories/interfaces/timeline-repository'
import { Timeline } from '../../model/entities/timeline'
import { Part } from '../../model/entities/part'
import { Exception } from '../../model/exceptions/exception'
import { ErrorCode } from '../../model/enums/error-code'

export class DatabaseChangeIngestService implements IngestService {

  constructor(
    private readonly rundownRepository: RundownRepository,
    private readonly timelineRepository: TimelineRepository,
    private readonly timelineBuilder: TimelineBuilder,
    private readonly eventEmitter: RundownEventEmitter,
    private readonly eventBuilder: RundownEventBuilder,
    segmentChangedListener: DataChangedListener<Segment>,
    partChangedListener: DataChangedListener<Part>
  ) {
    segmentChangedListener.onCreated(segment => this.segmentCreated(segment))
    segmentChangedListener.onUpdated(segment => this.segmentUpdated(segment))
    segmentChangedListener.onDeleted(segmentId => this.segmentDeleted(segmentId))

    partChangedListener.onCreated(part => this.partCreated(part))
    partChangedListener.onUpdated(part => this.partUpdated(part))
    partChangedListener.onDeleted(partId => this.partDeleted(partId))
  }

  private async segmentCreated(segment: Segment): Promise<void> {
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

  // eslint-disable-next-line @typescript-eslint/require-await
  private async segmentUpdated(segment: Segment): Promise<void> {
    console.log(`### Segment from update: ${segment.id}`)
  }

  private async segmentDeleted(segmentId: string): Promise<void> {
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

  private async partCreated(part: Part): Promise<void> {
    let rundown: Rundown
    try {
      rundown = await this.rundownRepository.getRundownBySegmentId(part.getSegmentId())
    } catch (exception) {
      if ((exception as Exception).errorCode !== ErrorCode.NOT_FOUND) {
        throw exception
      }
      // No Segment created for Part yet which means the creation of the Part will be handled by "SegmentCreated"
      return
    }

    rundown.addPartToSegment(part, part.getSegmentId())

    const event: PartCreatedEvent = this.eventBuilder.buildPartCreatedEvent(rundown, part)
    this.eventEmitter.emitRundownEvent(event)

    await this.rundownRepository.saveRundown(rundown)
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async partUpdated(part: Part): Promise<void> {
    console.log(`### Part from update: ${part.id}`)
  }

  private async partDeleted(partId: string): Promise<void> {
    try {
      const rundown: Rundown = await this.rundownRepository.getRundownByPartId(partId)

      rundown.removePartFromSegment(partId)

      const event: PartDeletedEvent = this.eventBuilder.buildPartDeletedEvent(rundown, partId)
      this.eventEmitter.emitRundownEvent(event)

      await this.rundownRepository.saveRundown(rundown)
    } catch (exception) {
      if ((exception as Exception).errorCode !== ErrorCode.NOT_FOUND) {
        throw exception
      }
      console.log(`### Something went wrong while trying to delete Part ${partId}`)
    }
  }
}
