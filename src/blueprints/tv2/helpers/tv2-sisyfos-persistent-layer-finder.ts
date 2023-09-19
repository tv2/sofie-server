import { Part } from '../../../model/entities/part'
import { Piece } from '../../../model/entities/piece'
import { Tv2PieceMetaData, Tv2SisyfosPersistenceMetaData } from '../value-objects/tv2-meta-data'

export class Tv2SisyfosPersistentLayerFinder {
  public findLayersToPersist(
    part: Part,
    time: number | undefined,
    layersWantingToPersistFromPreviousPart: string[] = []
  ): string[] {
    const lastPlayingPieceMetaData: Tv2SisyfosPersistenceMetaData | undefined = this.findLastPlayingPieceMetaData(part, time)
    if (!lastPlayingPieceMetaData) {
      return []
    }
    return this.findLayersToPersistForPieceMetaData(lastPlayingPieceMetaData, layersWantingToPersistFromPreviousPart)
  }

  public findLastPlayingPieceMetaData(part: Part, time: number | undefined): Tv2SisyfosPersistenceMetaData | undefined {
    if (!time) {
      time = Date.now()
    }

    const piecesWithSisyfosMetaData: Piece[] = this.findPiecesWithSisyfosMetaData(part)
    const lastPlayingPiece: Piece | undefined = this.findLastPlayingPiece(
      piecesWithSisyfosMetaData,
      part.getExecutedAt(),
      time
    )

    if (!lastPlayingPiece) {
      return undefined
    }

    // .findPieceWithSisyfosMetaData() has already filtered all Pieces without SisyfosPersistenceMetaData away, so we know it's not undefined.
    return (lastPlayingPiece.metaData as Tv2PieceMetaData)
      .sisyfosPersistMetaData!
  }

  private findPiecesWithSisyfosMetaData(part: Part): Piece[] {
    return part.getPieces().filter((piece) => {
      if (!piece.metaData) {
        return
      }
      const metaData: Tv2PieceMetaData = piece.metaData as Tv2PieceMetaData
      return !!metaData.sisyfosPersistMetaData
    })
  }

  private findLastPlayingPiece(pieces: Piece[], partExecutedAt: number, time: number): Piece | undefined {
    const playingPieces: Piece[] = pieces.filter((piece) => {
      const hasPieceStoppedPlaying: boolean =
				piece.duration > 0 && piece.start + piece.duration + partExecutedAt <= time
      return !hasPieceStoppedPlaying
    })

    if (playingPieces.length <= 1) {
      return playingPieces[0]
    }

    return playingPieces.reduce((previous, current) => {
      return previous.start > current.start ? previous : current
    })
  }

  public findLayersToPersistForPieceMetaData(lastPlayingPieceMetaData: Tv2SisyfosPersistenceMetaData, layersWantingToPersistFromPreviousPart: string[]): string[] {
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
