import { Tv2VideoMixerTimelineObjectFactory } from './interfaces/tv2-video-mixer-timeline-object-factory'
import { Tv2DownstreamKeyer, Tv2DownstreamKeyerRole } from '../value-objects/tv2-studio-blueprint-configuration'
import {
  AtemAuxTimelineObject,
  AtemDownstreamKeyerTimelineObject,
  AtemMeTimelineObject,
  AtemTransitionSettings,
  AtemType
} from '../../timeline-state-resolver-types/atem-types'
import { Tv2AtemLayer } from '../value-objects/tv2-layers'
import { DeviceType } from '../../../model/enums/device-type'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'

export class Tv2AtemVideoMixerTimelineObjectFactory implements Tv2VideoMixerTimelineObjectFactory {
  public createDownstreamKeyerTimelineObject(downstreamKeyer: Tv2DownstreamKeyer, onAir: boolean): AtemDownstreamKeyerTimelineObject {
    return this.createAtemDownstreamKeyerTimelineObject(downstreamKeyer, onAir, {
      id: '',
      enable: {
        while: 1
      },
      priority: 10,
    })
  }

  private createAtemDownstreamKeyerTimelineObject(
    downstreamKeyer: Tv2DownstreamKeyer,
    onAir: boolean,
    timelineObjectWithRequiredValues: Pick<AtemDownstreamKeyerTimelineObject, 'id' | 'enable' | 'priority'> & Partial<AtemDownstreamKeyerTimelineObject>
  ): AtemDownstreamKeyerTimelineObject {
    const downstreamKeyerNumber: number = downstreamKeyer.Number + 1
    return {
      layer: `${Tv2AtemLayer.DOWNSTREAM_KEYER}_${downstreamKeyerNumber}`,
      content: {
        deviceType: DeviceType.ATEM,
        type: AtemType.DSK,
        dsk: {
          onAir,
          sources: {
            fillSource: downstreamKeyer.Fill,
            cutSource: downstreamKeyer.Key
          },
          properties: {
            clip: this.convertPercentageToAtemPercentageValue(downstreamKeyer.Clip),
            gain: this.convertPercentageToAtemPercentageValue(downstreamKeyer.Gain),
            mask: {
              enable: false
            }
          }
        }
      },
      ...timelineObjectWithRequiredValues
    }
  }

  /**
   * @return The percentage given converted to percentage used by Atem (1-1000)
   */
  private convertPercentageToAtemPercentageValue(percentage: number): number {
    return percentage * 10
  }

  public createDownstreamKeyerFullPilotTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration): AtemDownstreamKeyerTimelineObject {
    const downstreamKeyer = this.getDownstreamkeyerMatchingRole(blueprintConfiguration, Tv2DownstreamKeyerRole.FULL_GRAPHICS)
    return this.createAtemDownstreamKeyerTimelineObject(downstreamKeyer, true, {
      id: '',
      enable: {
        start: 0
      },
      priority: 0,
    })
  }

  public createUpstreamKeyerFullPilotTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, start: number): AtemMeTimelineObject {
    const downstreamKeyer = this.getDownstreamkeyerMatchingRole(blueprintConfiguration, Tv2DownstreamKeyerRole.FULL_GRAPHICS)
    return {
      id: '',
      enable: {
        start
      },
      priority: 1,
      layer: Tv2AtemLayer.CLEAN_UPSTREAM_KEYER,
      content: {
        deviceType: DeviceType.ATEM,
        type: AtemType.ME,
        me: {
          upstreamKeyers: [
            {
              upstreamKeyerId: downstreamKeyer.Number,
              onAir: true,
              mixEffectKeyType: 0,
              flyEnabled: false,
              fillSource: downstreamKeyer.Fill,
              cutSource: downstreamKeyer.Key,
              maskEnabled: false,
              lumaSettings: {
                clip: this.convertPercentageToAtemPercentageValue(downstreamKeyer.Clip),
                gain: this.convertPercentageToAtemPercentageValue(downstreamKeyer.Gain),
              }
            }
          ]
        }
      }
    }
  }

  // Todo: merge usage with copy in 'Tv2GraphicsActionFactory'
  private getDownstreamkeyerMatchingRole(blueprintConfiguration: Tv2BlueprintConfiguration, role: Tv2DownstreamKeyerRole): Tv2DownstreamKeyer {
    return blueprintConfiguration.studio.SwitcherSource.DSK.find(
      downstreamKeyer => downstreamKeyer.Roles.some(
        keyerRole => keyerRole === role)) ?? blueprintConfiguration.studio.SwitcherSource.DSK[0]
  }

  public createNextAuxTimelineObject(input: number): AtemAuxTimelineObject {
    return {
      id: '',
      enable: { start: 0 },
      priority: 0,
      layer: Tv2AtemLayer.LOOKAHEAD,
      content: {
        deviceType: DeviceType.ATEM,
        type: AtemType.AUX,
        aux: {
          input
        }
      }
    }
  }

  public createProgramTimelineObject(start: number, input: number, transition: number, transitionSettings?: AtemTransitionSettings): AtemMeTimelineObject {
    return this.createTimelineObjectForLayer(Tv2AtemLayer.PROGRAM, start, input, transition, transitionSettings)
  }

  public createCleanTimelineObject(start: number, input: number, transition: number, transitionSettings?: AtemTransitionSettings): AtemMeTimelineObject {
    return this.createTimelineObjectForLayer(Tv2AtemLayer.CLEAN, start, input, transition, transitionSettings)
  }

  private createTimelineObjectForLayer(layer: Tv2AtemLayer, start: number, input: number, transition: number, transitionSettings?: AtemTransitionSettings): AtemMeTimelineObject {
    const id: string = '' // Todo: get hashId value of 'layer'

    return {
      id,
      enable: {
        start
      },
      priority: 1,
      layer,
      content: {
        deviceType: DeviceType.ATEM,
        type: AtemType.ME,
        me: {
          input,
          transition,
          transitionSettings
        }
      }
    }
  }
}
