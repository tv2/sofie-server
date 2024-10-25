import { Rundown, RundownInterface } from '../rundown'
import { Segment, SegmentInterface } from '../segment'
import { Part, PartInterface } from '../part'
import { Piece, PieceInterface } from '../piece'
import { PieceLifespan } from '../../enums/piece-lifespan'
import { Device } from '../device'
import { StatusCode } from '../../enums/status-code'
import { StatusMessage } from '../status-message'
import { RundownMode } from '../../enums/rundown-mode'
import { RundownTimingType } from '../../enums/rundown-timing-type'
import { TransitionType } from '../../enums/transition-type'
import { ActionManifest } from '../action'
import { IngestedPart } from '../ingested-part'
import { IngestedPiece } from '../ingested-piece'
import { IngestedRundown } from '../ingested-rundown'
import { IngestedSegment } from '../ingested-segment'

export class EntityTestFactory {
  public static createRundown(rundownInterface: Partial<RundownInterface> = {}): Rundown {
    return new Rundown(this.createRundownInterface(rundownInterface))
  }

  public static createRundownInterface(rundownInterface: Partial<RundownInterface> = {}): RundownInterface {
    return {
      id: 'rundownId' + Math.floor(Math.random() * 1000),
      name: 'rundownName',
      segments: [],
      mode: RundownMode.INACTIVE,
      modifiedAt: Date.now(),
      showStyleVariantId: 'show-style-variant-id',
      baselineTimelineObjects: [],
      history: [],
      timing: { type: RundownTimingType.UNSCHEDULED },
      ...rundownInterface,
    }
  }

  public static createIngestedRundown(ingestedRundown: Partial<IngestedRundown> = {}): IngestedRundown {
    return {
      id: 'rundownId' + Math.floor(Math.random() * 1000),
      name: 'rundownName',
      modifiedAt: Date.now(),
      showStyleVariantId: 'show-style-variant-id',
      timings: { type: RundownTimingType.UNSCHEDULED },
      ingestedSegments: [],
      baselineTimelineObjects: [],
      ...ingestedRundown
    }
  }

  public static createSegment(segmentInterface: Partial<SegmentInterface> = {}): Segment {
    return new Segment(
      {
        id: 'segmentId' + Math.floor(Math.random() * 1000),
        rundownId: 'rundownId',
        name: 'segmentName',
        isNext: false,
        definesShowStyleVariant: false,
        isHidden: false,
        isUnsynced: false,
        rank: 0,
        isOnAir: false,
        parts: [],
        ...segmentInterface,
      })
  }

  public static createIngestedSegment(ingestedSegment: Partial<IngestedSegment> = {}): IngestedSegment {
    return {
      id: 'segmentId' + Math.floor(Math.random() * 1000),
      rundownId: 'rundownId',
      name: 'segmentName',
      rank: 0,
      isHidden: false,
      ingestedParts: [],
      definesShowStyleVariant: false,
      ...ingestedSegment,
    }
  }

  public static createPart(partInterface: Partial<PartInterface> = {}): Part {
    return new Part(this.createPartInterface(partInterface))
  }

  public static createPartInterface(partInterface: Partial<PartInterface> = {}): PartInterface {
    return {
      disableNextInTransition: false,
      inTransition: {
        blockTakeDuration: 0,
        keepPreviousPartAliveDuration: 0,
        delayPiecesDuration: 0,
      },
      isUnsynced: false,
      isUntimed: false,
      outTransition: {
        keepAliveDuration: 0,
      },
      rank: 0,
      rundownId: '',
      id: 'partId' + Math.floor(Math.random() * 1000),
      segmentId: 'segmentId',
      name: 'partName',
      isNext: false,
      isOnAir: false,
      ingestedPart: this.createIngestedPart(),
      pieces: [],
      ...partInterface,
    }
  }

  public static createIngestedPart(ingestedPart: Partial<IngestedPart> = {}): IngestedPart {
    return {
      disableNextInTransition: false,
      id: 'partId' + Math.floor(Math.random() * 1000),
      inTransition: {
        blockTakeDuration: 0,
        keepPreviousPartAliveDuration: 0,
        delayPiecesDuration: 0,
      },
      ingestedPieces: [],
      isUntimed: false,
      name: '',
      outTransition: {
        keepAliveDuration: 0,
      },
      rank: 0,
      rundownId: '',
      segmentId: '',
      ...ingestedPart,
    }
  }

  public static createPiece(pieceInterface: Partial<PieceInterface> = {}): Piece {
    return new Piece(this.createPieceInterface(pieceInterface))
  }

  public static createPieceInterface(pieceInterface: Partial<PieceInterface> = {}): PieceInterface {
    return {
      id: 'pieceId' + Math.floor(Math.random() * 1000),
      partId: 'partId',
      rundownId: 'rundownId',
      layer: 'some_layer',
      name: 'pieceName',
      start: 0,
      pieceLifespan: PieceLifespan.WITHIN_PART,
      isPlanned: true,
      preRollDuration: 0,
      postRollDuration: 0,
      transitionType: TransitionType.NO_TRANSITION,
      timelineObjects: [],
      tags: [],
      isUnsynced: false,
      ...pieceInterface
    }
  }

  public static createIngestedPiece(ingestedPiece: Partial<IngestedPiece>): IngestedPiece {
    return {
      id: 'pieceId' + Math.floor(Math.random() * 1000),
      partId: 'partId',
      rundownId: 'rundownId',
      layer: 'some_layer',
      name: 'pieceName',
      start: 0,
      pieceLifespan: PieceLifespan.WITHIN_PART,
      transitionType: TransitionType.NO_TRANSITION,
      preRollDuration: 0,
      postRollDuration: 0,
      timelineObjects: [],
      ...ingestedPiece
    }
  }

  public static createDevice(device: Partial<Device> = {}): Device {
    return {
      id: 'deviceId',
      name: 'deviceName',
      statusCode: StatusCode.UNKNOWN,
      statusMessage: '',
      isConnected: false,
      ...device
    }
  }

  public static createStatusMessage(statusMessage: Partial<StatusMessage> = {}): StatusMessage {
    return {
      id: 'statusMessageId',
      title: 'statusMessageTitle',
      message: 'someMessage',
      statusCode: StatusCode.UNKNOWN,
      ...statusMessage
    }
  }

  public static createActionManifest<ActionManifestData>(actionManifest: Partial<ActionManifest> & { data: ActionManifestData }): ActionManifest<ActionManifestData> {
    return {
      actionId: `action-manifest-${process.hrtime.bigint()}`,
      rundownId: 'rundownId',
      ...actionManifest,
    }
  }
}
