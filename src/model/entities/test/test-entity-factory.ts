import { Rundown, RundownInterface } from '../rundown'
import { Segment, SegmentInterface } from '../segment'
import { Part, PartInterface } from '../part'
import { Piece, PieceInterface } from '../piece'

export class TestEntityFactory {
  public static createRundown(rundownInterface: Partial<RundownInterface> = {}): Rundown {
    return new Rundown({
      id: rundownInterface.id ?? 'rundownId' + Math.floor(Math.random()*1000),
      name: rundownInterface.name ?? 'rundownName',
      segments: rundownInterface.segments ?? []
    } as RundownInterface)
  }

  public static createSegment(segmentInterface: Partial<SegmentInterface> = {}): Segment {
    return new Segment(
      {
        id: segmentInterface.id ?? 'segmentId' + Math.floor(Math.random()*1000),
        rundownId: segmentInterface.rundownId ?? 'rundownId'
      } as SegmentInterface)
  }

  public static createPart(partInterface: Partial<PartInterface> = {}): Part {
    return new Part({
      id: partInterface.id ?? 'partId' + Math.floor(Math.random()*1000),
      segmentId: partInterface.segmentId ?? 'segmentId'
    } as PartInterface)
  }

  public static createPiece(pieceInterface: Partial<PieceInterface> = {}): Piece {
    return new Piece({
      id: pieceInterface.id ?? 'pieceId' + Math.floor(Math.random()*1000),
      partId: pieceInterface.partId ?? 'partId'
    } as PieceInterface)
  }
}