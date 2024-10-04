import { DataChangeService } from './interfaces/data-change-service'
import { IngestedRundownRepository } from '../../data-access/repositories/interfaces/ingested-rundown-repository'
import { RundownRepository } from '../../data-access/repositories/interfaces/rundown-repository'
import { SegmentRepository } from '../../data-access/repositories/interfaces/segment-repository'
import { PartRepository } from '../../data-access/repositories/interfaces/part-repository'
import { PieceRepository } from '../../data-access/repositories/interfaces/piece-repository'
import { TimelineRepository } from '../../data-access/repositories/interfaces/timeline-repository'
import { ActionManifestRepository } from '../../data-access/repositories/interfaces/action-manifest-repository'
import { ActionRepository } from '../../data-access/repositories/interfaces/action-repository'
import { ConfigurationRepository } from '../../data-access/repositories/interfaces/configuration-repository'
import { Blueprint } from '../../model/value-objects/blueprint'
import { TimelineBuilder } from './interfaces/timeline-builder'
import { RundownEventEmitter } from './interfaces/rundown-event-emitter'
import { ActionEventEmitter } from './interfaces/action-event-emitter'
import { IngestedEntityToEntityMapper } from './ingested-entity-to-entity-mapper'
import { Logger } from '../../logger/logger'
import { DataChangedListener } from '../../data-access/repositories/interfaces/data-changed-listener'
import { IngestedRundown } from '../../model/entities/ingested-rundown'
import { IngestedSegment } from '../../model/entities/ingested-segment'
import { IngestedPart } from '../../model/entities/ingested-part'
import { Rundown } from '../../model/entities/rundown'
import { NotFoundException } from '../../model/exceptions/not-found-exception'
import { RundownMode } from '../../model/enums/rundown-mode'
import { RundownTimingType } from '../../model/enums/rundown-timing-type'
import { Segment } from '../../model/entities/segment'
import { Part } from '../../model/entities/part'
import { Configuration } from '../../model/entities/configuration'
import { Action, ActionManifest } from '../../model/entities/action'

type DataChangeEvent =
  | CreateEvent<'rundown', IngestedRundown>
  | CreateEvent<'segment', IngestedSegment>
  | CreateEvent<'part', IngestedPart>
  | UpdateEvent<'rundown', IngestedRundown>
  | UpdateEvent<'segment', IngestedSegment>
  | UpdateEvent<'part', IngestedPart>
  | DeleteEvent<'rundown'>
  | DeleteEvent<'segment'>
  | DeleteEvent<'part'>

type EntityType = 'rundown' |'segment' | 'part'
type Entity = IngestedRundown | IngestedSegment | IngestedPart

interface CreateEvent<EntityTypeVariant extends EntityType, EntityVariant extends Entity> {
  eventType: 'insert'
  entityType: EntityTypeVariant
  entity: EntityVariant
}

interface UpdateEvent<EntityTypeVariant extends EntityType, Entity> {
  eventType: 'update'
  entityType: EntityTypeVariant
  entity: Entity
}

interface DeleteEvent<EntityTypeVariant extends EntityType> {
  eventType: 'delete'
  entityType: EntityTypeVariant
  entityId: string
}

interface DataChangeEventContext {
  rundown: Rundown | undefined
  dataChangedEvents: object[]
  deletedEntities: { entityType: EntityType, entityId: string, isUnsynced: boolean }[]
}

export class ImprovedIngestDataChangedService implements DataChangeService {

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
      this.instance = new ImprovedIngestDataChangedService(
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

  private dataChangeEventQueue: DataChangeEvent[] = []
  private dataChangeEventDebounceTimerId?: NodeJS.Timeout
  private isExecutingEvents: boolean = false
  private readonly logger: Logger

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
    this.logger = logger.tag(this.constructor.name)

    this.listenForRundownChanges(rundownChangeListener)
    this.listenForSegmentChanges(segmentChangedListener)
    this.listenForPartChanges(partChangedListener)
  }

  private listenForRundownChanges(rundownChangeListener: DataChangedListener<IngestedRundown>): void {
    rundownChangeListener.onCreated(ingestedRundown => {
      this.logger.debug(`Create rundown event for ${ingestedRundown.name} with id ${ingestedRundown.id}.`)
      this.enqueueDataChangeEvent({
        eventType: 'insert',
        entityType: 'rundown',
        entity: ingestedRundown,
      })
    })
    rundownChangeListener.onUpdated(ingestedRundown => {
      this.logger.debug(`Update rundown event for ${ingestedRundown.name} with id ${ingestedRundown.id}.`)
      this.enqueueDataChangeEvent({
        eventType: 'update',
        entityType: 'rundown',
        entity: ingestedRundown,
      })
    })
    rundownChangeListener.onDeleted(rundownId => {
      this.logger.debug(`Delete rundown event for ${rundownId}.`)
      this.enqueueDataChangeEvent({
        eventType: 'delete',
        entityType: 'rundown',
        entityId: rundownId,
      })
    })
  }

  private enqueueDataChangeEvent(dataChangeEvent: DataChangeEvent): void {
    this.dataChangeEventQueue.push(dataChangeEvent)
    clearTimeout(this.dataChangeEventDebounceTimerId)
    this.dataChangeEventDebounceTimerId = setTimeout(() => {
      this.executeDataChangeEvents().catch(error => this.logger.data(error).error('Failed executing data change events.'))
    }, 200)
  }

  private async executeDataChangeEvents(): Promise<void> {
    const startTime = process.hrtime.bigint()
    this.logger.trace('EXECUTING SOMETHING: ' + this.isExecutingEvents)
    if (this.isExecutingEvents) {
      return
    }
    this.isExecutingEvents = true

    const dataChangeEvents: DataChangeEvent[] = this.dataChangeEventQueue
    this.dataChangeEventQueue = []

    try {
      const dataChangeEventsGroupedByRundown: Record<string, DataChangeEvent[]> = await this.groupDataChangeEventsByRundown(dataChangeEvents)
      const entries = Object.entries(dataChangeEventsGroupedByRundown)
      for (const [rundownId, queue] of entries) {
        try {
          // TODO: Make the contents of the loop (and outer try catch) a recursive call with setImmediate to make it more responsive.
          // TODO: Allow rundown to be undefined (from a delete rundown event)
          // TODO: Deleted entities needs to be matched against the other dataChangedEvents and removed if they were recreated.
          const { rundown, dataChangedEvents, deletedEntities} = await this.reduceRundownWithDataChangeEvents(rundownId, queue)
          if (!rundown) {
            await this.rundownRepository.deleteRundown(rundownId)
            await this.actionRepository.deleteActionsForRundown(rundownId) // TODO: Check if this can remove actions which have same content in multiple rundowns.
            continue
          }
          await this.rundownRepository.saveRundown(rundown)
          for (const deletedEntity of deletedEntities) {
            switch (deletedEntity.entityType)  {
              case 'segment':
                await this.segmentRepository.delete(deletedEntity.entityId)
                break
              case 'part':
                await this.partRepository.delete(deletedEntity.entityId)
                break
            }
          }
          dataChangedEvents.forEach(dataChangedEvent => this.emitDataChangedEvent(dataChangedEvent))
          await this.generateActionsForRundown(rundownId)
          if (rundown.isActive()) {
            await this.timelineBuilder.buildTimeline(rundown)
            this.eventEmitter.emitSetNextEvent(rundown)
            // TODO: Emit set next event if necessary
          }
        } catch (error) {
          this.logger.data(error).error('Failed updating rundown.')
        }
      }
      // TODO: Generate system actions
    } catch(error) {
      this.logger.data(error).error('Failed grouping events by rundown.')
    } finally {
      this.isExecutingEvents = false
      this.logger.trace(`Executing ${dataChangeEvents.length} events took ms:` + ((Number(process.hrtime.bigint() - startTime) / 1_000_000)) )
      // TODO: Start new timer if not set.
    }
  }

  private async groupDataChangeEventsByRundown(dataChangeEvents: DataChangeEvent[], groupedDataChangeEvents: Record<string, DataChangeEvent[]> = {}): Promise<Record<string, DataChangeEvent[]>> {
    if (dataChangeEvents.length === 0) {
      return groupedDataChangeEvents
    }

    const [dataChangeEvent, ...remainingDataChangeEvents]: DataChangeEvent[] = dataChangeEvents
    try {
      const rundownId: string = await this.getRundownIdFromDataChangeEvent(dataChangeEvent)
      const rundownQueue: DataChangeEvent[] = groupedDataChangeEvents[rundownId] ?? []
      rundownQueue.push(dataChangeEvent)
      return this.groupDataChangeEventsByRundown(remainingDataChangeEvents, {
        ...groupedDataChangeEvents,
        [rundownId]: rundownQueue
      })
    } catch (error) {
      this.logger.data(error).error('Failed grouping something in rundown.')
      return this.groupDataChangeEventsByRundown(remainingDataChangeEvents, groupedDataChangeEvents)
    }
  }

  private async getRundownIdFromDataChangeEvent(dataChangeEvent: DataChangeEvent): Promise<string> {
    switch (dataChangeEvent.eventType) {
      case 'insert':
      case 'update': {
        switch (dataChangeEvent.entityType) {
          case 'rundown':
            return dataChangeEvent.entity.id
          case 'segment':
          case 'part':
            return dataChangeEvent.entity.rundownId
        }
        break
      }
      case 'delete':
        switch (dataChangeEvent.entityType) {
          case 'rundown':
            return dataChangeEvent.entityId
          case 'segment': {
            const segment: Segment = await this.segmentRepository.getSegment(dataChangeEvent.entityId)
            return segment.rundownId
          }
          case 'part': {
            const part: Part = await this.partRepository.getPart(dataChangeEvent.entityId)
            return part.rundownId
          }
        }
    }
  }

  private async reduceRundownWithDataChangeEvents(rundownId: string, events: DataChangeEvent[]): Promise<DataChangeEventContext> {
    return events.reduce<DataChangeEventContext>(({ rundown, dataChangedEvents, deletedEntities }, event: DataChangeEvent) => {
      try {
        const result = this.executeDataChangeEvent(rundown, event)
        return {
          rundown: result.rundown,
          dataChangedEvents: [...dataChangedEvents, ...(result.dataChangedEvents)],
          deletedEntities: [...deletedEntities, ...(result.deletedEntities)],
        }
      } catch (error) {
        if (event.eventType === 'delete' && error instanceof NotFoundException) {
          return {
            rundown,
            dataChangedEvents,
            deletedEntities,
          }
        }
        throw error
      }
    },{
      rundown: await this.getRundown(rundownId),
      dataChangedEvents: [],
      deletedEntities: [],
    })
  }

  private executeDataChangeEvent(rundown: Rundown | undefined, event: DataChangeEvent): DataChangeEventContext {
    switch (event.eventType) {
      case 'insert':
        return this.executeCreateEvent(rundown, event)
      case 'update':
        return this.executeUpdateEvent(rundown, event)
      case 'delete':
        return this.executeDeleteEvent(rundown, event)
    }
  }

  private executeCreateEvent(maybeRundown: Rundown | undefined, event: CreateEvent<EntityType, Entity> & DataChangeEvent): DataChangeEventContext {
    switch (event.entityType) {
      case 'rundown': {
        return {
          rundown: maybeRundown ? this.ingestedEntityToEntityMapper.updateRundownFromIngestedRundown(maybeRundown, event.entity) : this.ingestedEntityToEntityMapper.convertIngestedRundownToRundown(event.entity),
          dataChangedEvents: [], // TODO: Add rundown created event
          deletedEntities: [],
        }
      }
      case 'segment': {
        const rundown: Rundown = maybeRundown ?? this.createTemporaryRundown(event.entity.rundownId)
        const segment: Segment | undefined = rundown.getSegments().find(segment => segment.id === event.entity.id)
        const updatedSegment: Segment = segment ? this.ingestedEntityToEntityMapper.updateSegmentWithIngestedSegment(segment, event.entity) : this.ingestedEntityToEntityMapper.convertIngestedSegmentToSegment(event.entity)
        if (segment) {
          rundown.updateSegment(updatedSegment)
        } else {
          rundown.addSegment(updatedSegment)
        }
        return {
          rundown: rundown,
          dataChangedEvents: [],  // TODO: Add segment created event
          deletedEntities: [],
        }
      }
      case 'part': {
        const rundown: Rundown = maybeRundown ?? this.createTemporaryRundown(event.entity.rundownId)
        let segment: Segment | undefined = rundown.getSegments().find(segment => segment.id === event.entity.segmentId)
        if (!segment) {
          segment = this.createTemporarySegment(event.entity.segmentId, event.entity.rundownId)
          rundown.addSegment(segment)
        }
        const part: Part | undefined = segment.getParts().find(part => part.id === event.entity.id)
        const updatedPart: Part = part ? this.ingestedEntityToEntityMapper.updatePartWithIngestedPart(part, event.entity) : this.ingestedEntityToEntityMapper.convertIngestedPartToPart(event.entity)
        if (part) {
          segment.updatePart(updatedPart)
        } else {
          segment.addPart(updatedPart)
        }
        return {
          rundown: rundown,
          dataChangedEvents: [], // TODO: Add part created event
          deletedEntities: [],
        }
        // TODO: Assert all cases
      }
    }
  }

  private executeUpdateEvent(maybeRundown: Rundown | undefined, event: UpdateEvent<EntityType, Entity> & DataChangeEvent): DataChangeEventContext {
    switch (event.entityType) {
      case 'rundown': {
        return {
          rundown: maybeRundown ? this.ingestedEntityToEntityMapper.updateRundownFromIngestedRundown(maybeRundown, event.entity) : this.ingestedEntityToEntityMapper.convertIngestedRundownToRundown(event.entity),
          dataChangedEvents: [], // TODO: Add rundown updated event
          deletedEntities: [],
        }
      }
      case 'segment': {
        const rundown: Rundown = maybeRundown ?? this.createTemporaryRundown(event.entity.rundownId)
        const segment: Segment | undefined = rundown.getSegments().find(segment => segment.id === event.entity.id)
        const updatedSegment: Segment = segment ? this.ingestedEntityToEntityMapper.updateSegmentWithIngestedSegment(segment, event.entity) : this.ingestedEntityToEntityMapper.convertIngestedSegmentToSegment(event.entity)
        if (segment) {
          rundown.updateSegment(updatedSegment)
        } else {
          rundown.addSegment(updatedSegment)
        }
        return {
          rundown: rundown,
          dataChangedEvents: [],  // TODO: Add segment updated event
          deletedEntities: [],
        }
      }
      case 'part': {
        const rundown: Rundown = maybeRundown ?? this.createTemporaryRundown(event.entity.rundownId)
        let segment: Segment | undefined = rundown.getSegments().find(segment => segment.id === event.entity.segmentId)
        if (!segment) {
          segment = this.createTemporarySegment(event.entity.segmentId, event.entity.rundownId)
          rundown.addSegment(segment)
        }
        const part: Part | undefined = segment.getParts().find(part => part.id === event.entity.id)
        const updatedPart: Part = part ? this.ingestedEntityToEntityMapper.updatePartWithIngestedPart(part, event.entity) : this.ingestedEntityToEntityMapper.convertIngestedPartToPart(event.entity)
        if (part) {
          segment.updatePart(updatedPart)
        } else {
          segment.addPart(updatedPart)
        }
        return {
          rundown: rundown,
          dataChangedEvents: [], // TODO: Add part updated event
          deletedEntities: [],
        }
        // TODO: Assert all cases
      }
    }
  }

  private executeDeleteEvent(rundown: Rundown | undefined, event: DeleteEvent<EntityType> & DataChangeEvent): DataChangeEventContext {
    if (!rundown) {
      return {
        rundown: rundown,
        dataChangedEvents: [],
        deletedEntities: []
      }
    }

    switch (event.entityType) {
      case 'rundown': {
        return {
          rundown: rundown, // TODO: Implement
          dataChangedEvents: [], // TODO: Add rundown delete event
          deletedEntities: [],
        }
      }
      case 'segment': {
        const removedSegment: Segment | undefined = rundown.removeSegment(event.entityId)
        return {
          rundown: rundown,
          dataChangedEvents: [], // TODO: Add segment deleted event
          deletedEntities: removedSegment ? [{ entityType: 'segment', entityId: removedSegment.id, isUnsynced: removedSegment.isUnsynced() }] : [],
        }
      }
      case 'part': {
        const removedPart: Part | undefined = rundown.removePartFromSegment(event.entityId)
        return {
          rundown: rundown,
          dataChangedEvents: [], // TODO: Add part deleted event
          deletedEntities: removedPart ? [{ entityType: 'part', entityId: removedPart.id, isUnsynced: removedPart.isUnsynced() }] : [],
        }
        // TODO: Assert all cases
      }
    }
  }

  private createTemporaryRundown(rundownId: string): Rundown {
    return new Rundown({
      baselineTimelineObjects: [],
      history: [],
      id: rundownId,
      mode: RundownMode.INACTIVE,
      modifiedAt: Date.now(),
      name: 'Dummy rundown',
      segments: [],
      showStyleVariantId: '',
      timing: {
        type: RundownTimingType.UNSCHEDULED,
        expectedDurationInMs : 0
      }
    })
  }

  private createTemporarySegment(segmentId: string, rundownId: string): Segment {
    return new Segment({
      id: segmentId,
      rundownId: rundownId,
      name: '',
      definesShowStyleVariant: false,
      isHidden: false,
      isNext: false,
      isOnAir: false,
      isUnsynced: false,
      parts: [],
      rank: 0,
    })
  }

  private async createSegment(ingestedSegment: IngestedSegment): Promise<void> {
    const rundown: Rundown = await this.getRundown(ingestedSegment.rundownId)
    const segment: Segment = this.ingestedEntityToEntityMapper.convertIngestedSegmentToSegment(ingestedSegment)

    rundown.addSegment(segment)

    this.eventEmitter.emitSegmentCreated(rundown, segment)
    await this.rundownRepository.saveRundown(rundown)
  }

  private emitDataChangedEvent(dataChangedEvent: object): void {
    // TODO: Big-ass switch case
    this.eventEmitter
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

  private async updateRundown(ingestedRundown: IngestedRundown): Promise<void> {
    const rundown: Rundown = await this.getRundown(ingestedRundown.id)
    const updatedRundown: Rundown = this.ingestedEntityToEntityMapper.updateRundownFromIngestedRundown(rundown, ingestedRundown)

    this.eventEmitter.emitRundownUpdated(updatedRundown)
    await this.rundownRepository.saveRundown(updatedRundown)
  }

  private async getRundown(rundownId: string): Promise<Rundown> {
    try {
      return await this.rundownRepository.getRundown(rundownId)
    } catch (error) {
      if (error instanceof NotFoundException) {
        return new Rundown({
          baselineTimelineObjects: [],
          history: [],
          id: rundownId,
          mode: RundownMode.INACTIVE,
          modifiedAt: Date.now(),
          name: 'Dummy rundown',
          segments: [],
          showStyleVariantId: '',
          timing: {
            type: RundownTimingType.UNSCHEDULED,
            expectedDurationInMs : 0
          }
        })
      }
      throw error
    }
  }

  private listenForSegmentChanges(segmentChangedListener: DataChangedListener<IngestedSegment>): void {
    segmentChangedListener.onCreated(ingestedSegment => {
      this.logger.debug(`Create segment event for ${ingestedSegment.name} with id ${ingestedSegment.id}.`)
      this.enqueueDataChangeEvent({
        eventType: 'insert',
        entityType: 'segment',
        entity: ingestedSegment,
      })
    })
    segmentChangedListener.onUpdated(ingestedSegment => {
      this.logger.debug(`Update segment event for ${ingestedSegment.name} with id ${ingestedSegment.id}.`)
      this.enqueueDataChangeEvent({
        eventType: 'update',
        entityType: 'segment',
        entity: ingestedSegment,
      })
    })
    segmentChangedListener.onDeleted(segmentId => {
      this.logger.debug(`Delete segment event for ${segmentId}.`)
      this.enqueueDataChangeEvent({
        eventType: 'delete',
        entityType: 'segment',
        entityId: segmentId,
      })
    })
  }

  private async updateSegment(ingestedSegment: IngestedSegment): Promise<void> {
    const rundown: Rundown = await this.getRundown(ingestedSegment.rundownId)
    const segment: Segment = await this.getSegment(ingestedSegment.id, rundown)

    const updatedSegment: Segment = new Segment({
      id: ingestedSegment.id,
      rundownId: ingestedSegment.rundownId,
      name: ingestedSegment.name,
      definesShowStyleVariant: ingestedSegment.definesShowStyleVariant,
      executedAtEpochTime: segment.getExecutedAtEpochTime(),
      expectedDurationInMs: ingestedSegment.budgetDuration,
      invalidity: ingestedSegment.invalidity,
      isHidden: ingestedSegment.isHidden,
      isNext: segment.isNext(),
      isOnAir: segment.isOnAir(),
      isUnsynced: false, // Updated are never unsynced since Core removes and adds new Segments instead of updating them
      metadata: ingestedSegment.metadata,
      parts: segment.getParts(),
      rank: ingestedSegment.rank,
      referenceTag: ingestedSegment.referenceTag,
    })

    rundown.updateSegment(updatedSegment)

    this.eventEmitter.emitSegmentUpdated(rundown, segment)
    await this.rundownRepository.saveRundown(rundown)
  }

  private async getSegment(segmentId: string, rundown: Rundown): Promise<Segment> {
    try {
      return await this.segmentRepository.getSegment(segmentId)
    } catch (error) {
      if (error instanceof NotFoundException) {
        const segment = new Segment({
          id: segmentId,
          rundownId: rundown.id,
          name: '',
          definesShowStyleVariant: false,
          isHidden: false,
          isNext: false,
          isOnAir: false,
          isUnsynced: false,
          parts: [],
          rank: 0,
        })
        rundown.addSegment(segment)
        return segment
      }
      throw error
    }
  }

  private listenForPartChanges(partChangedListener: DataChangedListener<IngestedPart>): void {
    partChangedListener.onCreated(ingestedPart => {
      this.logger.debug(`Create part event for ${ingestedPart.name} with id ${ingestedPart.id}.`)
      this.enqueueDataChangeEvent({
        eventType: 'insert',
        entityType: 'part',
        entity: ingestedPart,
      })
    })
    partChangedListener.onUpdated(ingestedPart => {
      this.logger.debug(`Update part event for ${ingestedPart.name} with id ${ingestedPart.id}.`)
      this.enqueueDataChangeEvent({
        eventType: 'update',
        entityType: 'part',
        entity: ingestedPart,
      })
    })
    partChangedListener.onDeleted(partId => {
      this.logger.debug(`Delete part event for ${partId}.`)
      this.enqueueDataChangeEvent({
        eventType: 'delete',
        entityType: 'part',
        entityId: partId,
      })
    })
  }

  private async createPart(ingestedPart: IngestedPart): Promise<void> {
    const rundown: Rundown = await this.getRundown(ingestedPart.rundownId)
    const segment: Segment = await this.getSegment(ingestedPart.id, rundown)

    const part: Part = this.ingestedEntityToEntityMapper.convertIngestedPartToPart(ingestedPart)

    segment.addPart(part)

    this.eventEmitter.emitPartCreated(rundown, part)
    await this.rundownRepository.saveRundown(rundown)
  }

  public async initialize(): Promise<void> {
  }
}
