import { DataChangeService } from './interfaces/data-change-service'
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
import { Logger } from '../../logger/logger'
import { PieceRepository } from '../../data-access/repositories/interfaces/piece-repository'
import { ActionManifestRepository } from '../../data-access/repositories/interfaces/action-manifest-repository'
import { ConfigurationRepository } from '../../data-access/repositories/interfaces/configuration-repository'
import { Configuration } from '../../model/entities/configuration'
import { Action, ActionManifest } from '../../model/entities/action'
import { ActionRepository } from '../../data-access/repositories/interfaces/action-repository'
import { Blueprint } from '../../model/value-objects/blueprint'
import { ActionEventEmitter } from './interfaces/action-event-emitter'

const BULK_EXECUTION_TIMESPAN_IN_MS: number = 500

const enum IngestEventPriority {
  RUNDOWN_CREATE = 1,
  SEGMENT_CREATE = 2,
  PART_CREATE = 3,

  PART_UPDATE = 4,
  SEGMENT_UPDATE = 5,
  RUNDOWN_UPDATE = 6,

  PART_DELETE = 7,
  SEGMENT_DELETE = 8,
  RUNDOWN_DELETE = 9
}

export class IngestDataChangedService implements DataChangeService {

  private static instance: DataChangeService

  public static getInstance(
    ingestedRundownRepository: IngestedRundownRepository,
    rundownRepository: RundownRepository,
    segmentRepository: SegmentRepository,
    partRepository: PartRepository,
    pieceRepository: PieceRepository,
    timelineRepository: TimelineRepository,
    actionManifestRepository: ActionManifestRepository,
    actionRepository: ActionRepository,
    configurationRepository: ConfigurationRepository,
    blueprint: Blueprint,
    timelineBuilder: TimelineBuilder,
    rundownEventEmitter: RundownEventEmitter,
    actionEventEmitter: ActionEventEmitter,
    ingestedEntityToEntityMapper: IngestedEntityToEntityMapper,
    logger: Logger,
    rundownChangeListener: DataChangedListener<IngestedRundown>,
    segmentChangedListener: DataChangedListener<IngestedSegment>,
    partChangedListener: DataChangedListener<IngestedPart>,
  ): DataChangeService {
    if (!this.instance) {
      this.instance = new IngestDataChangedService(
        ingestedRundownRepository,
        rundownRepository,
        segmentRepository,
        partRepository,
        pieceRepository,
        timelineRepository,
        actionManifestRepository,
        actionRepository,
        configurationRepository,
        blueprint,
        timelineBuilder,
        rundownEventEmitter,
        actionEventEmitter,
        ingestedEntityToEntityMapper,
        logger,
        rundownChangeListener,
        segmentChangedListener,
        partChangedListener,
      )
    }
    return this.instance
  }

  private isInitialized: boolean = false

  // Event Queue Priority: The lower the number, the higher the priority
  private readonly eventPriorityQueue: Record<number, (() => Promise<void>)[]> = { }
  private readonly logger: Logger
  private isExecutingEvent: boolean = false
  private lastBulkExecutionStartTimestamp: number = 0
  private readonly rundownIdsToBuildFor: Set<string> = new Set()
  private readonly rundownIdsToGenerateActionsFor: Set<string> = new Set()

  private timerId: NodeJS.Timeout | undefined

  private constructor(
    private readonly ingestedRundownRepository: IngestedRundownRepository,
    private readonly rundownRepository: RundownRepository,
    private readonly segmentRepository: SegmentRepository,
    private readonly partRepository: PartRepository,
    private readonly pieceRepository: PieceRepository,
    private readonly timelineRepository: TimelineRepository,
    private readonly actionManifestRepository: ActionManifestRepository,
    private readonly actionRepository: ActionRepository,
    private readonly configurationRepository: ConfigurationRepository,
    private readonly blueprint: Blueprint,
    private readonly timelineBuilder: TimelineBuilder,
    private readonly eventEmitter: RundownEventEmitter,
    private readonly actionEventEmitter: ActionEventEmitter,
    private readonly ingestedEntityToEntityMapper: IngestedEntityToEntityMapper,
    logger: Logger,
    rundownChangeListener: DataChangedListener<IngestedRundown>,
    segmentChangedListener: DataChangedListener<IngestedSegment>,
    partChangedListener: DataChangedListener<IngestedPart>,
  ) {
    this.logger = logger.tag(IngestDataChangedService.name)

    this.listenForRundownChanges(rundownChangeListener)
    this.listenForSegmentChanges(segmentChangedListener)
    this.listenForPartChanges(partChangedListener)
  }

  private listenForRundownChanges(rundownChangeListener: DataChangedListener<IngestedRundown>): void {
    rundownChangeListener.onCreated(rundown => this.enqueueEvent(IngestEventPriority.RUNDOWN_CREATE, () => this.createRundown(rundown)))
    rundownChangeListener.onUpdated(rundown => this.enqueueEvent(IngestEventPriority.RUNDOWN_UPDATE, () => this.updateRundown(rundown)))
    rundownChangeListener.onDeleted(rundownId => this.enqueueEvent(IngestEventPriority.RUNDOWN_DELETE, () => this.deleteRundown(rundownId)))
  }

  private listenForSegmentChanges(segmentChangedListener: DataChangedListener<IngestedSegment>): void {
    segmentChangedListener.onCreated(segment => this.enqueueEvent(IngestEventPriority.SEGMENT_CREATE, () => this.createSegment(segment)))
    segmentChangedListener.onUpdated(segment => this.enqueueEvent(IngestEventPriority.SEGMENT_UPDATE, () => this.updateSegment(segment)))
    segmentChangedListener.onDeleted(segmentId => this.enqueueEvent(IngestEventPriority.SEGMENT_DELETE, () => this.deleteSegment(segmentId)))
  }

  private listenForPartChanges(partChangedListener: DataChangedListener<IngestedPart>): void {
    partChangedListener.onCreated(part => this.enqueueEvent(IngestEventPriority.PART_CREATE, () => this.createPart(part)))
    partChangedListener.onUpdated(part => this.enqueueEvent(IngestEventPriority.PART_UPDATE, () => this.updatePart(part)))
    partChangedListener.onDeleted(partId => this.enqueueEvent(IngestEventPriority.PART_DELETE, () => this.deletePart(partId)))
  }

  public async initialize(): Promise<void> {
    await this.synchronizeEntitiesWithIngestedEntities()
    this.isInitialized = true
  }

  private async synchronizeEntitiesWithIngestedEntities(): Promise<void> {
    const ingestedRundowns: IngestedRundown[] = await this.ingestedRundownRepository.getIngestedRundowns()
    await this.deleteRundownsNotPresentInIngestedRundowns(ingestedRundowns)

    await Promise.all(ingestedRundowns.map(async (ingestedRundown) => {
      const oldRundown: Rundown | undefined = await this.loadRundown(ingestedRundown.id)

      // If the Rundown isn't active or in rehearsal, we can simply just "re-ingest" it into our database collection as a fresh Rundown.
      const updatedRundown: Rundown = oldRundown?.isActive() || oldRundown?.isRehearsal()
        ? this.updateActiveRundownFromIngestedRundown(ingestedRundown, oldRundown)
        : this.createNewRundownFromIngestedRundown(ingestedRundown)

      await this.rundownRepository.deleteRundown(ingestedRundown.id) // Delete the old Rundown to get rid of deleted Entities
      await this.rundownRepository.saveRundown(updatedRundown) // Save the new Rundown
      this.eventEmitter.emitRundownUpdated(updatedRundown)
      this.rundownIdsToGenerateActionsFor.add(updatedRundown.id)
      await this.generateActions()
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

  private async loadRundown(rundownId: string): Promise<Rundown | undefined> {
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

      const updatedParts: Part[] = ingestedSegment.ingestedParts.map(ingestedPart => this.getUpdatedPartFromIngestedPart(segmentOnRundown, ingestedPart))

      const ingestedPartIds: string[] = ingestedSegment.ingestedParts.map(ingestedPart => ingestedPart.id)
      const onAirPartToBeDeleted: Part | undefined = segmentOnRundown.getParts().find(part => part.isOnAir() && !ingestedPartIds.includes(part.id))
      if (onAirPartToBeDeleted) {
        rundown.removePartFromSegment(onAirPartToBeDeleted.id) // Marks the Part as unsynced
        updatedParts.push(onAirPartToBeDeleted) // Need to include the unsynced Part in the updated Segment
      }

      segmentOnRundown.setParts(updatedParts)

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
    if (!this.isInitialized) {
      return
    }

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
      this.generateActions().catch(error => this.logger.data(error).error('Failed generating actions for ingest batch.'))
      return
    }

    this.isExecutingEvent = true
    eventCallback()
      .catch(error => this.logger.data(error).error('Error when executing Ingest event:'))
      .then(() => this.buildRundowns())
      .catch(error => this.logger.data(error).error('Failed building rundowns.'))
      .finally(() => {
        this.isExecutingEvent = false
        this.executeNextEvent()
      })
  }

  private getEventToExecute(): (() => Promise<void>) | undefined {
    const events: (() => Promise<void>)[] | undefined = Object.entries(this.eventPriorityQueue)
      .sort(([priorityA], [priorityB]) => Number.parseInt(priorityA) - Number.parseInt(priorityB))
      .find(([, events]) => events.length > 0)?.[1]

    return events?.shift()
  }

  private async generateActions(): Promise<void> {
    await Promise.all(
      [...this.rundownIdsToGenerateActionsFor].map(async (rundownId) => {
        await this.generateActionsForRundown(rundownId)
        this.rundownIdsToGenerateActionsFor.delete(rundownId)
      })
    )
    await this.generateActionsForSystem()
  }

  private async generateActionsForRundown(rundownId: string): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    const configuration: Configuration = await this.configurationRepository.getConfiguration()
    const actionManifests: ActionManifest[] = await this.actionManifestRepository.getActionManifests(rundownId)
    const actions: Action[] = this.blueprint.generateActions(configuration, rundown.getShowStyleVariantId(), actionManifests)
    this.actionEventEmitter.emitActionsUpdatedEvent(actions, rundownId)

    await this.actionRepository.deleteActionsForRundown(rundownId)
    await this.actionRepository.saveActions(actions)
  }

  private async generateActionsForSystem(): Promise<void> {
    const nonExistingShowStyleVariantId: string = 'nonExistingShowStyleVariantId'
    const configuration: Configuration = await this.configurationRepository.getConfiguration()
    const actions: Action[] = this.blueprint.generateActions(configuration, nonExistingShowStyleVariantId, [])
    this.actionEventEmitter.emitActionsUpdatedEvent(actions)

    await this.actionRepository.deleteActionsNotOnRundowns()
    await this.actionRepository.saveActions(actions)
  }

  private async buildRundowns(): Promise<void> {
    if (Date.now() - this.lastBulkExecutionStartTimestamp < BULK_EXECUTION_TIMESPAN_IN_MS && !this.isEventQueueEmpty()) {
      return
    }

    for (const rundownId of this.rundownIdsToBuildFor.values()) {
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
        this.logger.data(exception).error('Error when trying to build Rundowns for bulk')
      }
    }
    this.rundownIdsToBuildFor.clear()
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

  private async persistRundown(rundown: Rundown): Promise<void> {
    this.rundownIdsToBuildFor.add(rundown.id)
    this.rundownIdsToGenerateActionsFor.add(rundown.id)
    await this.rundownRepository.saveRundown(rundown)
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

  private async updateSegment(ingestedSegment: IngestedSegment): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(ingestedSegment.rundownId)
    const segmentToBeUpdated: Segment | undefined = await this.fetchSegmentIfExist(ingestedSegment.id)

    if (!segmentToBeUpdated) {
      this.logger.warn(`IngestUpdateSegment: No Segment found for Segment id: ${ingestedSegment.id} - creating new Segment instead`)
      await this.createSegment(ingestedSegment)
      return
    }

    const pieceIdsBeforeUpdate: string[] = segmentToBeUpdated.getParts().flatMap(part => part.getPieces()).map(piece => piece.id)

    const updatedSegment: Segment = this.ingestedEntityToEntityMapper.updateSegmentWithIngestedSegment(segmentToBeUpdated, ingestedSegment)
    rundown.updateSegment(updatedSegment)

    this.eventEmitter.emitSegmentUpdated(rundown, updatedSegment)

    const pieceIdsAfterUpdate: string[] = updatedSegment.getParts().flatMap(part => part.getPieces()).map(piece => piece.id)
    const pieceIdsToBeDelete: string[] = pieceIdsBeforeUpdate.filter(pieceId => !pieceIdsAfterUpdate.includes(pieceId))
    await this.pieceRepository.deletePieces(pieceIdsToBeDelete)

    await this.persistRundown(rundown)
  }

  private async fetchSegmentIfExist(segmentId: string): Promise<Segment | undefined> {
    try {
      return this.segmentRepository.getSegment(segmentId)
    } catch (error) {
      return Promise.resolve(undefined)
    }
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
    const partToBeUpdated: Part | undefined = await this.fetchPartIfExist(ingestedPart.id)

    if (!partToBeUpdated) {
      this.logger.warn(`IngestUpdatePart: No Part found for Part id: ${ingestedPart.id} - creating new Part instead`)
      await this.createPart(ingestedPart)
      return
    }

    const updatedPart: Part = this.ingestedEntityToEntityMapper.updatePartWithIngestedPart(partToBeUpdated, ingestedPart)
    rundown.updatePart(updatedPart)

    this.eventEmitter.emitPartUpdated(rundown, updatedPart)
    await this.persistRundown(rundown)
  }

  private async fetchPartIfExist(partId: string): Promise<Part | undefined> {
    try {
      return this.partRepository.getPart(partId)
    } catch (error) {
      return Promise.resolve(undefined)
    }
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
