import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { TransitionType } from '../../../model/enums/transition-type'
import { PartTimings } from '../../../model/value-objects/part-timings'
import { IngestedPiece } from '../../../model/entities/ingested-piece'
import { IngestedPart } from '../../../model/entities/ingested-part'
import { IngestedSegment } from '../../../model/entities/ingested-segment'
import { IngestedRundown } from '../../../model/entities/ingested-rundown'
import {
  BackwardRundownTiming,
  ForwardRundownTiming,
  RundownTiming,
  UnscheduledRundownTiming
} from '../../../model/value-objects/rundown-timing'
import { RundownTimingType } from '../../../model/enums/rundown-timing-type'
import { MongoId } from './mongo-entity-converter'

export interface MongoIngestedRundown extends MongoId {
  name: string
  showStyleVariantId: string
  modified: number
  timing: MongoIngestedRundownTiming
}

enum MongoRundownTimingType { // PlaylistTimingType from blueprints-integration
  FORWARD = 'forward-time',
  BACKWARD = 'back-time',
  UNSCHEDULED = 'none',
}

type MongoIngestedRundownTiming = MongoForwardRundownTiming | MongoBackwardRundownTiming | MongoUnscheduledRundownTiming

interface MongoForwardRundownTiming { // PlaylistTimingForwardTime from blueprints-integration
  type: MongoRundownTimingType.FORWARD
  expectedStart: number
  expectedDuration?: number
  expectedEnd?: number
}

interface MongoBackwardRundownTiming { // PlaylistTimingBackTime from blueprints-integration
  type: MongoRundownTimingType.BACKWARD
  expectedStart?: number
  expectedDuration?: number
  expectedEnd: number
}

interface MongoUnscheduledRundownTiming { // PlaylistTimingNone from blueprints-integration
  type: MongoRundownTimingType.UNSCHEDULED
  expectedDuration?: number
}

export interface MongoIngestedSegment extends MongoId {
  name: string
  _rank: number
  rundownId: string
  externalId: string
  isHidden: boolean
  identifier?: string
  metaData?: unknown // This is the current spelling in the database from Core... TOD: Update when we control Ingest
  budgetDuration?: number
  invalidity?: { reason: string }
  definesShowStyleVariant?: boolean
}

export interface MongoIngestedPart extends MongoId {
  segmentId: string
  rundownId: string
  title: string
  _rank: number
  isPlanned: boolean
  expectedDuration: number
  isOnAir: boolean
  isNext: boolean
  isUnsynced?: boolean
  untimed: boolean
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
}

export interface MongoIngestedPiece extends MongoId {
  startPartId: string
  startRundownId: string
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

export class MongoIngestedEntityConverter {

  public convertToIngestedRundown(mongoRundown: MongoIngestedRundown): IngestedRundown {
    return {
      id: mongoRundown._id,
      name: mongoRundown.name,
      showStyleVariantId: mongoRundown.showStyleVariantId,
      baselineTimelineObjects: [],
      ingestedSegments: [],
      modifiedAt: mongoRundown.modified,
      timings: this.convertToRundownTiming(mongoRundown.timing)
    }
  }

  private convertToRundownTiming(mongoRundownTiming: MongoIngestedRundownTiming): RundownTiming {
    switch (mongoRundownTiming?.type) {
      case MongoRundownTimingType.UNSCHEDULED:
        return this.convertToUnscheduledRundownTiming(mongoRundownTiming)
      case MongoRundownTimingType.FORWARD:
        return this.convertToForwardRundownTiming(mongoRundownTiming)
      case MongoRundownTimingType.BACKWARD:
        return this.convertToBackwardRundownTiming(mongoRundownTiming)
    }
  }

  private convertToUnscheduledRundownTiming(mongoUnscheduledRundownTiming: MongoUnscheduledRundownTiming): UnscheduledRundownTiming {
    return {
      type: RundownTimingType.UNSCHEDULED,
      expectedDurationInMs: mongoUnscheduledRundownTiming.expectedDuration,
    }
  }

  private convertToForwardRundownTiming(mongoForwardRundownTiming: MongoForwardRundownTiming): ForwardRundownTiming {
    return {
      type: RundownTimingType.FORWARD,
      expectedStartEpochTime: mongoForwardRundownTiming.expectedStart,
      expectedDurationInMs: mongoForwardRundownTiming.expectedDuration,
      expectedEndEpochTime: mongoForwardRundownTiming.expectedEnd
    }
  }

  private convertToBackwardRundownTiming(mongoBackwardRundownTiming: MongoBackwardRundownTiming): BackwardRundownTiming {
    return {
      type: RundownTimingType.BACKWARD,
      expectedStartEpochTime: mongoBackwardRundownTiming.expectedStart,
      expectedDurationInMs: mongoBackwardRundownTiming.expectedDuration,
      expectedEndEpochTime: mongoBackwardRundownTiming.expectedEnd
    }
  }

  public convertToIngestedSegment(mongoSegment: MongoIngestedSegment): IngestedSegment {
    return {
      id: mongoSegment._id,
      rundownId: mongoSegment.rundownId,
      name: mongoSegment.name,
      rank: mongoSegment._rank,
      isHidden: mongoSegment.isHidden,
      referenceTag: mongoSegment.identifier,
      metadata: mongoSegment.metaData,
      ingestedParts: [],
      budgetDuration: mongoSegment.budgetDuration ?? undefined,
      invalidity: mongoSegment.invalidity,
      definesShowStyleVariant: mongoSegment.definesShowStyleVariant
    }
  }

  public convertToIngestedSegments(mongoSegments: MongoIngestedSegment[]): IngestedSegment[] {
    return mongoSegments
      .map(this.convertToIngestedSegment)
  }

  public convertToIngestedPart(mongoPart: MongoIngestedPart): IngestedPart {
    return {
      id: mongoPart._id,
      segmentId: mongoPart.segmentId,
      rundownId: mongoPart.rundownId,
      name: mongoPart.title,
      rank: mongoPart._rank,
      expectedDuration: mongoPart.expectedDuration,
      ingestedPieces: [],
      inTransition: {
        keepPreviousPartAliveDuration: mongoPart.inTransition?.previousPartKeepaliveDuration ?? 0,
        delayPiecesDuration: mongoPart.inTransition?.partContentDelayDuration ?? 0,
      },
      outTransition: {
        keepAliveDuration: mongoPart.outTransition?.duration ?? 0,
      },
      autoNext: mongoPart.autoNext ? { overlap: mongoPart.autoNextOverlap } : undefined,
      disableNextInTransition: mongoPart.disableNextInTransition,
      isUntimed: mongoPart.untimed ?? false,
      timings: mongoPart.timings,
    }
  }

  public convertToIngestedParts(mongoParts: MongoIngestedPart[]): IngestedPart[] {
    return mongoParts.map(this.convertToIngestedPart)
  }

  public convertToIngestedPiece(mongoPiece: MongoIngestedPiece): IngestedPiece {
    return {
      id: mongoPiece._id,
      partId: mongoPiece.startPartId,
      name: mongoPiece.name,
      layer: mongoPiece.sourceLayerId,
      pieceLifespan: this.mapMongoPieceLifespanToPieceLifespan(mongoPiece.lifespan),
      start: typeof mongoPiece.enable.start === 'number' ? mongoPiece.enable.start : 0,
      duration: mongoPiece.enable.duration ?? undefined,
      preRollDuration: mongoPiece.prerollDuration,
      postRollDuration: mongoPiece.postrollDuration,
      transitionType: this.mapMongoPieceTypeToTransitionType(mongoPiece.pieceType),
      timelineObjects: JSON.parse(mongoPiece.timelineObjectsString),
      metadata: mongoPiece.metaData,
      content: mongoPiece.content,
    }
  }

  private mapMongoPieceLifespanToPieceLifespan(mongoPieceLifespan: string): PieceLifespan {
    switch (mongoPieceLifespan) {
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

  public convertToIngestedPieces(mongoPieces: MongoIngestedPiece[]): IngestedPiece[] {
    return mongoPieces.map((mongoPiece) => this.convertToIngestedPiece(mongoPiece))
  }
}
