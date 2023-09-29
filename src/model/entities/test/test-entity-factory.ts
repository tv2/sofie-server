import { Rundown, RundownInterface } from '../rundown'
import { Segment, SegmentInterface } from '../segment'
import { Part, PartInterface } from '../part'
import { Piece, PieceInterface } from '../piece'

export class TestEntityFactory {
  public static createRundown(rundownInterface: Partial<RundownInterface> = {}): Rundown {
    return new Rundown({
      id: 'rundownId' + Math.floor(Math.random()*1000),
      name: 'rundownName',
      segments: [],
      isRundownActive: false,
      modifiedAt: Date.now(),
      ...rundownInterface
    } as RundownInterface)
  }

  public static createSegment(segmentInterface: Partial<SegmentInterface> = {}): Segment {
    return new Segment(
      {
        id: 'segmentId' + Math.floor(Math.random()*1000),
        rundownId: 'rundownId',
        name: 'segmentName',
        isNext: false,
        isOnAir: false,
        rank: 666,
        parts: [],
        ...segmentInterface
      } as SegmentInterface)
  }

  public static createPart(partInterface: Partial<PartInterface> = {}): Part {
    return new Part({
      id: 'partId' + Math.floor(Math.random()*1000),
      segmentId: 'segmentId',
      rank: 666,
      name: 'parrrrtName',
      isNext: false,
      isOnAir:false,
      pieces: [],
      ...partInterface
    } as PartInterface)
  }

  public static createPiece(pieceInterface: Partial<PieceInterface> = {}): Piece {
    return new Piece({
      id: 'pieceId' + Math.floor(Math.random()*1000),
      partId: 'partId',
      name: 'pieceName',
      duration: 420,
      start: 0,
      ...pieceInterface
    } as PieceInterface)
  }
}