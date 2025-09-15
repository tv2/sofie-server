import { BlueprintGetEndStateForPart } from '../../../rundown-execution/domain/value-objects/blueprint'
import { Part } from '../../../rundown-execution/domain/entities/part'
import { Tv2PartEndState } from '../value-objects/tv2-part-end-state'
import { Tv2TallyTags } from '../value-objects/tv2-tally-tags'
import { Tv2FileContent } from '../value-objects/tv2-content'
import { Tv2SisyfosPersistentLayerFinder } from './tv2-sisyfos-persistent-layer-finder'
import { SisyfosPersistenceMetadata } from '../../../rundown-execution/domain/value-objects/metadata'

/*
 Disclaimer: The code in this file is almost a 1 to 1 copy of the code of the corresponding implementations in Blueprints.
 Minimal effort has been put into refactoring it - only to the extent that it works with the new data model of AlbaServer.
 */
export class Tv2EndStateForPartService implements BlueprintGetEndStateForPart {
  public constructor(private readonly sisyfosPersistentLayerFinder: Tv2SisyfosPersistentLayerFinder) {}

  public getEndStateForPart(
    part: Part,
    previousPart: Part | undefined,
    time: number,
  ): Tv2PartEndState {
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

    endState.sisyfosPersistenceMetadata.sisyfosLayers = this.getAudioLayersToPePersisted(part, time, previousPart)

    for (const piece of part.getPieces()) {
      if (piece.tags.includes(Tv2TallyTags.JINGLE_IS_LIVE)) {
        endState.isJingle = true
      }
      if (piece.tags.includes(Tv2TallyTags.FULL_IS_LIVE)) {
        endState.fullFileName = (piece.content as Tv2FileContent).fileName
      }
    }

    // TODO: Implement "getServerPositionForPartInstance()"

    return endState
  }

  private getAudioLayersToPePersisted(part: Part, time: number, previousPart?: Part): string[] {
    const partPieceMetadata: SisyfosPersistenceMetadata | undefined = this.sisyfosPersistentLayerFinder.findLastPlayingPieceMetadata(part, time)
    const audioLayersToPersist: Set<string> = new Set(partPieceMetadata?.wantsToPersistAudio ? [...partPieceMetadata.sisyfosLayers] : [])

    const arePartsFromSameSegment: boolean = part.getSegmentId() === previousPart?.getSegmentId()
    if (arePartsFromSameSegment && partPieceMetadata?.acceptsPersistedAudio) {
      const previousPartEndState: Tv2PartEndState | undefined = previousPart?.getEndState() as Tv2PartEndState | undefined
      previousPartEndState?.sisyfosPersistenceMetadata.sisyfosLayers.forEach(layer => audioLayersToPersist.add(layer))
    }

    return Array.from(audioLayersToPersist)
  }
}
