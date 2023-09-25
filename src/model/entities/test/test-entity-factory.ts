import { Rundown, RundownInterface } from '../rundown'
import { Segment, SegmentInterface } from '../segment'
import { Part, PartInterface } from '../part'
import { Piece, PieceInterface } from '../piece'

export class TestEntityFactory {
  public static createRundown(rundownInterface?: Partial<RundownInterface>): Rundown {
    if (!rundownInterface) {
      rundownInterface = {} as RundownInterface
    }

    return new Rundown({
      id: rundownInterface.id ?? 'rundownId' + Math.floor(Math.random()*1000),
      name: rundownInterface.name ?? 'rundownName',
      segments: rundownInterface.segments ?? []
    } as RundownInterface)
  }

  public static createSegment(segmentInterface?: Partial<SegmentInterface>): Segment {
    if (!segmentInterface) {
      segmentInterface = {} as SegmentInterface
    }

    return new Segment(
      {
        id: segmentInterface.id ?? 'segmentId' + Math.floor(Math.random()*1000),
        rundownId: segmentInterface.rundownId ?? 'rundownId'
      } as SegmentInterface)
  }

  public static createPart(partInterface?: Partial<PartInterface>): Part {
    if (!partInterface) {
      partInterface = {} as PartInterface
    }

    return new Part({
      id: partInterface.id ?? 'partId' + Math.floor(Math.random()*1000),
      segmentId: partInterface.segmentId ?? 'segmentId'
    } as PartInterface)
  }

  public static createPiece(pieceInterface?: Partial<PieceInterface>): Piece {
    if (!pieceInterface) {
      pieceInterface = {} as PieceInterface
    }

    return new Piece({
      id: pieceInterface.id ?? 'pieceId' + Math.floor(Math.random()*1000),
      partId: pieceInterface.partId ?? 'partId'
    } as PieceInterface)
  }
}