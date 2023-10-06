import { SegmentDto } from './segment-dto'
import { Rundown } from '../../model/entities/rundown'
import { PieceDto } from './piece-dto'
import { RundownCursor } from '../../model/value-objects/rundown-cursor'

interface Cursor {
  partId: string
  segmentId: string
}

export class RundownDto {
  // TODO: Tmp display cursors for debug
  public activeCursor: Cursor
  public nextCursor: Cursor


  public readonly id: string
  public readonly name: string
  public readonly isActive: boolean
  public readonly modifiedAt: number
  public readonly infinitePieces: PieceDto[]
  public readonly segments: SegmentDto[]

  constructor(rundown: Rundown) {
    this.activeCursor = this.convertCursor(rundown.getActiveCursor())
    this.nextCursor = this.convertCursor(rundown.getNextCursor())
    this.id = rundown.id
    this.name = rundown.name
    this.isActive = rundown.isActive() ?? false
    this.modifiedAt = rundown.getLastTimeModified()
    this.infinitePieces = rundown.getInfinitePieces().map((piece) => new PieceDto(piece))
    this.segments = rundown.getSegments().map((segment) => new SegmentDto(segment))
  }

  private convertCursor(cursor?: RundownCursor): Cursor {
    return {
      partId: cursor?.part.id ?? '',
      segmentId: cursor?.segment.id ?? ''
    }
  }
}
