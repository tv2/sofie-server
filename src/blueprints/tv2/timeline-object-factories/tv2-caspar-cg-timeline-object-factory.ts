import {
  CasparCgMediaTimelineObject,
  CasparCgTemplateTimelineObject,
  CasparCgTransitionDirection,
  CasparCgTransitionEase,
  CasparCgTransitionType,
  CasparCgType
} from '../../timeline-state-resolver-types/caspar-cg-types'
import { Tv2CasparCgLayer, Tv2GraphicsLayer } from '../value-objects/tv2-layers'
import { DeviceType } from '../../../model/enums/device-type'
import { Tv2VideoClipManifestData } from '../value-objects/tv2-action-manifest-data'

export class Tv2CasparCgTimelineObjectFactory {

  public createVideoClipTimelineObject(videoClipData: Tv2VideoClipManifestData): CasparCgMediaTimelineObject {
    return {
      id: `casparCg_${videoClipData.fileName}`,
      enable: {
        start: 0
      },
      priority: 1,
      layer: Tv2CasparCgLayer.PLAYER_CLIP_PENDING,
      content: {
        deviceType: DeviceType.CASPAR_CG,
        type: CasparCgType.MEDIA,
        file: videoClipData.fileName,
        loop: videoClipData.adLibPix,
        playing: true,
        noStarttime: true
      }
    }
  }

  public createDveKeyTimelineObject(keyFilePath: string): CasparCgMediaTimelineObject {
    return {
      id: 'casparCg_dve_key',
      enable: {
        start: 0
      },
      priority: 1,
      layer: Tv2CasparCgLayer.DVE_KEY,
      content: {
        deviceType: DeviceType.CASPAR_CG,
        type: CasparCgType.MEDIA,
        file: keyFilePath,
        mixer: {
          keyer: true
        },
        loop: true
      }
    }
  }

  public createDveFrameTimelineObject(frameFilePath: string): CasparCgMediaTimelineObject {
    return {
      id: 'casparCg_dve_frame',
      enable: {
        start: 0
      },
      priority: 1,
      layer: Tv2CasparCgLayer.DVE_FRAME,
      content: {
        deviceType: DeviceType.CASPAR_CG,
        type: CasparCgType.MEDIA,
        file: frameFilePath,
        loop: true
      }
    }
  }

  public createDveLocatorTimelineObject(): CasparCgTemplateTimelineObject {
    return {
      id: 'casparCg_locators',
      enable: {
        start: 0
      },
      priority: 1,
      layer: Tv2GraphicsLayer.GRAPHICS_LOCATORS,
      content: {
        deviceType: DeviceType.CASPAR_CG,
        type: CasparCgType.TEMPLATE
      }
    }
  }

  public createBreakerTimelineObject(file: string): CasparCgMediaTimelineObject {
    return {
      id: 'casparCg_breaker',
      enable: {
        start: 0
      },
      priority: 1,
      layer: Tv2CasparCgLayer.BREAKER,
      content: {
        deviceType: DeviceType.CASPAR_CG,
        type: CasparCgType.MEDIA,
        file
      }
    }
  }

  public createFadeAudioBedTimelineObject(fadeDurationInMilliseconds: number): CasparCgMediaTimelineObject {
    const file: string = 'empty'
    return {
      id: 'casparCg_fade_audio',
      enable: {
        start: 0
      },
      layer: Tv2CasparCgLayer.AUDIO,
      priority: 1,
      content: {
        deviceType: DeviceType.CASPAR_CG,
        type: CasparCgType.MEDIA,
        file,
        transitions: {
          inTransition: {
            type: CasparCgTransitionType.MIX,
            easing: CasparCgTransitionEase.LINEAR,
            direction: CasparCgTransitionDirection.LEFT,
            duration: fadeDurationInMilliseconds
          },
        }
      }
    }
  }
}
