import { BlueprintGetEndStateForPart } from '../../model/value-objects/blueprint'
import { RundownPersistentState } from '../../model/value-objects/rundown-persistent-state'
import { Part } from '../../model/entities/part'
import { PartEndState } from '../../model/value-objects/part-end-state'
import { Tv2PartEndState } from './value-objects/tv2-part-end-state'
import { Tv2RundownPersistentState } from './value-objects/tv2-rundown-persistent-state'
import { Tv2TallyTags } from './value-objects/tv2-tally-tags'
import { Tv2GraphicsContent } from './value-objects/tv2-content'
import { Tv2SisyfosPersistentLayerFinder } from './helpers/tv2-sisyfos-persistent-layer-finder'
import { Tv2SisyfosPersistenceMetadata } from './value-objects/tv2-meta-data'

/*
 Disclaimer: The code in this file is almost a 1 to 1 copy of the code of the corresponding implementations in Blueprints.
 Minimal effort has been put into refactoring it - only to the extent that it works with the new data model of SofieServer.
 */
export class Tv2EndStateForPartCalculator implements BlueprintGetEndStateForPart {
  constructor(private readonly sisyfosPersistentLayerFinder: Tv2SisyfosPersistentLayerFinder) {}

  public getEndStateForPart(
    part: Part,
    previousPart: Part | undefined,
    time: number,
    rundownPersistentState: RundownPersistentState | undefined
  ): PartEndState {
    const endState: Tv2PartEndState = {
      sisyfosPersistenceMetadata: {
        sisyfosLayers: [],
      }
    }

    // Blueprints finds all "active" Pieces, but the way it does it by saying Piece.start < time
    // where Piece.start is often 0 or how many milliseconds it should be taken after the Part begins
    // and where time is the epoch timestamp of Date.now()
    // so this basically evaluates to all Pieces always being "active"
    // which means we can just do Part.getPieces()

    const previousPersistentState: Tv2RundownPersistentState = (rundownPersistentState ?? this.getEmptyTv2RundownPersistentState()) as Tv2RundownPersistentState
    const previousPartEndState: Tv2PartEndState | undefined = previousPart?.getEndState() as
			| Tv2PartEndState
			| undefined

    endState.sisyfosPersistenceMetadata = this.calculateSisyfosPersistenceMetaData(
      part,
      previousPartEndState,
      time,
      previousPersistentState
    )

    for (const piece of part.getPieces()) {
      if (piece.tags.includes(Tv2TallyTags.JINGLE_IS_LIVE)) {
        endState.isJingle = true
      }
      if (piece.tags.includes(Tv2TallyTags.FULL_IS_LIVE)) {
        endState.fullFileName = (piece.content as Tv2GraphicsContent).fileName
      }
    }

    // TODO: Implement "getServerPositionForPartInstance()"

    return endState
  }

  private getEmptyTv2RundownPersistentState(): Tv2RundownPersistentState {
    return {
      activeMediaPlayerSessions: [],
      isNewSegment: false
    }
  }

  private calculateSisyfosPersistenceMetaData(
    part: Part,
    previousPartEndState: Tv2PartEndState | undefined,
    time: number,
    rundownPersistentState: Tv2RundownPersistentState
  ): Tv2SisyfosPersistenceMetadata {
    const layersWantingToPersist: string[] = this.findLayersWantingToPersist(rundownPersistentState, previousPartEndState)
    const pieceMetaData: Tv2SisyfosPersistenceMetadata | undefined = this.sisyfosPersistentLayerFinder.findLastPlayingPieceMetaData(part, time)
    return {
      sisyfosLayers: pieceMetaData?.wantsToPersistAudio
        ? this.sisyfosPersistentLayerFinder.findLayersToPersistForPieceMetaData(pieceMetaData, layersWantingToPersist)
        : []
    }
  }

  private findLayersWantingToPersist(rundownPersistentState: Tv2RundownPersistentState, previousPartEndState: Tv2PartEndState | undefined): string[] {
    return !rundownPersistentState.isNewSegment &&
    previousPartEndState &&
    previousPartEndState.sisyfosPersistenceMetadata
      ? previousPartEndState.sisyfosPersistenceMetadata.sisyfosLayers
      : []
  }
}
