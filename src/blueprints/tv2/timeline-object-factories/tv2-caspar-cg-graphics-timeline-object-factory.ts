import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { TimelineObject } from '../../../model/entities/timeline-object'
import { UnsupportedOperation } from '../../../model/exceptions/unsupported-operation'
import { Tv2BaseGraphicTimelineObjectFactory } from './tv2-base-graphic-timeline-object-factory'
import { Tv2GraphicsTimelineObjectFactory } from './interfaces/tv2-graphics-timeline-object-factory'
import { DeviceType } from '../../../model/enums/device-type'
import {
  CasparCgTemplateData,
  CasparCgTemplateTimelineObject,
  CasparCgType
} from '../../timeline-state-resolver-types/caspar-cg-types'
import { Tv2GraphicsLayer } from '../value-objects/tv2-layers'
import { Tv2GraphicsTarget } from '../value-objects/tv2-graphics-target'
import { Tv2CasparCgPathFixer } from '../helpers/tv2-caspar-cg-path-fixer'
import { MisconfigurationException } from '../../../model/exceptions/misconfiguration-exception'
import { Tv2GraphicsData } from '../value-objects/tv2-action-manifest-data'

export class Tv2CasparCgGraphicsTimelineObjectFactory extends Tv2BaseGraphicTimelineObjectFactory implements Tv2GraphicsTimelineObjectFactory {
  constructor(private readonly casparCgPathFixer: Tv2CasparCgPathFixer) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public createAllOutGraphicsTimelineObject(_blueprintConfiguration: Tv2BlueprintConfiguration, _duration: number): TimelineObject {
    throw new UnsupportedOperation(
      `'${Tv2CasparCgGraphicsTimelineObjectFactory.name}' has no implementation for '${Tv2CasparCgGraphicsTimelineObjectFactory.prototype.createAllOutGraphicsTimelineObject}'`
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public createClearGraphicsTimelineObject(_blueprintConfiguration: Tv2BlueprintConfiguration, _duration: number): TimelineObject {
    throw new UnsupportedOperation(
      `'${Tv2CasparCgGraphicsTimelineObjectFactory.name}' has no implementation for '${Tv2CasparCgGraphicsTimelineObjectFactory.prototype.createClearGraphicsTimelineObject}'`
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public createContinueGraphicsTimelineObject(_duration: number): TimelineObject {
    throw new UnsupportedOperation(
      `'${Tv2CasparCgGraphicsTimelineObjectFactory.name}' has no implementation for '${Tv2CasparCgGraphicsTimelineObjectFactory.prototype.createContinueGraphicsTimelineObject}'`
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public createOverlayInitializeTimelineObject(_duration: number): TimelineObject {
    throw new UnsupportedOperation(
      `'${Tv2CasparCgGraphicsTimelineObjectFactory.name}' has no implementation for '${Tv2CasparCgGraphicsTimelineObjectFactory.prototype.createOverlayInitializeTimelineObject}'`
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public createThemeOutTimelineObject(_blueprintConfiguration: Tv2BlueprintConfiguration, _duration: number): TimelineObject {
    throw new UnsupportedOperation(
      `'${Tv2CasparCgGraphicsTimelineObjectFactory.name}' has no implementation for '${Tv2CasparCgGraphicsTimelineObjectFactory.prototype.createThemeOutTimelineObject}'`
    )
  }

  public createFullGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, graphicsData: Tv2GraphicsData): CasparCgTemplateTimelineObject {
    const rawGraphicsFolder: string | undefined = blueprintConfiguration.studio.GraphicFolder
    const sceneChunks: string[] = graphicsData.name.split('/')
    const sceneName: string = sceneChunks[sceneChunks.length - 1]
    const fileName: string = this.casparCgPathFixer.joinAssetToFolder(sceneName, rawGraphicsFolder)

    return {
      id: 'full',
      enable: {
        while: 1
      },
      priority: 100,
      layer: this.getLayerNameFromGraphicTarget(Tv2GraphicsTarget.FULL),
      content: {
        deviceType: DeviceType.CASPAR_CG,
        type: CasparCgType.TEMPLATE,
        templateType: 'html',
        name: this.casparCgPathFixer.joinAssetToFolder('index', blueprintConfiguration.showStyle.selectedGraphicsSetup.HtmlPackageFolder),
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
      default: return ''
    }
  }

  public createIdentGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, graphicsData: Tv2GraphicsData): CasparCgTemplateTimelineObject {
    return {
      id: 'ident',
      priority: 1,
      enable: {
        start: 0
      },
      layer: Tv2GraphicsLayer.GRAPHICS_OVERLAY_IDENT,
      content: {
        deviceType: DeviceType.CASPAR_CG,
        type: CasparCgType.TEMPLATE,
        templateType: 'html',
        name: this.casparCgPathFixer.joinAssetToFolder('index', blueprintConfiguration.showStyle.selectedGraphicsSetup.HtmlPackageFolder),
        useStopCommand: false,
        mixer: {
          opacity: 100
        },
        data: {
          display: 'program',
          partialUpdate: true,
          slots: {
            [this.mapTv2GraphicsLayerToHtmlGraphicsSlot(Tv2GraphicsLayer.GRAPHICS_OVERLAY_IDENT)]: {
              display: 'program',
              payload: {
                type: this.getTemplateNameFromGraphicsData(graphicsData),
                0: this.getDisplayTextFromGraphicsData(graphicsData)
              }
            }
          }
        }
      }
    }
  }


}