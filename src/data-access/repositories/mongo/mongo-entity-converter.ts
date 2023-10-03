import { Rundown, RundownAlreadyActiveProperties } from '../../../model/entities/rundown'
import { Segment } from '../../../model/entities/segment'
import { Part } from '../../../model/entities/part'
import { Piece } from '../../../model/entities/piece'
import { PieceType } from '../../../model/enums/piece-type'
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

export interface MongoRundown {
  _id: string
  name: string
  modified: number
  isActive?: boolean // TODO: Remove optionality when we have control over data structure.
  persistentState?: unknown,
  activeCursor: MongoRundownCursor,
  nextCursor: MongoRundownCursor
}

interface MongoRundownCursor {
  partId: string,
  segmentId: string,
  owner: Owner
}

export interface MongoSegment {
  _id: string
  name: string
  _rank: number
  rundownId: string
  externalId: string
  isHidden: boolean
  isOnAir: boolean
  isNext: boolean
  budgetDuration?: number
}

export interface MongoPart {
  _id: string
  segmentId: string
  title: string
  _rank: number
  isPlanned: boolean
  expectedDuration: number
  isOnAir: boolean
  isNext: boolean
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
  endState?: unknown
}

export interface MongoPiece {
  _id: string
  startPartId: string
  name: string
  sourceLayerId: string
  enable: {
    start: number | string
    duration: number
  }
  prerollDuration: number
  postrollDuration: number
  timelineObjectsString: string
  lifespan: string
  pieceType: string
  isPlanned?: boolean
  metaData?: unknown // This is called "metaData" in the database, so we have to keep the spelling like this.
  content?: unknown
  tags?: string[]
}

export interface MongoTimeline {
  _id: string
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

interface MongoLayerMapping {
  // Which Lookahead "mode" we are in.
  lookahead: number
  // The minimum number of lookahead objects to find.
  lookaheadDepth: number
  // The maximum distance to search for lookahead
  lookaheadMaxSearchDistance: number
}

export class MongoEntityConverter {
  public convertRundown(mongoRundown: MongoRundown, segments: Segment[], baselineTimelineObjects?: TimelineObject[]): Rundown {
    let alreadyActiveProperties: RundownAlreadyActiveProperties | undefined
    if (mongoRundown.isActive) {
      alreadyActiveProperties = {
        activeCursor: this.convertMongoRundownCursorToRundownCursor(mongoRundown.activeCursor, segments),
        nextCursor: this.convertMongoRundownCursorToRundownCursor(mongoRundown.nextCursor, segments),
        infinitePieces: new Map<string, Piece>() // TODO: Save and populate - Pieces are currently not being saved
      }
    }
    return new Rundown({
      id: mongoRundown._id,
      name: mongoRundown.name,
      isRundownActive: mongoRundown.isActive ?? false,
      baselineTimelineObjects: baselineTimelineObjects ?? [],
      segments,
      modifiedAt: mongoRundown.modified,
      persistentState: mongoRundown.persistentState,
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

  public convertToMongoRundown(rundown: Rundown): MongoRundown {
    return {
      _id: rundown.id,
      name: rundown.name,
      isActive: rundown.isActive(),
      persistentState: rundown.getPersistentState(),
      activeCursor: this.convertRundownCursorToMongoRundownCursor(rundown.getActiveCursor()),
      nextCursor: this.convertRundownCursorToMongoRundownCursor(rundown.getNextCursor())
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
      isOnAir: false,
      isNext: false,
      parts: [],
      budgetDuration: mongoSegment.budgetDuration ?? undefined, // Ensure that null values are stripped
    })
  }

  public convertSegments(mongoSegments: MongoSegment[]): Segment[] {
    return mongoSegments.filter((segment) => !segment.isHidden).map(this.convertSegment.bind(this))
  }

  public convertToMongoSegment(segment: Segment): MongoSegment {
    return {
      _id: segment.id,
      name: segment.name,
      rundownId: segment.rundownId,
      _rank: segment.rank,
      isOnAir: segment.isOnAir(),
      isNext: segment.isNext(),
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
      _rank: part.rank,
      isOnAir: part.isOnAir(),
      isNext: part.isNext(),
      endState: part.getEndState()
    } as MongoPart
  }

  public convertPiece(mongoPiece: MongoPiece): Piece {
    return new Piece({
      id: mongoPiece._id,
      partId: mongoPiece.startPartId,
      name: mongoPiece.name,
      layer: mongoPiece.sourceLayerId,
      type: PieceType.UNKNOWN,
      pieceLifespan: this.mapMongoPieceLifeSpan(mongoPiece.lifespan),
      isPlanned: mongoPiece.isPlanned ?? true,
      start: typeof mongoPiece.enable.start === 'number' ? mongoPiece.enable.start : 0,
      duration: mongoPiece.enable.duration,
      preRollDuration: mongoPiece.prerollDuration,
      postRollDuration: mongoPiece.prerollDuration,
      transitionType: this.mapMongoPieceTypeToTransitionType(mongoPiece.pieceType),
      timelineObjects: JSON.parse(mongoPiece.timelineObjectsString),
      metadata: mongoPiece.metaData,
      content: mongoPiece.content,
      tags: mongoPiece.tags ?? [],
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
}
