import { IngestService } from './interfaces/ingest-service'
import { RundownRepository } from '../../data-access/repositories/interfaces/rundown-repository'
import { Rundown } from '../../model/entities/rundown'
import { DataChangedListener } from '../../data-access/repositories/interfaces/data-changed-listener'
import { RundownEventEmitter } from './interfaces/rundown-event-emitter'
import { RundownEventBuilder } from './interfaces/rundown-event-builder'
import {
  PartCreatedEvent,
  PartDeletedEvent,
  PartUpdatedEvent,
  SegmentCreatedEvent,
  SegmentDeletedEvent,
  SegmentUpdatedEvent
} from '../../model/value-objects/rundown-event'
import { Segment } from '../../model/entities/segment'
import { TimelineBuilder } from './interfaces/timeline-builder'
import { TimelineRepository } from '../../data-access/repositories/interfaces/timeline-repository'
import { Timeline } from '../../model/entities/timeline'
import { Part } from '../../model/entities/part'
import { Exception } from '../../model/exceptions/exception'
import { ErrorCode } from '../../model/enums/error-code'

export class DatabaseChangeIngestService implements IngestService {

  // TODO: Singleton

  private readonly eventQueue: (() => Promise<void>)[] = []
  private isExecutingEvent: boolean = false

  constructor(
    private readonly rundownRepository: RundownRepository,
    private readonly timelineRepository: TimelineRepository,
    private readonly timelineBuilder: TimelineBuilder,
    private readonly eventEmitter: RundownEventEmitter,
    private readonly eventBuilder: RundownEventBuilder,
    segmentChangedListener: DataChangedListener<Segment>,
    partChangedListener: DataChangedListener<Part>
  ) {
    segmentChangedListener.onCreated(segment => this.enqueueEvent(() => this.segmentCreated(segment)))
    segmentChangedListener.onUpdated(segment => this.enqueueEvent(() => this.segmentUpdated(segment)))
    segmentChangedListener.onDeleted(segmentId => this.enqueueEvent(() => this.segmentDeleted(segmentId)))

    partChangedListener.onCreated(part => this.enqueueEvent(() => this.partCreated(part)))
    partChangedListener.onUpdated(part => this.enqueueEvent(() => this.partUpdated(part)))
    partChangedListener.onDeleted(partId => this.enqueueEvent(() => this.partDeleted(partId)))
  }

  private enqueueEvent(event: () => Promise<void>): void {
    this.eventQueue.push(event)
    this.executeNextEvent()
  }

  private executeNextEvent(): void {
    if (this.isExecutingEvent) {
      return
    }
    const eventCallback: (() => Promise<void>) | undefined = this.eventQueue.shift()
    if (!eventCallback) {
      return
    }

    this.isExecutingEvent = true
    eventCallback().then(() => {
      this.isExecutingEvent = false
      this.executeNextEvent()
    }).catch(error => console.error(error))
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

  private async segmentUpdated(segment: Segment): Promise<void> {
    let rundown: Rundown
    try {
      rundown = await this.rundownRepository.getRundownBySegmentId(segment.id)
    } catch (exception) {
      if ((exception as Exception).errorCode !== ErrorCode.NOT_FOUND) {
        throw exception
      }
      console.log(`Couldn't find a Rundown while updating Segment ${segment.id}`)
      return
    }

    rundown.updateSegment(segment)

    await this.buildAndPersistTimelineIfActiveRundown(rundown)

    const event: SegmentUpdatedEvent = this.eventBuilder.buildSegmentUpdatedEvent(rundown, segment)
    this.eventEmitter.emitRundownEvent(event)

    await this.rundownRepository.saveRundown(rundown)
  }

  private async segmentDeleted(segmentId: string): Promise<void> {
    let rundown: Rundown
    try {
      rundown = await this.rundownRepository.getRundownBySegmentId(segmentId)
    } catch (exception) {
      if ((exception as Exception).errorCode !== ErrorCode.NOT_FOUND) {
        throw exception
      }
      console.log(`### Unable to delete Segment ${segmentId}. Segment is not found on any Rundown`)
      return
    }

    rundown.removeSegment(segmentId)

    await this.buildAndPersistTimelineIfActiveRundown(rundown)

    const event: SegmentDeletedEvent = this.eventBuilder.buildSegmentDeletedEvent(rundown, segmentId)
    this.eventEmitter.emitRundownEvent(event)

    await this.rundownRepository.saveRundown(rundown)
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

    rundown.addPart(part)

    await this.buildAndPersistTimelineIfActiveRundown(rundown)

    const event: PartCreatedEvent = this.eventBuilder.buildPartCreatedEvent(rundown, part)
    this.eventEmitter.emitRundownEvent(event)

    await this.rundownRepository.saveRundown(rundown)
  }

  private async partUpdated(part: Part): Promise<void> {
    let rundown: Rundown
    try {
      rundown = await this.rundownRepository.getRundownBySegmentId(part.getSegmentId())
    } catch (exception) {
      if ((exception as Exception).errorCode !== ErrorCode.NOT_FOUND) {
        throw exception
      }
      console.log(`Couldn't find a Rundown while updating Part ${part.id}`)
      return
    }

    rundown.updatePart(part)

    await this.buildAndPersistTimelineIfActiveRundown(rundown)

    const event: PartUpdatedEvent = this.eventBuilder.buildPartUpdatedEvent(rundown, part)
    this.eventEmitter.emitRundownEvent(event)

    await this.rundownRepository.saveRundown(rundown)
  }

  private async partDeleted(partId: string): Promise<void> {
    let rundown: Rundown
    try {
      rundown = await this.rundownRepository.getRundownByPartId(partId)
    } catch (exception) {
      if ((exception as Exception).errorCode !== ErrorCode.NOT_FOUND) {
        throw exception
      }
      console.log(`### Unable to delete Part ${partId}. Part is not found on any Rundown`)
      return
    }

    rundown.removePartFromSegment(partId)

    await this.buildAndPersistTimelineIfActiveRundown(rundown)

    const event: PartDeletedEvent = this.eventBuilder.buildPartDeletedEvent(rundown, partId)
    this.eventEmitter.emitRundownEvent(event)

    await this.rundownRepository.saveRundown(rundown)
  }
}
