import { Rundown, RundownAlreadyActiveProperties } from '../../../model/entities/rundown'
import { Segment } from '../../../model/entities/segment'
import { Part } from '../../../model/entities/part'
import { Piece } from '../../../model/entities/piece'
import { Timeline } from '../../../model/entities/timeline'
import { BasicRundown } from '../../../model/entities/basic-rundown'
import { TimelineObject } from '../../../model/entities/timeline-object'
import { Studio } from '../../../model/entities/studio'
import { StudioLayer } from '../../../model/value-objects/studio-layer'
import { LookaheadMode } from '../../../model/enums/lookahead-mode'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { TransitionType } from '../../../model/enums/transition-type'
import { ShowStyle } from '../../../model/entities/show-style'
import { Owner } from '../../../model/enums/owner'
import { RundownCursor } from '../../../model/value-objects/rundown-cursor'
import { ShowStyleVariant } from '../../../model/entities/show-style-variant'
import { PartTimings } from '../../../model/value-objects/part-timings'
import { Exception } from '../../../model/exceptions/exception'
import { ErrorCode } from '../../../model/enums/error-code'
import { ActionManifest } from '../../../model/entities/action'
import { Media } from '../../../model/entities/media'

export interface MongoId {
  _id: string
}

export interface MongoRundown extends MongoId {
  name: string
  showStyleVariantId: string
  modified: number
  isActive?: boolean // TODO: Remove optionality when we have control over data structure.
  infinitePieceIds: string[]
  persistentState?: unknown
  activeCursor: MongoRundownCursor | undefined
  nextCursor: MongoRundownCursor | undefined
  history: MongoPart[]
}

interface MongoRundownCursor {
  partId: string
  segmentId: string
  owner: Owner
}

export interface MongoSegment extends MongoId {
  name: string
  _rank: number
  rundownId: string
  externalId: string
  isHidden: boolean
  isOnAir: boolean
  isUnsynced: boolean
  isNext: boolean
  budgetDuration?: number
}

export interface MongoPart extends MongoId {
  segmentId: string
  title: string
  _rank: number
  isPlanned: boolean
  expectedDuration: number
  isOnAir: boolean
  isNext: boolean
  isUnsynced?: boolean
  inTransition?: {
    previousPartKeepaliveDuration: number
    partContentDelayDuration: number
  }
  outTransition?: {
    duration: number
  }
  autoNext: boolean
  autoNextOverlap: number
  disableNextInTransition: boolean
  timings?: PartTimings
  endState?: unknown
}

export interface MongoPiece extends MongoId {
  startPartId: string
  name: string
  sourceLayerId: string
  enable: {
    start: number | string
    duration?: number
  }
  prerollDuration: number
  postrollDuration: number
  executedAt: number
  timelineObjectsString: string
  lifespan: string
  pieceType: string
  isPlanned?: boolean
  metaData?: unknown // This is called "metaData" in the database, so we have to keep the spelling like this.
  content?: unknown
  tags?: string[]
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

export interface MongoActionManifest {
  actionId: string
  userData: unknown
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
  public convertRundown(mongoRundown: MongoRundown, segments: Segment[], baselineTimelineObjects?: TimelineObject[], infinitePieces?: Piece[]): Rundown {
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
      baselineTimelineObjects: baselineTimelineObjects ?? [],
      segments,
      modifiedAt: mongoRundown.modified,
      persistentState: mongoRundown.persistentState,
      history: this.convertParts(mongoRundown.history ?? []),
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
      isActive: rundown.isActive(),
      infinitePieceIds: rundown.getInfinitePieces().map(piece => piece.id),
      persistentState: rundown.getPersistentState(),
      activeCursor: this.convertRundownCursorToMongoRundownCursor(rundown.getActiveCursor()),
      nextCursor: this.convertRundownCursorToMongoRundownCursor(rundown.getNextCursor()),
      history: rundown.getHistory().map(part => this.convertToMongoPart(part))
    } as MongoRundown
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
      mongoRundown.modified
    )
  }

  public convertToBasicRundowns(mongoRundowns: MongoRundown[]): BasicRundown[] {
    return mongoRundowns.map(this.convertToBasicRundown.bind(this))
  }

  public convertSegment(mongoSegment: MongoSegment): Segment {
    return new Segment({
      id: mongoSegment._id,
      rundownId: mongoSegment.rundownId,
      name: mongoSegment.name,
      rank: mongoSegment._rank,
      isOnAir: mongoSegment.isOnAir ?? false,
      isNext: mongoSegment.isNext ?? false,
      isUnsynced: mongoSegment.isUnsynced ?? false,
      parts: [],
      budgetDuration: mongoSegment.budgetDuration ?? undefined, // Ensure that null values are stripped
    })
  }

  public convertSegments(mongoSegments: MongoSegment[]): Segment[] {
    return mongoSegments
      .filter((segment) => !segment.isHidden || (segment.isHidden && segment.isUnsynced))
      .map(this.convertSegment.bind(this))
  }

  public convertToMongoSegment(segment: Segment): MongoSegment {
    return {
      _id: segment.id,
      name: segment.name,
      rundownId: segment.rundownId,
      _rank: segment.rank,
      isOnAir: segment.isOnAir(),
      isNext: segment.isNext(),
      isUnsynced: segment.isUnsynced(),
      budgetDuration: segment.budgetDuration,
    } as MongoSegment
  }

  public convertPart(mongoPart: MongoPart): Part {
    return new Part({
      id: mongoPart._id,
      segmentId: mongoPart.segmentId,
      name: mongoPart.title,
      rank: mongoPart._rank,
      isPlanned: mongoPart.isPlanned ?? true,
      expectedDuration: mongoPart.expectedDuration,
      isOnAir: false,
      isNext: false,
      isUnsynced: mongoPart.isUnsynced ?? false,
      pieces: [],
      inTransition: {
        keepPreviousPartAliveDuration: mongoPart.inTransition?.previousPartKeepaliveDuration ?? 0,
        delayPiecesDuration: mongoPart.inTransition?.partContentDelayDuration ?? 0,
      },
      outTransition: {
        keepAliveDuration: mongoPart.outTransition?.duration ?? 0,
      },
      autoNext: mongoPart.autoNext ? { overlap: mongoPart.autoNextOverlap } : undefined,
      disableNextInTransition: mongoPart.disableNextInTransition,
      timings: mongoPart.timings,
      endState: mongoPart.endState,
    })
  }

  public convertParts(mongoParts: MongoPart[]): Part[] {
    return mongoParts.map(this.convertPart.bind(this))
  }

  public convertToMongoPart(part: Part): MongoPart {
    return {
      _id: part.id,
      isPlanned: part.isPlanned,
      expectedDuration: part.expectedDuration,
      title: part.name,
      segmentId: part.getSegmentId(),
      _rank: part.getRank(),
      isOnAir: part.isOnAir(),
      isNext: part.isNext(),
      isUnsynced: part.isUnsynced(),
      timings: this.getTimings(part),
      endState: part.getEndState(),
    } as MongoPart
  }

  private getTimings(part: Part): PartTimings | undefined {
    try {
      return  part.getTimings()
    } catch (error) {
      if ((error as Exception).errorCode !== ErrorCode.UNSUPPORTED_OPERATION) {
        throw error
      }
    }
  }

  public convertPiece(mongoPiece: MongoPiece): Piece {
    return new Piece({
      id: mongoPiece._id,
      partId: mongoPiece.startPartId,
      name: mongoPiece.name,
      layer: mongoPiece.sourceLayerId,
      pieceLifespan: this.mapMongoPieceLifeSpan(mongoPiece.lifespan),
      isPlanned: mongoPiece.isPlanned ?? true,
      start: typeof mongoPiece.enable.start === 'number' ? mongoPiece.enable.start : 0,
      duration: mongoPiece.enable.duration ?? undefined,
      preRollDuration: mongoPiece.prerollDuration,
      postRollDuration: mongoPiece.prerollDuration,
      executedAt: mongoPiece.executedAt,
      transitionType: this.mapMongoPieceTypeToTransitionType(mongoPiece.pieceType),
      timelineObjects: JSON.parse(mongoPiece.timelineObjectsString),
      metadata: mongoPiece.metaData,
      content: mongoPiece.content,
      tags: mongoPiece.tags ?? [],
      isUnsynced: mongoPiece.isUnsynced
    })
  }

  private mapMongoPieceLifeSpan(mongoPieceLifeSpan: string): PieceLifespan {
    switch (mongoPieceLifeSpan) {
      case 'showstyle-end':
      case 'rundown-change': {
        return PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE
      }
      case 'rundown-end': {
        return PieceLifespan.SPANNING_UNTIL_RUNDOWN_END
      }
      case 'segment-change': {
        return PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE
      }
      case 'segment-end': {
        return PieceLifespan.SPANNING_UNTIL_SEGMENT_END
      }
      case 'rundown-change-segment-lookback': {
        return PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN
      }
      case 'part-only':
      default: {
        return PieceLifespan.WITHIN_PART
      }
    }
  }

  private mapMongoPieceTypeToTransitionType(type: string): TransitionType {
    switch (type) {
      case 'in-transition':
        return TransitionType.IN_TRANSITION
      case 'out-transition':
        return TransitionType.OUT_TRANSITION
      case 'normal':
      default:
        return TransitionType.NO_TRANSITION
    }
  }

  public convertPieces(mongoPieces: MongoPiece[]): Piece[] {
    return mongoPieces.map((mongoPiece) => this.convertPiece(mongoPiece))
  }

  public convertToMongoPiece(piece: Piece): MongoPiece {
    const enable: MongoPiece['enable'] = {
      start: piece.getStart(),
      ...(piece.duration ? { duration: piece.duration } : null)
    }

    return {
      _id: piece.id,
      name: piece.name,
      startPartId: piece.getPartId(),
      sourceLayerId: piece.layer,
      lifespan: this.mapPieceLifespanToMongoPieceLifespan(piece.pieceLifespan),
      isPlanned: piece.isPlanned,
      enable,
      prerollDuration: piece.preRollDuration,
      postrollDuration: piece.postRollDuration,
      executedAt: piece.getExecutedAt(),
      pieceType: this.mapTransitionTypeToMongoTransitionType(piece.transitionType),
      timelineObjectsString: JSON.stringify(piece.timelineObjects),
      metaData: piece.metadata,
      content: piece.content,
      tags: piece.tags,
      isUnsynced: piece.isUnsynced()
    }
  }

  private mapPieceLifespanToMongoPieceLifespan(lifespan: PieceLifespan): string {
    switch (lifespan) {
      case PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE: {
        return 'rundown-change'
      }
      case PieceLifespan.SPANNING_UNTIL_RUNDOWN_END: {
        return 'rundown-end'
      }
      case PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE: {
        return 'segment-change'
      }
      case PieceLifespan.SPANNING_UNTIL_SEGMENT_END: {
        return 'segment-end'
      }
      case PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN: {
        return 'rundown-change-segment-lookback'
      }
      case PieceLifespan.WITHIN_PART:
      default: {
        return 'part-only'
      }
    }
  }

  private mapTransitionTypeToMongoTransitionType(transitionType: TransitionType): string {
    switch (transitionType) {
      case TransitionType.IN_TRANSITION: {
        return 'in-transition'
      }
      case TransitionType.OUT_TRANSITION:
        return 'out-transition'
      case TransitionType.NO_TRANSITION:
      default:
        return 'normal'
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
        maximumLookaheadSearchDistance:
            mongoStudio.mappings[mapping].lookaheadMaxSearchDistance ?? defaultLookaheadDistance,
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
        console.log(`### Warning: Found unknown number for LookAhead: ${lookAheadNumber}`)
        // TODO: Throw error. Currently we have some misconfiguration that uses an outdated lookAhead mode
        // throw new UnsupportedOperation(`Found unknown number for LookAhead: ${lookAheadNumber}`)
        return LookaheadMode.NONE
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

  public convertActionManifest(mongoActionManifest: MongoActionManifest): ActionManifest {
    return {
      actionId: mongoActionManifest.actionId,
      data: mongoActionManifest.userData,
    }
  }

  public convertMedia(mongoMedia: MongoMedia): Media {
    return {
      id: mongoMedia.mediaId,
      duration: mongoMedia.mediainfo.format.duration
    }
  }
}
