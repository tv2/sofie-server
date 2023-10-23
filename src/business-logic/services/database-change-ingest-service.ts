import { IngestService } from './interfaces/ingest-service'
import { RundownRepository } from '../../data-access/repositories/interfaces/rundown-repository'
import { Rundown } from '../../model/entities/rundown'
import { DataChangedListener } from '../../data-access/repositories/interfaces/data-changed-listener'
import { RundownEventEmitter } from './interfaces/rundown-event-emitter'
import { RundownEventBuilder } from './interfaces/rundown-event-builder'
import {
  PartCreatedEvent,
  PartDeletedEvent,
  PartSetAsNextEvent,
  PartUpdatedEvent,
  RundownCreatedEvent,
  RundownDeletedEvent,
  RundownEvent,
  RundownUpdatedEvent,
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

const BULK_EXECUTION_TIMESPAN_IN_MS: number = 500

export class DatabaseChangeIngestService implements IngestService {

  private static instance: IngestService

  public static getInstance(rundownRepository: RundownRepository,
    timelineRepository: TimelineRepository,
    timelineBuilder: TimelineBuilder,
    eventEmitter: RundownEventEmitter,
    eventBuilder: RundownEventBuilder,
    rundownChangeListener: DataChangedListener<Rundown>,
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
        rundownChangeListener,
        segmentChangedListener,
        partChangedListener
      )
    }
    return this.instance
  }

  private readonly eventQueue: (() => Promise<void>)[] = []
  private isExecutingEvent: boolean = false
  private lastBulkExecutionStartTimestamp: number = 0
  private readonly rundownIdsToBuild: Set<string> = new Set<string>()

  private constructor(
    private readonly rundownRepository: RundownRepository,
    private readonly timelineRepository: TimelineRepository,
    private readonly timelineBuilder: TimelineBuilder,
    private readonly eventEmitter: RundownEventEmitter,
    private readonly eventBuilder: RundownEventBuilder,
    rundownChangeListener: DataChangedListener<Rundown>,
    segmentChangedListener: DataChangedListener<Segment>,
    partChangedListener: DataChangedListener<Part>
  ) {
    this.listenForRundownChanges(rundownChangeListener)
    this.listenForSegmentChanges(segmentChangedListener)
    this.listenForPartChanges(partChangedListener)
  }

  private listenForRundownChanges(rundownChangeListener: DataChangedListener<Rundown>): void {
    rundownChangeListener.onCreated(rundown => this.enqueueEvent(() => this.createRundown(rundown)))
    rundownChangeListener.onUpdated(rundown => this.enqueueEvent(() => this.updateRundown(rundown)))
    rundownChangeListener.onDeleted(rundownId => this.enqueueEvent(() => this.deleteRundown(rundownId)))
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
    if (Date.now() - this.lastBulkExecutionStartTimestamp >= BULK_EXECUTION_TIMESPAN_IN_MS) {
      this.lastBulkExecutionStartTimestamp = Date.now()
    }
    const eventCallback: (() => Promise<void>) | undefined = this.eventQueue.shift()
    if (!eventCallback) {
      return
    }

    this.isExecutingEvent = true
    eventCallback()
      .catch(error => console.error('Error when executing Ingest event:', error))
      .finally(() => {
        this.isExecutingEvent = false
        void this.buildRundowns()
        this.executeNextEvent()
      })
  }

  private async buildRundowns(): Promise<void> {
    try {
      if (Date.now() - this.lastBulkExecutionStartTimestamp < BULK_EXECUTION_TIMESPAN_IN_MS && this.eventQueue.length > 0) {
        return
      }

      for (const rundownId of this.rundownIdsToBuild.values()) {
        const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
        if (!rundown.isActive()) {
          continue
        }
        await this.buildAndPersistTimeline(rundown)
        this.emitSetNextEvent(rundown)
      }
      this.rundownIdsToBuild.clear()
    } catch (error) {
      console.log('Error when trying to build Rundowns for bulk', error)
    }
  }

  private async buildAndPersistTimeline(rundown: Rundown): Promise<void> {
    const timeline: Timeline = await this.timelineBuilder.buildTimeline(rundown)
    await this.timelineRepository.saveTimeline(timeline)
  }

  private emitSetNextEvent(rundown: Rundown): void {
    const setNextEvent: PartSetAsNextEvent = this.eventBuilder.buildSetNextEvent(rundown)
    this.eventEmitter.emitRundownEvent(setNextEvent)
  }

  private async createRundown(rundown: Rundown): Promise<void> {
    const rundownCreatedEvent: RundownCreatedEvent = this.eventBuilder.buildRundownCreatedEvent(rundown)
    this.eventEmitter.emitRundownEvent(rundownCreatedEvent)
    await this.rundownRepository.saveRundown(rundown)
  }

  private async updateRundown(rundown: Rundown): Promise<void> {
    const rundownUpdatedEvent: RundownUpdatedEvent = this.eventBuilder.buildRundownUpdatedEvent(rundown)
    this.eventEmitter.emitRundownEvent(rundownUpdatedEvent)
    await this.rundownRepository.saveRundown(rundown)
  }

  private async deleteRundown(rundownId: string): Promise<void> {
    const rundownDeletedEvent: RundownDeletedEvent = this.eventBuilder.buildRundownDeletedEvent(rundownId)
    this.eventEmitter.emitRundownEvent(rundownDeletedEvent)
    await this.rundownRepository.deleteRundown(rundownId)
  }

  private async createSegment(segment: Segment): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(segment.rundownId)
    try {
      rundown.addSegment(segment)
    } catch (exception) {
      this.throwIfNot(ErrorCode.ALREADY_EXIST, exception as Exception)
      // Segment already exist on Rundown, so we don't need to do anything else.
      return
    }

    const segmentCreatedEvent: SegmentCreatedEvent = this.eventBuilder.buildSegmentCreatedEvent(rundown, segment)
    await this.persistRundown(rundown, segmentCreatedEvent)
  }

  private throwIfNot(errorCodeToCheck: ErrorCode, exception: Exception): void {
    if (exception.errorCode === errorCodeToCheck) {
      return
    }
    throw exception
  }

  private async persistRundown(rundown: Rundown, eventToEmit: RundownEvent): Promise<void> {
    this.rundownIdsToBuild.add(rundown.id)
    this.eventEmitter.emitRundownEvent(eventToEmit)
    await this.rundownRepository.saveRundown(rundown)
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

    const segmentUpdatedEvent: SegmentUpdatedEvent = this.eventBuilder.buildSegmentUpdatedEvent(rundown, segment)
    await this.persistRundown(rundown, segmentUpdatedEvent)
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

    const segmentDeletedEvent: SegmentDeletedEvent = this.eventBuilder.buildSegmentDeletedEvent(rundown, segmentId)
    await this.persistRundown(rundown, segmentDeletedEvent)
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

    try {
      rundown.addPart(part)
    } catch (exception) {
      this.throwIfNot(ErrorCode.ALREADY_EXIST, exception as Exception)
      // Part already exist, so no need to add it again.
      return
    }

    const partCreatedEvent: PartCreatedEvent = this.eventBuilder.buildPartCreatedEvent(rundown, part)
    await this.persistRundown(rundown, partCreatedEvent)
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

    const partUpdatedEvent: PartUpdatedEvent = this.eventBuilder.buildPartUpdatedEvent(rundown, part)
    await this.persistRundown(rundown, partUpdatedEvent)
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

    const partDeletedEvent: PartDeletedEvent = this.eventBuilder.buildPartDeletedEvent(rundown, partId)
    await this.persistRundown(rundown, partDeletedEvent)
  }
}
