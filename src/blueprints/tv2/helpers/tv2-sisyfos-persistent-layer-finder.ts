import { Part } from '../../../model/entities/part'
import { Piece } from '../../../model/entities/piece'
import { Tv2PieceMetadata, Tv2SisyfosPersistenceMetadata } from '../value-objects/tv2-meta-data'

export class Tv2SisyfosPersistentLayerFinder {
  public findLayersToPersist(
    part: Part,
    time: number | undefined,
    layersWantingToPersistFromPreviousPart: string[] = []
  ): string[] {
    time ??= Date.now()

    const piecesWithSisyfosMetadata: Piece[] = this.findPiecesWithSisyfosMetadata(part)
    const lastPlayingPiece: Piece | undefined = this.findLastPlayingPiece(
      piecesWithSisyfosMetadata,
      part.getExecutedAt(),
      time
    )

    // TODO: Does this work? Test it
    if (!lastPlayingPiece) {
      return []
    }

    // .findPieceWithSisyfosMetadata() has already filtered all Pieces without SisyfosPersistenceMetadata away, so we know it's not undefined.
    const lastPlayingPieceMetadata: Tv2SisyfosPersistenceMetadata = (lastPlayingPiece.metadata as Tv2PieceMetadata)
      .sisyfosPersistMetaData!

    if (!lastPlayingPieceMetadata.wantsToPersistAudio) {
      return []
    }

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
      (previous: Piece | undefined, current: Piece) => !previous || previous.start <= current.start ? current : previous,
      undefined
    )
  }

  private isPiecePlaying(piece: Piece, partExecutedAt: number, time: number): boolean {
    // TODO: Verify this condition - It's found in Blueprints in onTimelineGenerate.ts line 264
    const hasPieceStoppedPlaying: boolean =
      piece.duration > 0 && piece.start + piece.duration + partExecutedAt <= time
    return !hasPieceStoppedPlaying
  }
}
