import { Configuration } from '../../model/entities/configuration'
import { Piece } from '../../model/entities/piece'
import { BlueprintBaselinePieces } from '../../model/value-objects/blueprint'
import { Tv2PieceInterface } from './entities/tv2-piece-interface'
import { Tv2PieceLayer } from './value-objects/tv2-layers'
import { TransitionType } from '../../model/enums/transition-type'
import { PieceLifespan } from '../../model/enums/piece-lifespan'
import { PlayoutContentType } from '../../model/enums/playout-content-type'
import { Tv2StudioBlueprintConfigurationMapper } from './helpers/tv2-studio-blueprint-configuration-mapper'
import { Tv2StudioBlueprintConfiguration } from './value-objects/tv2-studio-blueprint-configuration'
import { TimelineObjectFactoryProvider } from './timeline-object-factories/timeline-object-factory-provider'
import {
  Tv2VideoMixerTimelineObjectFactory
} from './timeline-object-factories/interfaces/tv2-video-mixer-timeline-object-factory'

export class Tv2BlueprintBaselinePiecesGenerator implements BlueprintBaselinePieces {

  private videoMixerTimelineObjectFactory: Tv2VideoMixerTimelineObjectFactory

  constructor(
    private readonly studioMapper: Tv2StudioBlueprintConfigurationMapper,
    private readonly timelineObjectFactoryProvider: TimelineObjectFactoryProvider
  ) {
  }

  public generateBaselinePieces(rundownId: string, configuration: Configuration): Piece[] {
    const studioBlueprintConfiguration: Tv2StudioBlueprintConfiguration = this.studioMapper.mapStudioConfiguration(configuration.studio)
    this.updateTimelineObjectFactories(studioBlueprintConfiguration)
    return this.createBaselineDownstreamKeyerPieces(rundownId, studioBlueprintConfiguration)
  }

  private updateTimelineObjectFactories(studioBlueprintConfiguration: Tv2StudioBlueprintConfiguration): void {
    this.videoMixerTimelineObjectFactory = this.timelineObjectFactoryProvider.createVideoMixerTimelineObjectFactory(studioBlueprintConfiguration)
  }

  private createBaselineDownstreamKeyerPieces(rundownId: string, studioConfiguration: Tv2StudioBlueprintConfiguration): Piece[] {
    return studioConfiguration.videoMixerBasicConfiguration.downstreamKeyers
      .filter(downstreamKeyer => downstreamKeyer.defaultOn)
      .map(downstreamKeyer => {
        const downstreamKeyerNumber: string = String(downstreamKeyer.index + 1)
        const pieceInterface: Tv2PieceInterface = {
          id: `${rundownId}_baseline_piece_${downstreamKeyerNumber}`,
          partId: 'baseline',
          rundownId,
          name: `Downstream Keyer ${downstreamKeyerNumber}`,
          layer: `${Tv2PieceLayer.DOWNSTREAM_KEYER_ACTION_COMMAND}_${downstreamKeyerNumber}`,
          transitionType: TransitionType.NO_TRANSITION,
          pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
          isPlanned: true,
          isUnsynced: false,
          start: 0,
          preRollDuration: 0,
          postRollDuration: 0,
          timelineObjects: [
            this.videoMixerTimelineObjectFactory.createDownstreamKeyerTimelineObject(downstreamKeyer, true)
          ],
          metadata: {
            playoutContent: {
              type: PlayoutContentType.COMMAND // TODO
            }
          },
          tags: []
        }
        return new Piece(pieceInterface)
      })
  }
}
