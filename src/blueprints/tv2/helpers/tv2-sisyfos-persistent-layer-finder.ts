import { Part } from '../../../model/entities/part'
import { Piece } from '../../../model/entities/piece'
import { Tv2PieceMetadata, Tv2SisyfosPersistenceMetadata } from '../value-objects/tv2-meta-data'

export class Tv2SisyfosPersistentLayerFinder {
  public findLayersToPersist(
    part: Part,
    time: number | undefined,
    layersWantingToPersistFromPreviousPart: string[] = []
  ): string[] {
    const lastPlayingPieceMetaData: Tv2SisyfosPersistenceMetadata | undefined = this.findLastPlayingPieceMetaData(part, time)
    if (!lastPlayingPieceMetaData) {
      return []
    }
    return this.findLayersToPersistForPieceMetaData(lastPlayingPieceMetaData, layersWantingToPersistFromPreviousPart)
  }

  public findLastPlayingPieceMetaData(part: Part, time: number | undefined): Tv2SisyfosPersistenceMetadata | undefined {
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

    if (playingPieces.length <= 1) {
      return playingPieces[0]
    }

    return playingPieces.reduce((previous, current) => {
      return previous.start > current.start ? previous : current
    })
  }

  private isPiecePlaying(piece: Piece, partExecutedAt: number, time: number): boolean {
    // TODO: Verify this condition - It's found in Blueprints in onTimelineGenerate.ts line 264
    const hasPieceStoppedPlaying: boolean =
      piece.duration > 0 && piece.start + piece.duration + partExecutedAt <= time
    return !hasPieceStoppedPlaying
  }

  public findLayersToPersistForPieceMetaData(lastPlayingPieceMetaData: Tv2SisyfosPersistenceMetadata, layersWantingToPersistFromPreviousPart: string[]): string[] {
    if (!lastPlayingPieceMetaData.acceptsPersistedAudio) {
      return lastPlayingPieceMetaData.sisyfosLayers
    }

    const layersToPersist: string[] = [...lastPlayingPieceMetaData.sisyfosLayers]
    if (!lastPlayingPieceMetaData.isModifiedOrInsertedByAction) {
      layersToPersist.push(...layersWantingToPersistFromPreviousPart)
    } else if (lastPlayingPieceMetaData.previousSisyfosLayers) {
      layersToPersist.push(...lastPlayingPieceMetaData.previousSisyfosLayers)
    }

    return Array.from(new Set(layersToPersist))
  }
}
