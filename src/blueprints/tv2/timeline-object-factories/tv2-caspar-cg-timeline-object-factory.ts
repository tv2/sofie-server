import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { Tv2GraphicsElementTimelineObjectFactory } from './interfaces/tv2-graphics-element-timeline-object-factory'
import { DeviceType } from '../../../model/enums/device-type'
import {
  CasparCgMediaTimelineObject,
  CasparCgTemplateData,
  CasparCgTemplateTimelineObject,
  CasparCgType
} from '../../timeline-state-resolver-types/caspar-cg-types'
import { Tv2CasparCgLayer, Tv2GraphicsLayer } from '../value-objects/tv2-layers'
import { Tv2AssetPathHelper } from '../helpers/tv2-asset-path-helper'
import { MisconfigurationException } from '../../../model/exceptions/misconfiguration-exception'
import {
  Tv2FullscreenGraphicsManifestData,
  Tv2OverlayGraphicsManifestData,
  Tv2VideoClipManifestData
} from '../value-objects/tv2-action-manifest-data'
import {
  Tv2GraphicsSplitScreenTimelineObjectFactory
} from './interfaces/tv2-graphics-split-screen-timeline-object-factory'
import { Tv2VideoClipTimelineObjectFactory } from './interfaces/tv2-video-clip-timeline-object-factory'

enum CasparCgSlot {
  FULL_GRAPHICS = '250_full',
  IDENT = '650_ident',
  LOWER_THIRD = '450_lowerThird',
  UNKNOWN = ''
}

export class Tv2CasparCgTimelineObjectFactory implements Tv2GraphicsElementTimelineObjectFactory, Tv2GraphicsSplitScreenTimelineObjectFactory, Tv2VideoClipTimelineObjectFactory {

  constructor(private readonly assetPathHelper: Tv2AssetPathHelper) {}

  public createFullscreenGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, fullscreenGraphicsData: Tv2FullscreenGraphicsManifestData): CasparCgTemplateTimelineObject {
    const rawGraphicsFolder: string | undefined = blueprintConfiguration.studio.graphicsFolder.name
    const nameChunks: string[] = fullscreenGraphicsData.name.split('/')
    const sceneName: string = nameChunks[nameChunks.length - 1]
    const fileName: string = this.assetPathHelper.joinAssetToFolder(sceneName, rawGraphicsFolder)

    return {
      id: 'full',
      enable: {
        while: 1
      },
      priority: 100,
      layer: Tv2GraphicsLayer.GRAPHICS_PILOT,
      content: {
        deviceType: DeviceType.CASPAR_CG,
        type: CasparCgType.TEMPLATE,
        templateType: 'html',
        name: this.assetPathHelper.joinAssetToFolder('index', blueprintConfiguration.showStyle.selectedGraphicsSetup.htmlPackageFolder),
        data: this.createFullscreenTemplateData(blueprintConfiguration, fileName),
        useStopCommand: false,
        mixer: {
          opacity: 100
        }
      }
    }
  }

  private createFullscreenTemplateData(blueprintConfiguration: Tv2BlueprintConfiguration, fileName: string): CasparCgTemplateData {
    if (!blueprintConfiguration.studio.htmlGraphics) {
      throw new MisconfigurationException(
        'Missing configuration of \'HTMLGraphics\' in settings. Make sure it exists, and contains a value for \'GraphicURL\''
      )
    }

    const absoluteFilePath: string = `${blueprintConfiguration.studio.htmlGraphics.graphicsUrl}\\${fileName}${blueprintConfiguration.studio.graphicsFolder.fileExtension}`
    return {
      display: 'program',
      slots: {
        [this.mapTv2GraphicsLayerToHtmlGraphicsSlot(Tv2GraphicsLayer.GRAPHICS_PILOT)]: {
          payload: {
            type: 'still',
            url: encodeURI(this.assetPathHelper.escapePath(this.assetPathHelper.convertUnixPathToWindowsPath(absoluteFilePath))),
            noAnimation: false
          },
          display: 'program',
        }
      },
      partialUpdate: false
    }
  }

  private mapTv2GraphicsLayerToHtmlGraphicsSlot(layer: Tv2GraphicsLayer): CasparCgSlot {
    switch (layer) {
      case Tv2GraphicsLayer.GRAPHICS_PILOT: return CasparCgSlot.FULL_GRAPHICS
      case Tv2GraphicsLayer.GRAPHICS_OVERLAY_IDENT: return CasparCgSlot.IDENT
      case Tv2GraphicsLayer.GRAPHICS_OVERLAY_LOWER: return CasparCgSlot.LOWER_THIRD
      default: return CasparCgSlot.UNKNOWN
    }
  }

  public createIdentGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, overlayGraphicsData: Tv2OverlayGraphicsManifestData): CasparCgTemplateTimelineObject {
    return {
      id: 'ident',
      priority: 1,
      enable: {
        start: 0
      },
      layer: Tv2GraphicsLayer.GRAPHICS_OVERLAY_IDENT,
      content: this.createOverlayGraphicsTimelineObjectContent(blueprintConfiguration, overlayGraphicsData, Tv2GraphicsLayer.GRAPHICS_OVERLAY_IDENT)
    }
  }

  private createOverlayGraphicsTimelineObjectContent(
    blueprintConfiguration: Tv2BlueprintConfiguration,
    overlayGraphicsData: Tv2OverlayGraphicsManifestData,
    graphicsLayer: Tv2GraphicsLayer
  ): CasparCgTemplateTimelineObject['content'] {
    return {
      deviceType: DeviceType.CASPAR_CG,
      type: CasparCgType.TEMPLATE,
      templateType: 'html',
      name: this.assetPathHelper.joinAssetToFolder('index', blueprintConfiguration.showStyle.selectedGraphicsSetup.htmlPackageFolder),
      useStopCommand: false,
      mixer: {
        opacity: 100
      },
      data: {
        display: 'program',
        partialUpdate: true,
        slots: {
          [this.mapTv2GraphicsLayerToHtmlGraphicsSlot(graphicsLayer)]: {
            display: 'program',
            payload: {
              type: overlayGraphicsData.templateName,
              0: overlayGraphicsData.displayText
            }
          }
        }
      }
    }
  }

  public createLowerThirdGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, overlayGraphicsData: Tv2OverlayGraphicsManifestData): CasparCgTemplateTimelineObject {
    return {
      id: 'lowerThird',
      priority: 1,
      enable: {
        start: 0
      },
      layer: Tv2GraphicsLayer.GRAPHICS_OVERLAY_LOWER,
      content: this.createOverlayGraphicsTimelineObjectContent(blueprintConfiguration, overlayGraphicsData, Tv2GraphicsLayer.GRAPHICS_OVERLAY_LOWER)
    }
  }

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
    return {} as CasparCgTemplateTimelineObject
    // TODO: SOF-1695 Should implement this
    // return {
    //   id: 'casparCg_locators',
    //   enable: {
    //     start: 0
    //   },
    //   priority: 1,
    //   layer: Tv2GraphicsLayer.GRAPHICS_LOCATORS,
    //   content: {
    //     deviceType: DeviceType.CASPAR_CG,
    //     type: CasparCgType.TEMPLATE
    //   }
    // }
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
