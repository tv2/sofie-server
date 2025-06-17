import { Part } from '../../../rundown-execution/domain/entities/part'
import { Piece } from '../../../rundown-execution/domain/entities/piece'
import { PieceMetadata, SisyfosPersistenceMetadata } from '../../../rundown-execution/domain/value-objects/metadata'

export class Tv2SisyfosPersistentLayerFinder {
  public findLayersToPersist(
    part: Part,
    time: number | undefined,
    layersWantingToPersistFromPreviousPart: string[] = []
  ): string[] {
    const lastPlayingPieceMetadata: SisyfosPersistenceMetadata | undefined = this.findLastPlayingPieceMetadata(part, time)
    if (!lastPlayingPieceMetadata) {
      return []
    }
    return this.findLayersToPersistForPieceMetadata(lastPlayingPieceMetadata, layersWantingToPersistFromPreviousPart)
  }

  public findLastPlayingPieceMetadata(part: Part, time: number | undefined): SisyfosPersistenceMetadata | undefined {
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

    return lastPlayingPiece.metadata.sisyfosPersistMetaData
  }

  private findPiecesWithSisyfosMetadata(part: Part): Piece[] {
    return part.getPieces().filter((piece) => {
      if (!piece.metadata) {
        return false
      }
      const metadata: PieceMetadata = piece.metadata as PieceMetadata
      return !!metadata.sisyfosPersistMetaData
    })
  }

  private findLastPlayingPiece(pieces: Piece[], partExecutedAt: number, time: number): Piece | undefined {
    const playingPieces: Piece[] = pieces.filter(piece => this.isPiecePlaying(piece, partExecutedAt, time))
    return playingPieces.reduce(
      (previous: Piece | undefined, current: Piece) => !previous || previous.getStart() <= current.getStart() ? current : previous,
      undefined
    )
  }

  private isPiecePlaying(piece: Piece, partExecutedAt: number, time: number): boolean {
    const hasPieceStoppedPlaying: boolean = piece.getDuration()
      ? piece.getStart() + piece.getDuration()! + partExecutedAt <= time
      : false
    return !hasPieceStoppedPlaying
  }

  public findLayersToPersistForPieceMetadata(lastPlayingPieceMetadata: SisyfosPersistenceMetadata, layersWantingToPersistFromPreviousPart: string[]): string[] {
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
