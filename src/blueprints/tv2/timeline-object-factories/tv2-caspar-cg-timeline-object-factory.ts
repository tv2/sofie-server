import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { Tv2GraphicsElementTimelineObjectFactory } from './interfaces/tv2-graphics-element-timeline-object-factory'
import { DeviceType } from '../../../model/enums/device-type'
import {
  CasparCgMediaTimelineObject,
  CasparCgTemplateTimelineObject,
  CasparCgTemplateType,
  CasparCgTransitionDirection,
  CasparCgTransitionEase,
  CasparCgTransitionType,
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
import { GraphicsSetup, SplitScreenConfiguration } from '../value-objects/tv2-show-style-blueprint-configuration'
import {
  Tv2CasparCgTemplateData,
  Tv2CasparCgTemplateDisplayMode,
  Tv2CasparCgTemplateSlotType
} from '../timeline-state-resolver-types/tv2-caspar-cg-types'

const HTML_GRAPHICS_INDEX_FILENAME: string = 'index'
const ACTION_MANIFEST_DISPLAY_NAME_DATA_SEPARATOR: string = '\n - '

export class Tv2CasparCgTimelineObjectFactory implements Tv2GraphicsElementTimelineObjectFactory, Tv2GraphicsSplitScreenTimelineObjectFactory, Tv2VideoClipTimelineObjectFactory {

  constructor(private readonly assetPathHelper: Tv2AssetPathHelper) {}

  public createFullscreenGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, fullscreenGraphicsData: Tv2FullscreenGraphicsManifestData): CasparCgTemplateTimelineObject<Tv2CasparCgTemplateData> {
    const fileName: string = this.prependGraphicsFolder(blueprintConfiguration, fullscreenGraphicsData.name)

    return {
      id: 'full_graphics_caspar_cg',
      enable: {
        while: 1
      },
      priority: 100,
      layer: Tv2GraphicsLayer.GRAPHICS_PILOT,
      content: {
        deviceType: DeviceType.CASPAR_CG,
        type: CasparCgType.TEMPLATE,
        templateType: CasparCgTemplateType.HTML,
        name: this.assetPathHelper.joinAssetToFolder('index', blueprintConfiguration.showStyle.selectedGraphicsSetup.htmlPackageFolder),
        data: this.createFullscreenGraphicsTemplateData(blueprintConfiguration, fileName),
        useStopCommand: false,
        mixer: {
          opacity: 100
        }
      }
    }
  }

  private prependGraphicsFolder(blueprintConfiguration: Tv2BlueprintConfiguration, name: string): string {
    const rawGraphicsFolder: string | undefined = blueprintConfiguration.studio.graphicsFolder.name
    const nameChunks: string[] = name.split('/')
    const sceneName: string = nameChunks[nameChunks.length - 1]
    return this.assetPathHelper.joinAssetToFolder(sceneName, rawGraphicsFolder)
  }

  private createFullscreenGraphicsTemplateData(blueprintConfiguration: Tv2BlueprintConfiguration, fileName: string): Tv2CasparCgTemplateData {
    const absoluteFilePath: string = this.getAbsoluteFilePath(blueprintConfiguration, fileName)
    return {
      display: Tv2CasparCgTemplateDisplayMode.PROGRAM,
      slots: {
        [Tv2CasparCgTemplateSlotType.FULLSCREEN_GRAPHICS]: {
          payload: {
            type: 'still',
            url: encodeURI(this.assetPathHelper.escapePath(this.assetPathHelper.convertUnixPathToWindowsPath(absoluteFilePath))),
            noAnimation: false
          },
          display: Tv2CasparCgTemplateDisplayMode.PROGRAM,
        }
      },
      partialUpdate: false
    }
  }

  private getAbsoluteFilePath(blueprintConfiguration: Tv2BlueprintConfiguration, fileName: string): string {
    if (!blueprintConfiguration.studio.htmlGraphics) {
      throw new MisconfigurationException(
        'Missing configuration of \'HTMLGraphics\' in settings. Make sure it exists, and contains a value for \'GraphicURL\''
      )
    }

    return `${blueprintConfiguration.studio.htmlGraphics.graphicsUrl}\\${fileName}${blueprintConfiguration.studio.graphicsFolder.fileExtension}`
  }

  public createPilotGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, graphicsData: Tv2OverlayGraphicsManifestData): CasparCgTemplateTimelineObject<Tv2CasparCgTemplateData> {
    const fileName: string = this.prependGraphicsFolder(blueprintConfiguration, graphicsData.name)
    const absoluteFilePath: string = this.getAbsoluteFilePath(blueprintConfiguration, fileName)

    return {
      id: 'pilot_caspar_cg',
      enable: {
        while: '1'
      },
      priority: 100,
      layer: Tv2GraphicsLayer.GRAPHICS_OVERLAY_PILOT,
      content: {
        deviceType: DeviceType.CASPAR_CG,
        type: CasparCgType.TEMPLATE,
        templateType: CasparCgTemplateType.HTML,
        name: this.assetPathHelper.joinAssetToFolder('index', blueprintConfiguration.showStyle.selectedGraphicsSetup.htmlPackageFolder),
        useStopCommand: false,
        mixer: {
          opacity: 100
        },
        data: {
          display: Tv2CasparCgTemplateDisplayMode.PROGRAM,
          slots: {
            [Tv2CasparCgTemplateSlotType.PILOT_OVERLAY]: {
              payload: {
                type: 'overlay',
                url: encodeURI(this.assetPathHelper.escapePath(this.assetPathHelper.convertUnixPathToWindowsPath(absoluteFilePath))),
                noAnimation: false
              },
              display: Tv2CasparCgTemplateDisplayMode.PROGRAM
            }
          },
          partialUpdate: true
        }
      }
    }
  }

  public createIdentGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, overlayGraphicsData: Tv2OverlayGraphicsManifestData): CasparCgTemplateTimelineObject<Tv2CasparCgTemplateData> {
    return {
      id: 'ident_caspar_cg',
      priority: 1,
      enable: {
        start: 0
      },
      layer: Tv2GraphicsLayer.GRAPHICS_OVERLAY_IDENT,
      content: this.createOverlayGraphicsTimelineObjectContent(blueprintConfiguration, {
        display: Tv2CasparCgTemplateDisplayMode.PROGRAM,
        partialUpdate: true,
        slots: {
          [Tv2CasparCgTemplateSlotType.IDENT]: {
            display: Tv2CasparCgTemplateDisplayMode.PROGRAM,
            payload: {
              type: overlayGraphicsData.templateName,
              0: overlayGraphicsData.displayText
            }
          }
        }
      })
    }
  }

  private createOverlayGraphicsTimelineObjectContent(
    blueprintConfiguration: Tv2BlueprintConfiguration,
    templateData: Tv2CasparCgTemplateData,
  ): CasparCgTemplateTimelineObject<Tv2CasparCgTemplateData>['content'] {
    return {
      deviceType: DeviceType.CASPAR_CG,
      type: CasparCgType.TEMPLATE,
      templateType: CasparCgTemplateType.HTML,
      name: this.assetPathHelper.joinAssetToFolder('index', blueprintConfiguration.showStyle.selectedGraphicsSetup.htmlPackageFolder),
      useStopCommand: false,
      mixer: {
        opacity: 100
      },
      data: templateData
    }
  }

  public createLowerThirdGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, overlayGraphicsData: Tv2OverlayGraphicsManifestData): CasparCgTemplateTimelineObject<Tv2CasparCgTemplateData> {
    return {
      id: 'lowerThird',
      priority: 1,
      enable: {
        start: 0
      },
      layer: Tv2GraphicsLayer.GRAPHICS_OVERLAY_LOWER,
      content: this.createOverlayGraphicsTimelineObjectContent(blueprintConfiguration, {
        display: Tv2CasparCgTemplateDisplayMode.PROGRAM,
        partialUpdate: true,
        slots: {
          [Tv2CasparCgTemplateSlotType.LOWER_THIRD]: {
            display: Tv2CasparCgTemplateDisplayMode.PROGRAM,
            payload: {
              type: overlayGraphicsData.templateName,
              ...Object.fromEntries(overlayGraphicsData.displayText.split(ACTION_MANIFEST_DISPLAY_NAME_DATA_SEPARATOR).entries()), // TODO: When ingest is implemented, this should no longer be based on the display name.
            }
          }
        }
      })
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

  public createSplitScreenLocatorTimelineObject(graphicsSetup: GraphicsSetup, splitScreenConfiguration: SplitScreenConfiguration, locatorLabels?: string[]): CasparCgTemplateTimelineObject<Tv2CasparCgTemplateData> {
    return {
      id: 'casparCg_locators',
      enable: {
        start: 0
      },
      priority: 1,
      layer: Tv2GraphicsLayer.GRAPHICS_LOCATORS,
      content: {
        deviceType: DeviceType.CASPAR_CG,
        type: CasparCgType.TEMPLATE,
        templateType: CasparCgTemplateType.HTML,
        name: `${graphicsSetup.htmlPackageFolder}/${HTML_GRAPHICS_INDEX_FILENAME}`,
        useStopCommand: false,
        mixer: {
          opacity: 100
        },
        data: {
          display: Tv2CasparCgTemplateDisplayMode.PROGRAM,
          partialUpdate: true,
          slots:
            {
              [Tv2CasparCgTemplateSlotType.SPLIT_SCREEN]: {
                display: Tv2CasparCgTemplateDisplayMode.PROGRAM,
                payload: {
                  type: 'locators',
                  style: locatorLabels && locatorLabels.length > 0
                    ? JSON.parse(splitScreenConfiguration.graphicsTemplateJson)
                    : {},
                  ...locatorLabels
                }
              }
            }
        }
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
