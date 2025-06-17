import { Configuration } from '../../../rundown-execution/domain/entities/configuration'
import { Piece } from '../../../rundown-execution/domain/entities/piece'
import { BlueprintBaselinePieces } from '../../../rundown-execution/domain/value-objects/blueprint'
import { Tv2PieceInterface } from '../entities/tv2-piece-interface'
import { Tv2PieceLayer } from '../value-objects/tv2-layers'
import { TransitionType } from '../../../rundown-execution/domain/enums/transition-type'
import { PieceLifespan } from '../../../rundown-execution/domain/enums/piece-lifespan'
import { PlayoutContentType } from '../../../rundown-execution/domain/enums/playout-content-type'
import { Tv2StudioBlueprintConfigurationMapper } from './tv2-studio-blueprint-configuration-mapper'
import { Tv2StudioBlueprintConfiguration } from '../value-objects/tv2-studio-blueprint-configuration'
import { TimelineObjectFactoryProvider } from './timeline-object-factories/timeline-object-factory-provider'
import {
  Tv2VideoMixerTimelineObjectFactory
} from '../interfaces/timeline-object-factories/tv2-video-mixer-timeline-object-factory'

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
      .map((downstreamKeyer) => {
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
          takenOffAirTimestamp: 0,
          timelineObjects: [
            this.videoMixerTimelineObjectFactory.createDownstreamKeyerTimelineObject(downstreamKeyer, downstreamKeyer.defaultOn)
          ],
          metadata: {
            playoutContent: {
              type: PlayoutContentType.DOWNSTREAM_KEYER,
              identifier: downstreamKeyerNumber,
              isOn: downstreamKeyer.defaultOn
            }
          },
          tags: []
        }
        return new Piece(pieceInterface)
      })
  }
}
