import { Owner } from '../../../domain/enums/owner'
import { PieceLifespan } from '../../../domain/enums/piece-lifespan'
import { TransitionType } from '../../../domain/enums/transition-type'
import { TimelineObject } from '../../../domain/entities/timeline-object'
import { InTransition } from '../../../domain/value-objects/in-transition'
import { OutTransition } from '../../../domain/value-objects/out-transition'
import { AutoNext } from '../../../domain/value-objects/auto-next'
import { PartTimings } from '../../../domain/value-objects/part-timings'
import { PartEndState } from '../../../domain/value-objects/part-end-state'
import { RundownPersistentState } from '../../../domain/value-objects/rundown-persistent-state'
import { RundownCursor } from '../../../domain/value-objects/rundown-cursor'
import { Piece } from '../../../domain/entities/piece'
import { Part } from '../../../domain/entities/part'
import { Segment } from '../../../domain/entities/segment'
import { Rundown, RundownAlreadyActiveProperties } from '../../../domain/entities/rundown'
import { BasicRundown } from '../../../domain/entities/basic-rundown'
import { Exception } from '../../../domain/exceptions/exception'
import { ErrorCode } from '../../../domain/enums/error-code'
import { Timeline } from '../../../domain/entities/timeline'
import { Studio } from '../../../domain/entities/studio'
import { StudioLayer } from '../../../domain/value-objects/studio-layer'
import { LookaheadMode } from '../../../domain/enums/lookahead-mode'
import { ShowStyle } from '../../../domain/entities/show-style'
import { ShowStyleVariant } from '../../../domain/entities/show-style-variant'
import { Media } from '../../../domain/entities/media'
import { RundownTiming } from '../../../domain/value-objects/rundown-timing'
import { IngestedPart } from '../../../domain/entities/ingested-part'
import { SystemInformation } from '../../../../cross-cutting-concerns/domain/value-objects/system-information'
import { StatusCode } from '../../../../cross-cutting-concerns/domain/enums/status-code'
import { RundownMode } from '../../../domain/enums/rundown-mode'
import { Invalidity } from '../../../domain/value-objects/invalidity'
import { Logger } from '../../../../cross-cutting-concerns/application/interfaces/logger'
import { Action, ActionArgument } from '../../../../action-system/domain/entities/action'
import { ActionType } from '../../../../action-system/domain/enums/action-type'
import { DeviceType } from '../../../domain/enums/device-type'
import { TakeMode } from '../../../domain/enums/take-mode'
import { PieceMetadata } from '../../../domain/value-objects/metadata'
import { CoreDevice } from '../../../domain/entities/device'

export interface MongoId {
  _id: string
}

export interface MongoRundown extends MongoId {
  name: string
  showStyleVariantId: string
  segmentIds: string[]
  mode: RundownMode
  takeMode: TakeMode
  baselineTimelineObjects: TimelineObject[]
  baselinePieceIds: string[]
  modifiedAt: number

  persistentState?: RundownPersistentState
  infinitePieceIds: string[]
  activeCursor: MongoRundownCursor | undefined
  nextCursor: MongoRundownCursor | undefined
  history: MongoPart[]
  timing: RundownTiming
}

interface MongoRundownCursor {
  partId: string
  segmentId: string
  owner: Owner
}

export interface MongoSegment extends MongoId {
  rundownId: string
  name: string
  rank: number
  isHidden: boolean
  metadata?: unknown
  partIds: string[]
  isOnAir: boolean
  isNext: boolean
  isUnsynced: boolean
  referenceTag?: string
  expectedDurationInMs?: number
  executedAtEpochTime?: number
  invalidity?: {
    reason: string
  }
  definesShowStyleVariant: boolean
}

export interface MongoPart extends MongoId {
  rundownId: string
  segmentId: string
  name: string
  rank: number
  isPlanned: boolean
  pieceIds: string[]
  isOnAir: boolean
  isNext: boolean
  isUntimed: boolean
  isUnsynced: boolean
  expectedDuration?: number
  executedAt?: number
  playedDuration?: number
  invalidity?: Invalidity

  inTransition: InTransition
  outTransition: OutTransition

  autoNext?: AutoNext
  disableNextInTransition: boolean

  timings?: PartTimings
  endState?: PartEndState

  ingestedPart?: IngestedPart
}

export interface MongoPiece extends MongoId {
  partId: string
  rundownId: string
  name: string
  layer: string
  pieceLifespan: PieceLifespan
  isPlanned: boolean
  start: number
  duration?: number
  preRollDuration: number
  postRollDuration: number
  executedAt?: number
  takenOffAirTimestamp?: number
  transitionType: TransitionType
  timelineObjects: TimelineObject[]

  metadata: PieceMetadata
  content?: unknown
  tags: string[]
  isUnsynced: boolean
  isInsertedOnAir?: boolean
}

export interface MongoTimeline extends MongoId {
  timelineHash: string
  generated: number
  timelineBlob: string
}

export interface MongoStudio {
  _id: string
  settings: {
    mediaPreviewsUrl: string
  }
  mappings: MongoLayerMappings
  blueprintConfig: unknown
}

interface MongoLayerMappings {
  [layerName: string]: MongoLayerMapping
}

export interface MongoShowStyle {
  _id: string
  blueprintConfig: unknown
}

export interface MongoShowStyleVariant extends MongoId {
  showStyleBaseId: string
  name: string
  blueprintConfig: unknown
}

interface MongoLayerMapping {
  // Which Lookahead "mode" we are in.
  lookahead: number
  // The minimum number of lookahead objects to find.
  lookaheadDepth: number
  // The maximum distance to search for lookahead
  lookaheadMaxSearchDistance: number
}

export interface MongoMedia extends MongoId {
  mediaId: string
  mediainfo?: {
    format?: {
      duration?: string
    }
  }
}

export interface MongoSystemInformation extends MongoId {
  name: string
}

export interface MongoAction extends MongoId {
  id: string
  name: string
  rank: number
  description?: string
  type: ActionType
  data: unknown
  metadata?: unknown
  rundownId?: string
  argument?: ActionArgument
}

export interface MongoCoreDevice extends MongoId {
  name: string
  type: DeviceType
  status: {
    statusCode: number
    messages: string[]
  }
  connected: boolean
}

const MILLISECONDS_TO_SECONDS_RATIO: number = 1000

export class MongoEntityConverter {
  private readonly logger: Logger

  constructor(logger: Logger) {
    this.logger = logger.tag(MongoEntityConverter.name)
  }

  public convertToRundown(mongoRundown: MongoRundown, segments: Segment[], baselinePieces: Piece[], infinitePieces?: Piece[]): Rundown {
    const alreadyActiveProperties: RundownAlreadyActiveProperties | undefined = [RundownMode.ACTIVE, RundownMode.REHEARSAL].includes(mongoRundown.mode)
      ? {
        activeCursor: this.convertMongoRundownCursorToRundownCursor(mongoRundown.activeCursor, segments),
        nextCursor: this.convertMongoRundownCursorToRundownCursor(mongoRundown.nextCursor, segments),
        infinitePieces: this.mapToInfinitePieceMap(infinitePieces ?? [])
      }
      : undefined
    return new Rundown({
      id: mongoRundown._id,
      name: mongoRundown.name,
      showStyleVariantId: mongoRundown.showStyleVariantId,
      mode: mongoRundown.mode ?? RundownMode.INACTIVE,
      takeMode: mongoRundown.takeMode ?? TakeMode.STANDARD,
      baselineTimelineObjects: mongoRundown.baselineTimelineObjects,
      baselinePieces,
      segments,
      modifiedAt: mongoRundown.modifiedAt,
      persistentState: mongoRundown.persistentState,
      history: this.convertToParts(mongoRundown.history ?? []),
      timing: mongoRundown.timing,
      alreadyActiveProperties
    })
  }

  private convertMongoRundownCursorToRundownCursor(cursor: MongoRundownCursor | undefined, segments: Segment[]): RundownCursor | undefined {
    if (!cursor) {
      return
    }
    const segmentForCursor: Segment | undefined = segments.find(segment => segment.id === cursor.segmentId)
    if (!segmentForCursor) {
      return
    }

    const partForCursor: Part | undefined = segmentForCursor.getParts().find(part => part.id === cursor.partId)
    if (!partForCursor) {
      return
    }

    return {
      part: partForCursor,
      segment: segmentForCursor,
      owner: cursor.owner
    }
  }

  private mapToInfinitePieceMap(infinitePieces: Piece[]): Map<string, Piece> {
    return new Map(infinitePieces.map(piece => [piece.layer, piece]))
  }

  public convertToMongoRundown(rundown: Rundown): MongoRundown {
    return {
      _id: rundown.id,
      name: rundown.name,
      showStyleVariantId: rundown.getShowStyleVariantId(),
      segmentIds: rundown.getSegments().map(segment => segment.id),
      baselineTimelineObjects: rundown.getBaseline(),
      baselinePieceIds: rundown.getBaselinePieces().map(piece => piece.id),
      modifiedAt: rundown.getLastTimeModified(),

      persistentState: rundown.getPersistentState(),
      infinitePieceIds: rundown.getInfinitePieces().map(piece => piece.id),
      activeCursor: this.convertRundownCursorToMongoRundownCursor(rundown.getActiveCursor()),
      nextCursor: this.convertRundownCursorToMongoRundownCursor(rundown.getNextCursor()),
      history: rundown.getHistory().map(part => this.convertToMongoPart(part)),
      mode: rundown.getMode(),
      takeMode: rundown.getTakeMode(),
      timing: rundown.timing
    }
  }

  public convertRundownCursorToMongoRundownCursor(cursor: RundownCursor | undefined): MongoRundownCursor | undefined {
    if (!cursor) {
      return
    }
    return {
      partId: cursor.part.id,
      segmentId: cursor.segment.id,
      owner: cursor.owner
    }
  }

  public convertToBasicRundown(mongoRundown: MongoRundown): BasicRundown {
    return new BasicRundown(
      mongoRundown._id,
      mongoRundown.name,
      mongoRundown.mode ?? RundownMode.INACTIVE,
      mongoRundown.takeMode ?? TakeMode.STANDARD,
      mongoRundown.modifiedAt,
      mongoRundown.timing
    )
  }

  public convertToSegment(mongoSegment: MongoSegment): Segment {
    return new Segment({
      ...mongoSegment,
      id: mongoSegment._id,
      parts: []
    })
  }

  public convertToSegments(mongoSegments: MongoSegment[]): Segment[] {
    return mongoSegments.map(this.convertToSegment)
  }

  public convertToMongoSegment(segment: Segment): MongoSegment {
    return {
      _id: segment.id,
      rundownId: segment.rundownId,
      name: segment.name,
      rank: segment.rank,
      referenceTag: segment.referenceTag,
      isHidden: segment.isHidden,
      metadata: segment.metadata,
      partIds: segment.getParts().map(part => part.id),
      isOnAir: segment.isOnAir(),
      isNext: segment.isNext(),
      isUnsynced: segment.isUnsynced(),
      expectedDurationInMs: segment.expectedDurationInMs,
      executedAtEpochTime: segment.getExecutedAtEpochTime(),
      invalidity: segment.invalidity,
      definesShowStyleVariant: segment.definesShowStyleVariant
    }
  }

  public convertToPart(mongoPart: MongoPart): Part {
    return new Part({
      ...mongoPart,
      id: mongoPart._id,
      pieces: []
    })
  }

  public convertToParts(mongoParts: MongoPart[]): Part[] {
    return mongoParts.map(this.convertToPart)
  }

  public convertToMongoPart(part: Part): MongoPart {
    return {
      _id: part.id,
      rundownId: part.rundownId,
      segmentId: part.getSegmentId(),
      name: part.name,
      rank: part.getRank(),
      isPlanned: part.isPlanned,
      pieceIds: part.getPieces().map(piece => piece.id),
      isOnAir: part.isOnAir(),
      isNext: part.isNext(),
      isUntimed: part.isUntimed(),
      isUnsynced: part.isUnsynced(),
      expectedDuration: part.expectedDuration,
      executedAt: part.getExecutedAt(),
      playedDuration: part.getPlayedDuration(),
      invalidity: part.invalidity,

      inTransition: part.getInTransition(),
      outTransition: part.outTransition,

      autoNext: part.autoNext,
      disableNextInTransition: part.disableNextInTransition,

      timings: this.getPartTimings(part),
      endState: part.getEndState(),

      ingestedPart: part.ingestedPart
    }
  }

  private getPartTimings(part: Part): PartTimings | undefined {
    try {
      return part.getTimings()
    } catch (error) {
      if ((error as Exception).errorCode !== ErrorCode.UNSUPPORTED_OPERATION) {
        throw error
      }
    }
  }

  public convertToPiece(mongoPiece: MongoPiece): Piece {
    return new Piece({
      ...mongoPiece,
      id: mongoPiece._id,
      takenOffAirTimestamp: mongoPiece.takenOffAirTimestamp ?? 0,
      isInsertedOnAir: mongoPiece.isInsertedOnAir,
    })
  }

  public convertToMongoPiece(piece: Piece): MongoPiece {
    return {
      _id: piece.id,
      partId: piece.getPartId(),
      rundownId: piece.rundownId,
      name: piece.name,
      layer: piece.layer,
      pieceLifespan: piece.pieceLifespan,
      isPlanned: piece.isPlanned,
      start: piece.getStart(),
      duration: piece.getDuration(),
      preRollDuration: piece.preRollDuration,
      postRollDuration: piece.postRollDuration,
      executedAt: piece.getExecutedAt(),
      takenOffAirTimestamp: piece.getTakenOffAirTimestamp(),
      transitionType: piece.transitionType,
      timelineObjects: piece.getTimelineObjects(),
      metadata: piece.metadata,
      content: piece.content,
      isUnsynced: piece.isUnsynced(),
      tags: piece.tags,
      isInsertedOnAir: piece.isInsertedOnAir(),
    }
  }

  public convertToMongoTimeline(timeline: Timeline): MongoTimeline {
    return {
      _id: 'studio0',
      timelineHash: '',
      generated: new Date().getTime(),
      timelineBlob: JSON.stringify(timeline.timelineGroups),
    }
  }

  public convertToTimeline(mongoTimeline: MongoTimeline): Timeline {
    return {
      timelineGroups: JSON.parse(mongoTimeline.timelineBlob),
    }
  }

  public convertStudio(mongoStudio: MongoStudio): Studio {
    const defaultNumberOfObjects: number = 1
    const defaultLookaheadDistance: number = 10
    const layers: StudioLayer[] = []
    for (const mapping in mongoStudio.mappings) {
      layers.push({
        name: mapping,
        lookaheadMode: this.getLookaheadModeForMongoLayerMapping(mapping, mongoStudio.mappings[mapping]),
        amountOfLookaheadObjectsToFind: mongoStudio.mappings[mapping].lookaheadDepth ?? defaultNumberOfObjects,
        maximumLookaheadSearchDistance: mongoStudio.mappings[mapping].lookaheadMaxSearchDistance ?? defaultLookaheadDistance,
      })
    }
    return {
      settings: {
        mediaPreviewUrl: mongoStudio.settings.mediaPreviewsUrl
      },
      layers,
      blueprintConfiguration: mongoStudio.blueprintConfig
    }
  }

  private getLookaheadModeForMongoLayerMapping(mappingName: string, mapping: MongoLayerMapping): LookaheadMode {
    const lookahead: LookaheadMode | undefined = this.mapLookaheadNumberToEnum(mapping.lookahead)
    if (!lookahead) {
      this.logger.warn(`Found unknown value '${mapping.lookahead}' for lookahead in '${mappingName}' layer mapping. Defaulting to NONE.`)
      return LookaheadMode.NONE
    }
    return lookahead
  }

  private mapLookaheadNumberToEnum(lookAheadNumber: number): LookaheadMode | undefined {
    // These numbers are based on the "LookaheadMode" enum from BlueprintsIntegration
    switch (lookAheadNumber) {
      case 0: {
        return LookaheadMode.NONE
      }
      case 1: {
        return LookaheadMode.PRELOAD
      }
      case 3: {
        return LookaheadMode.WHEN_CLEAR
      }
      default: {
        return undefined
      }
    }
  }

  public convertShowStyle(mongoShowStyle: MongoShowStyle, showStyleVariants: ShowStyleVariant[]): ShowStyle {
    return {
      blueprintConfiguration: mongoShowStyle.blueprintConfig,
      variants: showStyleVariants
    }
  }

  public convertShowStyleVariants(mongoShowStyleVariants: MongoShowStyleVariant[]): ShowStyleVariant[] {
    return mongoShowStyleVariants.map(this.convertShowStyleVariant)
  }

  public convertShowStyleVariant(mongoShowStyleVariant: MongoShowStyleVariant): ShowStyleVariant {
    return {
      id: mongoShowStyleVariant._id,
      name: mongoShowStyleVariant.name,
      showStyleBaseId: mongoShowStyleVariant.showStyleBaseId,
      blueprintConfiguration: mongoShowStyleVariant.blueprintConfig
    }
  }

  public convertMedia(mongoMedia: MongoMedia): Media {
    return {
      id: mongoMedia._id,
      sourceName: mongoMedia.mediaId,
      duration: mongoMedia.mediainfo?.format?.duration ? Number.parseFloat(mongoMedia.mediainfo?.format?.duration) * MILLISECONDS_TO_SECONDS_RATIO : 0
    }
  }

  public convertSystemInformation(mongoSystemInformation: MongoSystemInformation): SystemInformation {
    return {
      name: mongoSystemInformation.name
    }
  }

  public convertToCoreDeviceInterface(mongoDevice: MongoCoreDevice): CoreDevice {
    const statusMessage: string = mongoDevice.status.messages && mongoDevice.status.messages.length > 0
      ? mongoDevice.status.messages.reduce((previousValue, currentValue) => `${previousValue}; ${currentValue}`)
      : ''

    return {
      id: mongoDevice._id,
      name: mongoDevice.name,
      isConnected: mongoDevice.connected,
      statusCode: this.getStatusCode(mongoDevice.status.statusCode),
      statusMessage,
      type: mongoDevice.type
    }
  }

  private getStatusCode(value: number): StatusCode {
    switch (value) {
      case 1: {
        return StatusCode.GOOD
      }
      case 2:
      case 3: {
        return StatusCode.WARNING
      }
      case 4:
      case 5: {
        return StatusCode.BAD
      }
      default: {
        return StatusCode.UNKNOWN
      }
    }
  }

  public convertToCoreDeviceInterfaces(mongoDevices: MongoCoreDevice[]): CoreDevice[] {
    return mongoDevices.map(mongoDevice => this.convertToCoreDeviceInterface(mongoDevice))
  }

  public convertToAction(mongoAction: MongoAction): Action {
    return {
      id: mongoAction.id,
      type: mongoAction.type,
      rundownId: mongoAction.rundownId ?? undefined,
      argument: mongoAction.argument,
      data: mongoAction.data,
      description: mongoAction.description,
      metadata: mongoAction.metadata,
      name: mongoAction.name,
      rank: mongoAction.rank,
    }
  }

  public convertToMongoAction(action: Action): MongoAction {
    return {
      ...action,
      _id: action.id
    }
  }
}
