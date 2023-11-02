import { Tv2VideoMixerTimelineObjectFactory } from './interfaces/tv2-video-mixer-timeline-object-factory'
import { Tv2DownstreamKeyer } from '../value-objects/tv2-studio-blueprint-configuration'
import {
  AtemAuxTimelineObject,
  AtemDownstreamKeyerTimelineObject,
  AtemMe,
  AtemMeTimelineObject,
  AtemTransition,
  AtemTransitionSettings,
  AtemType
} from '../../timeline-state-resolver-types/atem-types'
import { Tv2AtemLayer } from '../value-objects/tv2-layers'
import { DeviceType } from '../../../model/enums/device-type'
import { TimelineEnable } from '../../../model/entities/timeline-enable'

export class Tv2AtemVideoMixerTimelineObjectFactory implements Tv2VideoMixerTimelineObjectFactory {
  public createDownstreamKeyerTimelineObject(downstreamKeyer: Tv2DownstreamKeyer, onAir: boolean, enable: TimelineEnable, priority: number): AtemDownstreamKeyerTimelineObject {
    const downstreamKeyerNumber: number = downstreamKeyer.Number + 1
    return {
      id: `downstreamKeyer${downstreamKeyerNumber}`,
      enable,
      priority,
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
    }
  }

  /**
   * @return The percentage given converted to percentage used by Atem (1-1000)
   */
  private convertPercentageToAtemPercentageValue(percentage: number): number {
    return percentage * 10
  }

  public createUpstreamKeyerTimelineObject(downstreamKeyer: Tv2DownstreamKeyer, enable: TimelineEnable): AtemMeTimelineObject {
    const downstreamKeyerNumber: number = downstreamKeyer.Number + 1
    return {
      id: `upstreamKeyer${downstreamKeyerNumber}`,
      enable,
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

  public createProgramTimelineObject(sourceInput: number, enable: TimelineEnable, transition: number = AtemTransition.CUT, transitionSettings?: AtemTransitionSettings): AtemMeTimelineObject {
    return this.createAtemMeTimelineObjectForLayer(
      'atem_program',
      Tv2AtemLayer.PROGRAM,
      enable,
      {
        input: sourceInput,
        transition,
        transitionSettings
      })
  }

  public createCleanFeedTimelineObject(sourceInput: number, enable: TimelineEnable, transition: number = AtemTransition.CUT, transitionSettings?: AtemTransitionSettings): AtemMeTimelineObject {
    return this.createAtemMeTimelineObjectForLayer(
      'atem_cleanFeed',
      Tv2AtemLayer.CLEAN_FEED,
      enable, 
      {
        input: sourceInput,
        transition,
        transitionSettings
      })
  }

  private createAtemMeTimelineObjectForLayer(id: string, layer: Tv2AtemLayer, enable: TimelineEnable, me: AtemMe): AtemMeTimelineObject {
    return {
      id,
      enable,
      priority: 1,
      layer,
      content: {
        deviceType: DeviceType.ATEM,
        type: AtemType.ME,
        me
      }
    }
  }

  public createLookaheadTimelineObject(sourceInput: number, enable: TimelineEnable): AtemAuxTimelineObject {
    return {
      id: 'atem_lookahead',
      enable,
      priority: 0,
      layer: Tv2AtemLayer.LOOKAHEAD,
      content: {
        deviceType: DeviceType.ATEM,
        type: AtemType.AUX,
        aux: {
          input: sourceInput
        }
      }
    }
  }
}
