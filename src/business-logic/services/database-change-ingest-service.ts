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

  private static instance: IngestService

  public static getInstance(rundownRepository: RundownRepository,
    timelineRepository: TimelineRepository,
    timelineBuilder: TimelineBuilder,
    eventEmitter: RundownEventEmitter,
    eventBuilder: RundownEventBuilder,
    segmentChangedListener: DataChangedListener<Segment>,
    partChangedListener: DataChangedListener<Part>
  ): IngestService {
    if (!this.instance) {
      this.instance = new DatabaseChangeIngestService(
        rundownRepository,
        timelineRepository,
        timelineBuilder,
        eventEmitter,
        eventBuilder,
        segmentChangedListener,
        partChangedListener
      )
    }
    return this.instance
  }

  private readonly eventQueue: (() => Promise<void>)[] = []
  private isExecutingEvent: boolean = false

  private constructor(
    private readonly rundownRepository: RundownRepository,
    private readonly timelineRepository: TimelineRepository,
    private readonly timelineBuilder: TimelineBuilder,
    private readonly eventEmitter: RundownEventEmitter,
    private readonly eventBuilder: RundownEventBuilder,
    segmentChangedListener: DataChangedListener<Segment>,
    partChangedListener: DataChangedListener<Part>
  ) {
    this.listenForSegmentChanges(segmentChangedListener)
    this.listenForPartChanges(partChangedListener)
  }

  private listenForSegmentChanges(segmentChangedListener: DataChangedListener<Segment>): void {
    segmentChangedListener.onCreated(segment => this.enqueueEvent(() => this.createSegment(segment)))
    segmentChangedListener.onUpdated(segment => this.enqueueEvent(() => this.updatedSegment(segment)))
    segmentChangedListener.onDeleted(segmentId => this.enqueueEvent(() => this.deleteSegment(segmentId)))
  }

  private listenForPartChanges(partChangedListener: DataChangedListener<Part>): void {
    partChangedListener.onCreated(part => this.enqueueEvent(() => this.createPart(part)))
    partChangedListener.onUpdated(part => this.enqueueEvent(() => this.updatePart(part)))
    partChangedListener.onDeleted(partId => this.enqueueEvent(() => this.deletePart(partId)))
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
    console.debug('[DEBUG] Executing Ingest Event')
    eventCallback()
      .catch(error => console.error(error))
      .finally(() => {
        this.isExecutingEvent = false
        this.executeNextEvent()
      })
  }

  private async createSegment(segment: Segment): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(segment.rundownId)
    try {
      rundown.addSegment(segment)
    } catch (error) {
      this.throwIfNot(ErrorCode.ALREADY_EXIST, error as Exception)
      // Segment already exist on Rundown, so we don't need to do anything else.
      return
    }

    await this.buildAndPersistTimelineIfActiveRundown(rundown)

    const event: SegmentCreatedEvent = this.eventBuilder.buildSegmentCreatedEvent(rundown, segment)
    this.eventEmitter.emitRundownEvent(event)

    await this.rundownRepository.saveRundown(rundown)
  }

  private throwIfNot(errorCodeToCheck: ErrorCode, exception: Exception): void {
    if (exception.errorCode === errorCodeToCheck) {
      return
    }
    throw exception
  }

  private async buildAndPersistTimelineIfActiveRundown(rundown: Rundown): Promise<void> {
    if (!rundown.isActive()) {
      return
    }
    const timeline: Timeline = await this.timelineBuilder.buildTimeline(rundown)
    await this.timelineRepository.saveTimeline(timeline)
  }

  private async updatedSegment(segment: Segment): Promise<void> {
    let rundown: Rundown
    try {
      rundown = await this.rundownRepository.getRundownBySegmentId(segment.id)
    } catch (exception) {
      this.throwIfNot(ErrorCode.NOT_FOUND, exception as Exception)
      // No Rundown found for Segment, so we have nowhere to update the Segment on.
      return
    }

    rundown.updateSegment(segment)

    await this.buildAndPersistTimelineIfActiveRundown(rundown)

    const event: SegmentUpdatedEvent = this.eventBuilder.buildSegmentUpdatedEvent(rundown, segment)
    this.eventEmitter.emitRundownEvent(event)

    await this.rundownRepository.saveRundown(rundown)
  }

  private async deleteSegment(segmentId: string): Promise<void> {
    let rundown: Rundown
    try {
      rundown = await this.rundownRepository.getRundownBySegmentId(segmentId)
    } catch (exception) {
      this.throwIfNot(ErrorCode.NOT_FOUND, exception as Exception)
      // Segment is not found on any Rundown which means it is already deleted.
      return
    }

    rundown.removeSegment(segmentId)

    await this.buildAndPersistTimelineIfActiveRundown(rundown)

    const event: SegmentDeletedEvent = this.eventBuilder.buildSegmentDeletedEvent(rundown, segmentId)
    this.eventEmitter.emitRundownEvent(event)

    await this.rundownRepository.saveRundown(rundown)
  }

  private async createPart(part: Part): Promise<void> {
    let rundown: Rundown
    try {
      rundown = await this.rundownRepository.getRundownBySegmentId(part.getSegmentId())
    } catch (exception) {
      this.throwIfNot(ErrorCode.NOT_FOUND, exception as Exception)
      // No Rundown found for Part, so we have nowhere to create the Part on.
      return
    }

    rundown.addPart(part)

    await this.buildAndPersistTimelineIfActiveRundown(rundown)

    const event: PartCreatedEvent = this.eventBuilder.buildPartCreatedEvent(rundown, part)
    this.eventEmitter.emitRundownEvent(event)

    await this.rundownRepository.saveRundown(rundown)
  }

  private async updatePart(part: Part): Promise<void> {
    let rundown: Rundown
    try {
      rundown = await this.rundownRepository.getRundownBySegmentId(part.getSegmentId())
    } catch (exception) {
      this.throwIfNot(ErrorCode.NOT_FOUND, exception as Exception)
      // No Rundown found for Part, so we have nowhere to update the Part on.
      return
    }

    rundown.updatePart(part)

    await this.buildAndPersistTimelineIfActiveRundown(rundown)

    const event: PartUpdatedEvent = this.eventBuilder.buildPartUpdatedEvent(rundown, part)
    this.eventEmitter.emitRundownEvent(event)

    await this.rundownRepository.saveRundown(rundown)
  }

  private async deletePart(partId: string): Promise<void> {
    let rundown: Rundown
    try {
      rundown = await this.rundownRepository.getRundownByPartId(partId)
    } catch (exception) {
      this.throwIfNot(ErrorCode.NOT_FOUND, exception as Exception)
      // Part isn't found means it's already deleted.
      return
    }

    rundown.removePartFromSegment(partId)

    await this.buildAndPersistTimelineIfActiveRundown(rundown)

    const event: PartDeletedEvent = this.eventBuilder.buildPartDeletedEvent(rundown, partId)
    this.eventEmitter.emitRundownEvent(event)

    await this.rundownRepository.saveRundown(rundown)
  }
}
