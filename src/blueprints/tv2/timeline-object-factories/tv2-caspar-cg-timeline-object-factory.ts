import {
  CasparCgMediaTimelineObject,
  CasparCgTemplateTimelineObject,
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

  public createSplitScreenKeyTimelineObject(keyFilePath: string): CasparCgMediaTimelineObject {
    return {
      id: 'casparCg_split_screen_key',
      enable: {
        start: 0
      },
      priority: 1,
      layer: Tv2CasparCgLayer.SPLIT_SCREEN_KEY,
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

  public createSplitScreenFrameTimelineObject(frameFilePath: string): CasparCgMediaTimelineObject {
    return {
      id: 'casparCg_split_screen_frame',
      enable: {
        start: 0
      },
      priority: 1,
      layer: Tv2CasparCgLayer.SPLIT_SCREEN_FRAME,
      content: {
        deviceType: DeviceType.CASPAR_CG,
        type: CasparCgType.MEDIA,
        file: frameFilePath,
        loop: true
      }
    }
  }

  public createSplitScreenLocatorTimelineObject(): CasparCgTemplateTimelineObject {
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
}
