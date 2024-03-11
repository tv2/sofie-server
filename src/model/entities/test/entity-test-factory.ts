import { Rundown, RundownInterface } from '../rundown'
import { Segment, SegmentInterface } from '../segment'
import { Part, PartInterface } from '../part'
import { Piece, PieceInterface } from '../piece'
import { PieceLifespan } from '../../enums/piece-lifespan'
import { Device } from '../device'
import { StatusCode } from '../../enums/status-code'
import { StatusMessage } from '../status-message'

export class EntityTestFactory {
  public static createRundown(rundownInterface: Partial<RundownInterface> = {}): Rundown {
    return new Rundown({
      id: 'rundownId' + Math.floor(Math.random() * 1000),
      name: 'rundownName',
      segments: [],
      mode: false,
      modifiedAt: Date.now(),
      ...rundownInterface
    } as RundownInterface)
  }

  public static createSegment(segmentInterface: Partial<SegmentInterface> = {}): Segment {
    return new Segment(
      {
        id: 'segmentId' + Math.floor(Math.random() * 1000),
        rundownId: 'rundownId',
        name: 'segmentName',
        isNext: false,
        isOnAir: false,
        parts: [],
        ...segmentInterface
      } as SegmentInterface)
  }

  public static createPart(partInterface: Partial<PartInterface> = {}): Part {
    return new Part({
      id: 'partId' + Math.floor(Math.random() * 1000),
      segmentId: 'segmentId',
      name: 'partName',
      isNext: false,
      isOnAir: false,
      ingestedPart: {},
      pieces: [],
      ...partInterface
    } as PartInterface)
  }

  public static createPiece(pieceInterface: Partial<PieceInterface> = {}): Piece {
    return new Piece({
      id: 'pieceId' + Math.floor(Math.random() * 1000),
      partId: 'partId',
      name: 'pieceName',
      duration: 420,
      start: 0,
      pieceLifespan: PieceLifespan.WITHIN_PART,
      ...pieceInterface
    } as PieceInterface)
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
}
