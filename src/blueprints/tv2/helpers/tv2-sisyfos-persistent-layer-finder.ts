import { Part } from '../../../model/entities/part'
import { Piece } from '../../../model/entities/piece'
import { Tv2PieceMetadata, Tv2SisyfosPersistenceMetadata } from '../value-objects/tv2-metadata'

export class Tv2SisyfosPersistentLayerFinder {
  public findLayersToPersist(
    part: Part,
    time: number | undefined,
    layersWantingToPersistFromPreviousPart: string[] = []
  ): string[] {
    const lastPlayingPieceMetadata: Tv2SisyfosPersistenceMetadata | undefined = this.findLastPlayingPieceMetadata(part, time)
    if (!lastPlayingPieceMetadata) {
      return []
    }
    return this.findLayersToPersistForPieceMetadata(lastPlayingPieceMetadata, layersWantingToPersistFromPreviousPart)
  }

  public findLastPlayingPieceMetadata(part: Part, time: number | undefined): Tv2SisyfosPersistenceMetadata | undefined {
    time ??= Date.now()

    const piecesWithSisyfosMetadata: Piece[] = this.findPiecesWithSisyfosMetadata(part)
    const lastPlayingPiece: Piece | undefined = this.findLastPlayingPiece(
      piecesWithSisyfosMetadata,
      part.getExecutedAt(),
      time
    )

    if (!lastPlayingPiece) {
      return undefined
    }

    // .findPieceWithSisyfosMetadata() has already filtered all Pieces without SisyfosPersistenceMetadata away, so we know it's not undefined.
    return (lastPlayingPiece.metadata as Tv2PieceMetadata)
      .sisyfosPersistMetaData!
  }

  private findPiecesWithSisyfosMetadata(part: Part): Piece[] {
    return part.getPieces().filter((piece) => {
      if (!piece.metadata) {
        return false
      }
      const metadata: Tv2PieceMetadata = piece.metadata as Tv2PieceMetadata
      return !!metadata.sisyfosPersistMetaData
    })
  }

  private findLastPlayingPiece(pieces: Piece[], partExecutedAt: number, time: number): Piece | undefined {
    const playingPieces: Piece[] = pieces.filter((piece) => this.isPiecePlaying(piece, partExecutedAt, time))
    return playingPieces.reduce(
      (previous: Piece | undefined, current: Piece) => !previous || previous.getStart() <= current.getStart() ? current : previous,
      undefined
    )
  }

  private isPiecePlaying(piece: Piece, partExecutedAt: number, time: number): boolean{
    const hasPieceStoppedPlaying: boolean = piece.duration
      ? (piece.duration > 0 && piece.getStart() + piece.duration + partExecutedAt <= time)
      : false
    return !hasPieceStoppedPlaying

  }

  public findLayersToPersistForPieceMetadata(lastPlayingPieceMetadata: Tv2SisyfosPersistenceMetadata, layersWantingToPersistFromPreviousPart: string[]): string[] {
    if (!lastPlayingPieceMetadata.acceptsPersistedAudio) {
      return lastPlayingPieceMetadata.sisyfosLayers
    }

    const layersToPersist: string[] = [...lastPlayingPieceMetadata.sisyfosLayers]
    if (!lastPlayingPieceMetadata.isModifiedOrInsertedByAction) {
      layersToPersist.push(...layersWantingToPersistFromPreviousPart)
    } else if (lastPlayingPieceMetadata.previousSisyfosLayers) {
      layersToPersist.push(...lastPlayingPieceMetadata.previousSisyfosLayers)
    }

    return Array.from(new Set(layersToPersist))
  }
}
