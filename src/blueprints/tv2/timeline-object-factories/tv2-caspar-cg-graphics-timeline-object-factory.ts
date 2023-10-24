import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { TimelineObject } from '../../../model/entities/timeline-object'
import { UnsupportedOperation } from '../../../model/exceptions/unsupported-operation'
import { Tv2BaseGraphicTimelineObjectFactory } from './tv2-base-graphic-timeline-object-factory'
import { Tv2GraphicsTimelineObjectFactory } from './interfaces/tv2-graphics-timeline-object-factory'
import { Tv2GraphicsActionManifest } from '../value-objects/tv2-action-manifest'
import { DeviceType } from '../../../model/enums/device-type'
import {
  CasparCgTemplateData,
  CasparCgTemplateTimelineObject,
  CasparCgType
} from '../../timeline-state-resolver-types/caspar-cg-types'
import { Tv2GraphicsLayer } from '../value-objects/tv2-layers'
import { Tv2GraphicsTarget } from '../value-objects/tv2-graphics-target'
import { Tv2CasparCgPathFixer } from '../helpers/tv2-caspar-cg-path-fixer'

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

  public createFullGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, manifest: Tv2GraphicsActionManifest): CasparCgTemplateTimelineObject {
    const rawGraphicsFolder: string | undefined = blueprintConfiguration.studio.GraphicFolder
    const sceneChunks: string[] = manifest.userData.name.split('/')
    const sceneName: string = sceneChunks[sceneChunks.length - 1]
    const fileName: string = this.casparCgPathFixer.joinAssetToFolder(sceneName, rawGraphicsFolder)

    return {
      id: '',
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
      default: return ''
    }
  }




}