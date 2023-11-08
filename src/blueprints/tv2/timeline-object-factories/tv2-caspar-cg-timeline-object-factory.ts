import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { TimelineObject } from '../../../model/entities/timeline-object'
import { UnsupportedOperation } from '../../../model/exceptions/unsupported-operation'
import { Tv2BaseGraphicTimelineObjectFactory } from './tv2-base-graphic-timeline-object-factory'
import { Tv2GraphicsTimelineObjectFactory } from './interfaces/tv2-graphics-timeline-object-factory'
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

export class Tv2CasparCgTimelineObjectFactory extends Tv2BaseGraphicTimelineObjectFactory implements Tv2GraphicsTimelineObjectFactory {
  constructor(private readonly casparCgPathFixer: Tv2AssetPathHelper) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public createAllOutGraphicsTimelineObject(_blueprintConfiguration: Tv2BlueprintConfiguration, _duration: number): TimelineObject {
    throw new UnsupportedOperation(
      `'${Tv2CasparCgTimelineObjectFactory.name}' has no implementation for '${Tv2CasparCgTimelineObjectFactory.prototype.createAllOutGraphicsTimelineObject}'`
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public createClearGraphicsTimelineObject(_blueprintConfiguration: Tv2BlueprintConfiguration, _duration: number): TimelineObject {
    throw new UnsupportedOperation(
      `'${Tv2CasparCgTimelineObjectFactory.name}' has no implementation for '${Tv2CasparCgTimelineObjectFactory.prototype.createClearGraphicsTimelineObject}'`
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public createContinueGraphicsTimelineObject(_duration: number): TimelineObject {
    throw new UnsupportedOperation(
      `'${Tv2CasparCgTimelineObjectFactory.name}' has no implementation for '${Tv2CasparCgTimelineObjectFactory.prototype.createContinueGraphicsTimelineObject}'`
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public createOverlayInitializeTimelineObject(_duration: number): TimelineObject {
    throw new UnsupportedOperation(
      `'${Tv2CasparCgTimelineObjectFactory.name}' has no implementation for '${Tv2CasparCgTimelineObjectFactory.prototype.createOverlayInitializeTimelineObject}'`
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public createThemeOutTimelineObject(_blueprintConfiguration: Tv2BlueprintConfiguration, _duration: number): TimelineObject {
    throw new UnsupportedOperation(
      `'${Tv2CasparCgTimelineObjectFactory.name}' has no implementation for '${Tv2CasparCgTimelineObjectFactory.prototype.createThemeOutTimelineObject}'`
    )
  }

  public createFullGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, fullscreenGraphicsData: Tv2FullscreenGraphicsManifestData): CasparCgTemplateTimelineObject {
    const rawGraphicsFolder: string | undefined = blueprintConfiguration.studio.GraphicFolder
    const sceneChunks: string[] = fullscreenGraphicsData.name.split('/')
    const sceneName: string = sceneChunks[sceneChunks.length - 1]
    const fileName: string = this.casparCgPathFixer.joinAssetToFolder(sceneName, rawGraphicsFolder)

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
        name: this.casparCgPathFixer.joinAssetToFolder('index', blueprintConfiguration.showStyle.selectedGraphicsSetup.htmlPackageFolder),
        data: this.createStillTemplateData(blueprintConfiguration, fileName),
        useStopCommand: false,
        mixer: {
          opacity: 100
        }
      }
    }
  }

  private createStillTemplateData(blueprintConfiguration: Tv2BlueprintConfiguration, fileName: string): CasparCgTemplateData {
    if (!blueprintConfiguration.studio.HTMLGraphics) {
      throw new MisconfigurationException(
        'Missing configuration of \'HTMLGraphics\' in settings. ' +
        'Make sure it exists, and contains a value for \'GraphicURL\''
      )
    }

    const absoluteFilePath: string = `${blueprintConfiguration.studio.HTMLGraphics.GraphicURL}\\${fileName}${blueprintConfiguration.studio.GraphicFileExtension}`
    return {
      display: 'program',
      slots: {
        [this.mapTv2GraphicsLayerToHtmlGraphicsSlot(Tv2GraphicsLayer.GRAPHICS_PILOT)]: {
          payload: {
            type: 'still',
            url: encodeURI(this.casparCgPathFixer.replaceForwardSlashWithDoubleBackslash(absoluteFilePath)),
            noAnimation: false
          },
          display: 'program',
        }
      },
      partialUpdate: false
    }
  }

  private mapTv2GraphicsLayerToHtmlGraphicsSlot(layer: Tv2GraphicsLayer): string {
    switch (layer) {
      case Tv2GraphicsLayer.GRAPHICS_PILOT: return '250_full'
      case Tv2GraphicsLayer.GRAPHICS_OVERLAY_PILOT: return '260_overlay'
      case Tv2GraphicsLayer.GRAPHICS_OVERLAY_IDENT: return '650_ident'
      case Tv2GraphicsLayer.GRAPHICS_OVERLAY_LOWER: return '450_lowerThird'
      default: return ''
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
    graphicsData: Tv2OverlayGraphicsManifestData,
    graphicsLayer: Tv2GraphicsLayer
  ): CasparCgTemplateTimelineObject['content'] {
    return {
      deviceType: DeviceType.CASPAR_CG,
      type: CasparCgType.TEMPLATE,
      templateType: 'html',
      name: this.casparCgPathFixer.joinAssetToFolder('index', blueprintConfiguration.showStyle.selectedGraphicsSetup.htmlPackageFolder),
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
              type: this.getTemplateName(graphicsData),
              0: this.getDisplayText(graphicsData)
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

  public createCasparCgDveKeyTimelineObject(keyFilePath: string): CasparCgMediaTimelineObject {
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

  public createCasparCgDveFrameTimelineObject(frameFilePath: string): CasparCgMediaTimelineObject {
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

  public createCasparCgDveLocatorTimelineObject(): CasparCgTemplateTimelineObject {
    return {} as CasparCgTemplateTimelineObject
    // TODO: RKLI Should implement this
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
}