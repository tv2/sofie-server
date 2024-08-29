import { Rundown, RundownInterface } from '../rundown'
import { Segment, SegmentInterface } from '../segment'
import { Part, PartInterface } from '../part'
import { Piece, PieceInterface } from '../piece'
import { PieceLifespan } from '../../enums/piece-lifespan'
import { StatusCode } from '../../enums/status-code'
import { StatusMessage } from '../status-message'
import { RundownMode } from '../../enums/rundown-mode'
import { RundownTimingType } from '../../enums/rundown-timing-type'
import { Device } from '../device'
import { DeviceType } from '../../enums/device-type'
import { TransitionType } from '../../enums/transition-type'
import { ActionManifest } from '../action'
import { IngestedPart } from '../ingested-part'
import { IngestedPiece } from '../ingested-piece'

export class EntityTestFactory {
  public static createRundown(rundownInterface: Partial<RundownInterface> = {}): Rundown {
    return new Rundown({
      id: 'rundownId' + Math.floor(Math.random() * 1000),
      name: 'rundownName',
      segments: [],
      mode: RundownMode.INACTIVE,
      modifiedAt: Date.now(),
      showStyleVariantId: 'showstyle-variant-id',
      baselineTimelineObjects: [],
      history: [],
      timing: { type: RundownTimingType.UNSCHEDULED },
      ...rundownInterface
    })
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

  public static createPart(partInterface: Partial<PartInterface> = {}): Part {
    return new Part({
      disableNextInTransition: false,
      inTransition: {
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
    })
  }

  public static createIngestedPart(ingestedPart: Partial<IngestedPart> = {}): IngestedPart {
    return {
      disableNextInTransition: false,
      id: '',
      inTransition: {
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
    return new Piece({
      id: 'pieceId' + Math.floor(Math.random() * 1000),
      partId: 'partId',
      layer: 'some_layer',
      name: 'pieceName',
      start: 0,
      pieceLifespan: PieceLifespan.WITHIN_PART,
      isPlanned: false,
      preRollDuration: 0,
      postRollDuration: 0,
      transitionType: TransitionType.NO_TRANSITION,
      timelineObjects: [],
      tags: [],
      isUnsynced: false,
      ...pieceInterface
    })
  }

  public static createIngestedPiece(ingestedPiece: Partial<IngestedPiece>): IngestedPiece {
    return {
      id: '',
      partId: '',
      name: '',
      start: 0,
      layer: '',
      duration: 0,
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
      type: DeviceType.ABSTRACT,
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
