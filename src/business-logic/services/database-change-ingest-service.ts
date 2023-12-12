import { IngestChangeService } from './interfaces/ingest-change-service'
import { RundownRepository } from '../../data-access/repositories/interfaces/rundown-repository'
import { Rundown } from '../../model/entities/rundown'
import { DataChangedListener } from '../../data-access/repositories/interfaces/data-changed-listener'
import { RundownEventEmitter } from './interfaces/rundown-event-emitter'
import { Segment } from '../../model/entities/segment'
import { TimelineBuilder } from './interfaces/timeline-builder'
import { TimelineRepository } from '../../data-access/repositories/interfaces/timeline-repository'
import { Timeline } from '../../model/entities/timeline'
import { Part } from '../../model/entities/part'
import { IngestedRundown } from '../../model/entities/ingested-rundown'
import { IngestedSegment } from '../../model/entities/ingested-segment'
import { IngestedPart } from '../../model/entities/ingested-part'
import { PartRepository } from '../../data-access/repositories/interfaces/part-repository'
import { SegmentRepository } from '../../data-access/repositories/interfaces/segment-repository'
import { NotFoundException } from '../../model/exceptions/not-found-exception'
import { IngestedEntityToEntityMapper } from './ingested-entity-to-entity-mapper'
import { IngestedRundownRepository } from '../../data-access/repositories/interfaces/ingested-rundown-repository'
import { BasicRundown } from '../../model/entities/basic-rundown'

const BULK_EXECUTION_TIMESPAN_IN_MS: number = 500

export class DatabaseChangeIngestService implements IngestChangeService {

  private static instance: IngestChangeService

  public static getInstance(
    ingestedRundownRepository: IngestedRundownRepository,
    rundownRepository: RundownRepository,
    segmentRepository: SegmentRepository,
    partRepository: PartRepository,
    timelineRepository: TimelineRepository,
    timelineBuilder: TimelineBuilder,
    eventEmitter: RundownEventEmitter,
    ingestedEntityToEntityMapper: IngestedEntityToEntityMapper,
    rundownChangeListener: DataChangedListener<IngestedRundown>,
    segmentChangedListener: DataChangedListener<IngestedSegment>,
    partChangedListener: DataChangedListener<IngestedPart>
  ): IngestChangeService {
    if (!this.instance) {
      this.instance = new DatabaseChangeIngestService(
        ingestedRundownRepository,
        rundownRepository,
        segmentRepository,
        partRepository,
        timelineRepository,
        timelineBuilder,
        eventEmitter,
        ingestedEntityToEntityMapper,
        rundownChangeListener,
        segmentChangedListener,
        partChangedListener
      )
    }
    return this.instance
  }

  // Event Queue Priority: The lower the number, the higher the priority
  private readonly eventPriorityQueue: Record<number, (() => Promise<void>)[]> = { }
  private isExecutingEvent: boolean = false
  private lastBulkExecutionStartTimestamp: number = 0
  private readonly rundownIdsToBuild: Set<string> = new Set<string>()

  private timerId: NodeJS.Timeout | undefined

  private constructor(
    private readonly ingestedRundownRepository: IngestedRundownRepository,
    private readonly rundownRepository: RundownRepository,
    private readonly segmentRepository: SegmentRepository,
    private readonly partRepository: PartRepository,
    private readonly timelineRepository: TimelineRepository,
    private readonly timelineBuilder: TimelineBuilder,
    private readonly eventEmitter: RundownEventEmitter,
    private readonly ingestedEntityToEntityMapper: IngestedEntityToEntityMapper,
    rundownChangeListener: DataChangedListener<IngestedRundown>,
    segmentChangedListener: DataChangedListener<IngestedSegment>,
    partChangedListener: DataChangedListener<IngestedPart>
  ) {
    this.listenForRundownChanges(rundownChangeListener)
    this.listenForSegmentChanges(segmentChangedListener)
    this.listenForPartChanges(partChangedListener)

    this.enqueueEvent(0, () => this.synchronizeEntitiesWithIngestedEntities())
  }

  private listenForRundownChanges(rundownChangeListener: DataChangedListener<IngestedRundown>): void {
    rundownChangeListener.onCreated(rundown => this.enqueueEvent(1, () => this.createRundown(rundown)))
    rundownChangeListener.onUpdated(rundown => this.enqueueEvent(6, () => this.updateRundown(rundown)))
    rundownChangeListener.onDeleted(rundownId => this.enqueueEvent(9, () => this.deleteRundown(rundownId)))
  }

  private listenForSegmentChanges(segmentChangedListener: DataChangedListener<IngestedSegment>): void {
    segmentChangedListener.onCreated(segment => this.enqueueEvent(2, () => this.createSegment(segment)))
    segmentChangedListener.onUpdated(segment => this.enqueueEvent(5, () => this.updateSegment(segment)))
    segmentChangedListener.onDeleted(segmentId => this.enqueueEvent(8, () => this.deleteSegment(segmentId)))
  }

  private listenForPartChanges(partChangedListener: DataChangedListener<IngestedPart>): void {
    partChangedListener.onCreated(part => this.enqueueEvent(3, () => this.createPart(part)))
    partChangedListener.onUpdated(part => this.enqueueEvent(4, () => this.updatePart(part)))
    partChangedListener.onDeleted(partId => this.enqueueEvent(7, () => this.deletePart(partId)))
  }

  private async synchronizeEntitiesWithIngestedEntities(): Promise<void> {
    const ingestedRundowns: IngestedRundown[] = await this.ingestedRundownRepository.getIngestedRundowns()
    await this.deleteRundownsNotPresentInIngestedRundowns(ingestedRundowns)

    await Promise.all(ingestedRundowns.map(async (ingestedRundown) => {
      const oldRundown: Rundown | undefined = await this.fetchRundown(ingestedRundown.id)

      // If the Rundown isn't active, we can simply just "re-ingest" it into our database collection as a fresh Rundown.
      const updatedRundown: Rundown = oldRundown?.isActive()
        ? this.updateActiveRundownFromIngestedRundown(ingestedRundown, oldRundown)
        : this.createNewRundownFromIngestedRundown(ingestedRundown)

      await this.rundownRepository.deleteRundown(ingestedRundown.id) // Delete the old Rundown to get rid of deleted Entities
      await this.rundownRepository.saveRundown(updatedRundown) // Save the new Rundown
      this.eventEmitter.emitRundownUpdated(updatedRundown)
    }))
  }

  private async deleteRundownsNotPresentInIngestedRundowns(ingestedRundowns: IngestedRundown[]): Promise<void> {
    const ingestedRundownsIds: string[] = ingestedRundowns.map(ingestedRundown => ingestedRundown.id)
    const basicRundowns: BasicRundown[] = await this.rundownRepository.getBasicRundowns()

    for (const basicRundown of basicRundowns) {
      if (!ingestedRundownsIds.includes(basicRundown.id)) {
        await this.rundownRepository.deleteRundown(basicRundown.id)
        this.eventEmitter.emitRundownDeleted(basicRundown.id)
      }
    }
  }

  private async fetchRundown(rundownId: string): Promise<Rundown | undefined> {
    try {
      return await this.rundownRepository.getRundown(rundownId)
    } catch (exception) {
      if (!(exception instanceof NotFoundException)) {
        throw exception
      }
      // The Rundown doesn't exist in the database which means it's a brand new Rundown.
    }
  }

  private updateActiveRundownFromIngestedRundown(ingestedRundown: IngestedRundown, rundown: Rundown): Rundown {
    const ingestedSegmentIds: string[] = ingestedRundown.ingestedSegments.map(ingestedSegment => ingestedSegment.id)
    const segmentsToBeDeleted: Segment[] = rundown.getSegments().filter(segment => !ingestedSegmentIds.includes(segment.id))
    segmentsToBeDeleted.forEach(segment => rundown.removeSegment(segment.id))

    ingestedRundown.ingestedSegments.forEach(ingestedSegment => {
      const segmentOnRundown: Segment | undefined = rundown.getSegments().find(segment => segment.id === ingestedSegment.id)
      if (!segmentOnRundown) {
        const newSegment: Segment = this.createNewSegmentFromIngestedSegment(ingestedSegment)
        rundown.addSegment(newSegment)
        return
      }

      if (!segmentOnRundown.isOnAir()) {
        const updatedSegment: Segment = this.updateSegmentFromIngestedSegment(segmentOnRundown, ingestedSegment)
        rundown.updateSegment(updatedSegment)
        return
      }

      const updateParts: Part[] = ingestedSegment.ingestedParts.map(ingestedPart => this.getUpdatedPartFromIngestedPart(segmentOnRundown, ingestedPart))

      const ingestedPartIds: string[] = ingestedSegment.ingestedParts.map(ingestedPart => ingestedPart.id)
      const onAirPartToBeDeleted: Part | undefined = segmentOnRundown.getParts().find(part => part.isOnAir() && !ingestedPartIds.includes(part.id))
      if (onAirPartToBeDeleted) {
        rundown.removePartFromSegment(onAirPartToBeDeleted.id) // Marks the Part as unsynced
        updateParts.push(onAirPartToBeDeleted) // Need to include the unsynced Part in the updated Segment
      }

      segmentOnRundown.setParts(updateParts)

      const updatedSegment: Segment = this.ingestedEntityToEntityMapper.updateSegmentWithIngestedSegment(segmentOnRundown, ingestedSegment)
      // This will put the Segment as reference in the ActiveCursor. It will also replace all the Parts with the Parts from the "old" Segment
      rundown.updateSegment(updatedSegment)
    })

    return this.ingestedEntityToEntityMapper.updateRundownFromIngestedRundown(rundown, ingestedRundown)
  }

  private createNewSegmentFromIngestedSegment(ingestedSegment: IngestedSegment): Segment {
    const newSegment: Segment = this.ingestedEntityToEntityMapper.convertIngestedSegmentToSegment(ingestedSegment)
    const parts: Part[] = ingestedSegment.ingestedParts.map(ingestedPart => this.ingestedEntityToEntityMapper.convertIngestedPartToPart(ingestedPart))
    newSegment.setParts(parts)
    return newSegment
  }

  private updateSegmentFromIngestedSegment(segmentOnRundown: Segment, ingestedSegment: IngestedSegment): Segment {
    const updatedSegment: Segment = this.ingestedEntityToEntityMapper.updateSegmentWithIngestedSegment(segmentOnRundown, ingestedSegment)
    const updateParts: Part[] = ingestedSegment.ingestedParts.map(ingestedPart => {
      const partOnSegment: Part | undefined = segmentOnRundown.getParts().find(part => part.id === ingestedPart.id)
      if (!partOnSegment) {
        return this.ingestedEntityToEntityMapper.convertIngestedPartToPart(ingestedPart)
      }
      return this.ingestedEntityToEntityMapper.updatePartWithIngestedPart(partOnSegment, ingestedPart)
    })
    updatedSegment.setParts(updateParts)
    return updatedSegment
  }

  private getUpdatedPartFromIngestedPart(segmentOnRundown: Segment, ingestedPart: IngestedPart): Part {
    const partOnSegment: Part | undefined = segmentOnRundown.getParts().find(part => part.id === ingestedPart.id)
    if (!partOnSegment) {
      return this.ingestedEntityToEntityMapper.convertIngestedPartToPart(ingestedPart)
    }

    if (partOnSegment.isOnAir()) {
      // Don't do anything. The Part is already on the Segment. If we map to a new Part, we get a new object reference and would need to update the ActiveCursor too.
      return partOnSegment
    }
    return this.ingestedEntityToEntityMapper.updatePartWithIngestedPart(partOnSegment, ingestedPart)
  }

  private createNewRundownFromIngestedRundown(ingestedRundown: IngestedRundown): Rundown {
    const segments: Segment[] = ingestedRundown.ingestedSegments.map(ingestedSegment => {
      const parts: Part[] = ingestedSegment.ingestedParts.map(ingestedPart => this.ingestedEntityToEntityMapper.convertIngestedPartToPart(ingestedPart))
      const segment: Segment = this.ingestedEntityToEntityMapper.convertIngestedSegmentToSegment(ingestedSegment)
      segment.setParts(parts)
      return segment
    })

    const newRundown: Rundown = this.ingestedEntityToEntityMapper.convertIngestedRundownToRundown(ingestedRundown) // No Segments
    segments.forEach(segment => newRundown.addSegment(segment))

    return newRundown
  }

  private enqueueEvent(priority: number, event: () => Promise<void>): void {
    this.eventPriorityQueue[priority] ??= []
    this.eventPriorityQueue[priority].push(event)
    clearTimeout(this.timerId)
    this.timerId = setTimeout(() => this.executeNextEvent(), 200)
  }

  private executeNextEvent(): void {
    if (this.isExecutingEvent) {
      return
    }
    if (Date.now() - this.lastBulkExecutionStartTimestamp >= BULK_EXECUTION_TIMESPAN_IN_MS) {
      this.lastBulkExecutionStartTimestamp = Date.now()
    }
    const eventCallback: (() => Promise<void>) | undefined = this.getEventToExecute()
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

  private getEventToExecute(): (() => Promise<void>) | undefined {
    const events: (() => Promise<void>)[] | undefined = Object.entries(this.eventPriorityQueue)
      .sort(([priorityA], [priorityB]) => Number.parseInt(priorityA) - Number.parseInt(priorityB))
      .find(([, events]) => events.length > 0)?.[1]

    return events?.shift()
  }

  private async buildRundowns(): Promise<void> {
    if (Date.now() - this.lastBulkExecutionStartTimestamp < BULK_EXECUTION_TIMESPAN_IN_MS && !this.isEventQueueEmpty()) {
      return
    }

    for (const rundownId of this.rundownIdsToBuild.values()) {
      try {
        const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
        if (!rundown.isActive()) {
          continue
        }
        await this.buildAndPersistTimeline(rundown)
        this.emitSetNextEvent(rundown)
      } catch (exception) {
        if (exception instanceof NotFoundException) {
          // The Rundown has been deleted from the database
          continue
        }
        console.log('Error when trying to build Rundowns for bulk', exception)
      }
    }
    this.rundownIdsToBuild.clear()
  }

  private isEventQueueEmpty(): boolean {
    return Object.values(this.eventPriorityQueue).flat().length === 0
  }

  private async buildAndPersistTimeline(rundown: Rundown): Promise<void> {
    const timeline: Timeline = await this.timelineBuilder.buildTimeline(rundown)
    await this.timelineRepository.saveTimeline(timeline)
  }

  private emitSetNextEvent(rundown: Rundown): void {
    this.eventEmitter.emitSetNextEvent(rundown)
  }

  private async createRundown(ingestedRundown: IngestedRundown): Promise<void> {
    const rundown: Rundown = this.ingestedEntityToEntityMapper.convertIngestedRundownToRundown(ingestedRundown)
    this.eventEmitter.emitRundownCreated(rundown)
    await this.persistRundown(rundown)
  }

  private async updateRundown(ingestedRundown: IngestedRundown): Promise<void> {
    const rundownToBeUpdated: Rundown = await this.rundownRepository.getRundown(ingestedRundown.id)
    const updatedRundown: Rundown = this.ingestedEntityToEntityMapper.updateRundownFromIngestedRundown(rundownToBeUpdated, ingestedRundown)

    this.eventEmitter.emitRundownUpdated(updatedRundown)
    await this.persistRundown(updatedRundown)
  }

  private async deleteRundown(rundownId: string): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    this.eventEmitter.emitRundownDeleted(rundown.id)
    await this.rundownRepository.deleteRundown(rundown.id)
  }

  private async createSegment(ingestedSegment: IngestedSegment): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(ingestedSegment.rundownId)
    const segment: Segment = this.ingestedEntityToEntityMapper.convertIngestedSegmentToSegment(ingestedSegment)

    rundown.addSegment(segment)

    this.eventEmitter.emitSegmentCreated(rundown, segment)
    await this.persistRundown(rundown)
  }

  private async persistRundown(rundown: Rundown): Promise<void> {
    this.rundownIdsToBuild.add(rundown.id)
    await this.rundownRepository.saveRundown(rundown)
  }

  private async updateSegment(ingestedSegment: IngestedSegment): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(ingestedSegment.rundownId)
    const segmentToBeUpdated: Segment = await this.segmentRepository.getSegment(ingestedSegment.id)

    const updatedSegment: Segment = this.ingestedEntityToEntityMapper.updateSegmentWithIngestedSegment(segmentToBeUpdated, ingestedSegment)
    rundown.updateSegment(updatedSegment)

    this.eventEmitter.emitSegmentUpdated(rundown, updatedSegment)
    await this.persistRundown(rundown)
  }

  private async deleteSegment(segmentId: string): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundownBySegmentId(segmentId)

    const removedSegment: Segment | undefined = rundown.removeSegment(segmentId)
    if (removedSegment) {
      if (!removedSegment.isUnsynced()) {
        this.eventEmitter.emitSegmentDeleted(rundown, removedSegment.id)
      } else {
        this.eventEmitter.emitSegmentUnsynced(rundown, removedSegment, segmentId)
      }
      await this.segmentRepository.delete(removedSegment.id)
    }
    await this.persistRundown(rundown)
  }

  private async createPart(ingestedPart: IngestedPart): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(ingestedPart.rundownId)
    const part: Part = this.ingestedEntityToEntityMapper.convertIngestedPartToPart(ingestedPart)

    rundown.addPart(part)

    this.eventEmitter.emitPartCreated(rundown, part)
    await this.persistRundown(rundown)
  }

  private async updatePart(ingestedPart: IngestedPart): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(ingestedPart.rundownId)
    const partToBeUpdated: Part = await this.partRepository.getPart(ingestedPart.id)

    const updatedPart: Part = this.ingestedEntityToEntityMapper.updatePartWithIngestedPart(partToBeUpdated, ingestedPart)
    rundown.updatePart(updatedPart)

    this.eventEmitter.emitPartUpdated(rundown, updatedPart)
    await this.persistRundown(rundown)
  }

  private async deletePart(partId: string): Promise<void> {
    const partFromDatabase: Part = await this.partRepository.getPart(partId)
    const rundown: Rundown = await this.rundownRepository.getRundown(partFromDatabase.rundownId)

    const removedPart: Part | undefined = rundown.removePartFromSegment(partId)
    if (removedPart) {
      if (!removedPart.isUnsynced()) {
        this.eventEmitter.emitPartDeleted(rundown, removedPart.getSegmentId(), removedPart.id)
      } else {
        this.eventEmitter.emitPartUnsynced(rundown, removedPart)
      }
      await this.partRepository.delete(removedPart.id)
    }
    await this.persistRundown(rundown)
  }
}
