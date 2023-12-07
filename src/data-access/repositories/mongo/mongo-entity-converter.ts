import { Owner } from '../../../model/enums/owner'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { TransitionType } from '../../../model/enums/transition-type'
import { TimelineObject } from '../../../model/entities/timeline-object'
import { InTransition } from '../../../model/value-objects/in-transition'
import { OutTransition } from '../../../model/value-objects/out-transition'
import { AutoNext } from '../../../model/value-objects/auto-next'
import { PartTimings } from '../../../model/value-objects/part-timings'
import { PartEndState } from '../../../model/value-objects/part-end-state'
import { RundownPersistentState } from '../../../model/value-objects/rundown-persistent-state'
import { RundownCursor } from '../../../model/value-objects/rundown-cursor'
import { Piece } from '../../../model/entities/piece'
import { Part } from '../../../model/entities/part'
import { Segment } from '../../../model/entities/segment'
import { Rundown, RundownAlreadyActiveProperties } from '../../../model/entities/rundown'
import { BasicRundown } from '../../../model/entities/basic-rundown'
import { Exception } from '../../../model/exceptions/exception'
import { ErrorCode } from '../../../model/enums/error-code'
import { Timeline } from '../../../model/entities/timeline'
import { Studio } from '../../../model/entities/studio'
import { StudioLayer } from '../../../model/value-objects/studio-layer'
import { LookaheadMode } from '../../../model/enums/lookahead-mode'
import { ShowStyle } from '../../../model/entities/show-style'
import { ShowStyleVariant } from '../../../model/entities/show-style-variant'
import { Media } from '../../../model/entities/media'
import { RundownTiming } from '../../../model/value-objects/rundown-timing'
import { IngestedPart } from '../../../model/entities/ingested-part'
import { UnsupportedOperationException } from '../../../model/exceptions/unsupported-operation-exception'

export interface MongoId {
  _id: string
}

export interface MongoRundown extends MongoId {
  name: string
  showStyleVariantId: string
  segmentIds: string[]
  isActive: boolean
  baselineTimelineObjects: TimelineObject[]
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
  partIds: string[]
  isOnAir: boolean
  isNext: boolean
  isUnsynced: boolean
  budgetDuration?: number
  executedAtEpochTime?: number
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
  name: string
  layer: string
  pieceLifespan: PieceLifespan
  isPlanned: boolean
  start: number
  duration?: number
  preRollDuration: number
  postRollDuration: number
  executedAt?: number
  transitionType: TransitionType
  timelineObjects: TimelineObject[]

  metadata?: unknown
  content?: unknown
  tags: string[]
  isUnsynced: boolean
}

export interface MongoTimeline extends MongoId {
  timelineHash: string
  generated: number
  timelineBlob: string
}

export interface MongoStudio {
  mappings: MongoLayerMappings
  blueprintConfig: unknown
}

interface MongoLayerMappings {
  [layerName: string]: MongoLayerMapping
}

export interface MongoShowStyle {
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

export interface MongoMedia {
  mediaId: string
  mediainfo: {
    format: {
      duration: number
    }
  }
}

export class MongoEntityConverter {

  public convertToRundown(mongoRundown: MongoRundown, segments: Segment[], infinitePieces?: Piece[]): Rundown {
    const alreadyActiveProperties: RundownAlreadyActiveProperties | undefined = mongoRundown.isActive
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
      isRundownActive: mongoRundown.isActive ?? false,
      baselineTimelineObjects: mongoRundown.baselineTimelineObjects,
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
      modifiedAt: rundown.getLastTimeModified(),

      persistentState: rundown.getPersistentState(),
      infinitePieceIds: rundown.getInfinitePieces().map(piece => piece.id),
      activeCursor: this.convertRundownCursorToMongoRundownCursor(rundown.getActiveCursor()),
      nextCursor: this.convertRundownCursorToMongoRundownCursor(rundown.getNextCursor()),
      history: rundown.getHistory().map(part => this.convertToMongoPart(part)),
      isActive: rundown.isActive(),
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
      mongoRundown.isActive ?? false,
      mongoRundown.modifiedAt,
      mongoRundown.timing
    )
  }

  public convertToBasicRundowns(mongoRundowns: MongoRundown[]): BasicRundown[] {
    return mongoRundowns.map(this.convertToBasicRundown.bind(this))
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
      partIds: segment.getParts().map(part => part.id),
      isOnAir: segment.isOnAir(),
      isNext: segment.isNext(),
      isUnsynced: segment.isUnsynced(),
      budgetDuration: segment.expectedDurationInMs,
      executedAtEpochTime: segment.getExecutedAtEpochTime(),
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
      return  part.getTimings()
    } catch (error) {
      if ((error as Exception).errorCode !== ErrorCode.UNSUPPORTED_OPERATION) {
        throw error
      }
    }
  }

  public convertToPiece(mongoPiece: MongoPiece): Piece {
    return new Piece({
      ...mongoPiece,
      id: mongoPiece._id
    })
  }

  public convertToPieces(mongoPieces: MongoPiece[]): Piece[] {
    return mongoPieces.map(this.convertToPiece)
  }

  public convertToMongoPiece(piece: Piece): MongoPiece {
    return {
      _id: piece.id,
      partId: piece.getPartId(),
      name: piece.name,
      layer: piece.layer,
      pieceLifespan: piece.pieceLifespan,
      isPlanned: piece.isPlanned,
      start: piece.getStart(),
      duration: piece.getDuration(),
      preRollDuration: piece.preRollDuration,
      postRollDuration: piece.postRollDuration,
      executedAt: piece.getExecutedAt(),
      transitionType: piece.transitionType,
      timelineObjects: piece.timelineObjects,
      metadata: piece.metadata,
      content: piece.content,
      isUnsynced: piece.isUnsynced(),
      tags: piece.tags
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
        lookaheadMode: this.mapLookaheadNumberToEnum(mongoStudio.mappings[mapping].lookahead),
        amountOfLookaheadObjectsToFind: mongoStudio.mappings[mapping].lookaheadDepth ?? defaultNumberOfObjects,
        maximumLookaheadSearchDistance: mongoStudio.mappings[mapping].lookaheadMaxSearchDistance ?? defaultLookaheadDistance,
      })
    }
    return { layers, blueprintConfiguration: mongoStudio.blueprintConfig }
  }

  private mapLookaheadNumberToEnum(lookAheadNumber: number): LookaheadMode {
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
        throw new UnsupportedOperationException(`Found unknown number for LookAhead: ${lookAheadNumber}`)
      }
    }
  }

  public convertShowStyle(mongoShowStyle: MongoShowStyle): ShowStyle {
    return {
      blueprintConfiguration: mongoShowStyle.blueprintConfig,
    }
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
      id: mongoMedia.mediaId,
      duration: mongoMedia.mediainfo.format.duration
    }
  }
}
