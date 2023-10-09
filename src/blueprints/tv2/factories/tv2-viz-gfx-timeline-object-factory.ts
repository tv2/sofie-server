import { Tv2GfxTimelineObjectFactory } from '../value-objects/factories/tv2-gfx-timeline-object-factory'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import {
  GiveMeANameTimelineObject,
  VizMseClearGfxTimelineObject,
  VizMseContinueTimelineObject,
  VizMseElementInternalTimelineObject,
  VizMseLoadAllElementsTimelineObject,
  VizType
} from '../../timeline-state-resolver-types/viz-types'
import { Tv2VizLayer } from '../value-objects/tv2-layers'
import { DeviceType } from '../../../model/enums/device-type'
import { TimelineObject } from '../../../model/entities/timeline-object'
import { Tv2DownstreamKeyer } from '../value-objects/tv2-studio-blueprint-configuration'

export class Tv2VizGfxTimelineObjectFactory implements Tv2GfxTimelineObjectFactory {
  public createThemeOutTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, duration: number): VizMseElementInternalTimelineObject {
    return {
      id: '',
      enable: {
        start: 0,
        duration
      },
      priority: 100,
      layer: Tv2VizLayer.GFX_ACTIONS,
      content: {
        deviceType: DeviceType.VIZMSE,
        type: VizType.ELEMENT_INTERNAL,
        templateName: 'OUT_TEMA_H',
        templateData: [],
        showName: blueprintConfiguration.showStyle.selectedGfxSetup.OvlShowName ?? ''
      }
    }
  }

  public createOverlayInitializeTimelineObject(duration: number): VizMseLoadAllElementsTimelineObject {
    return {
      id: 'loadAllElements',
      enable: {
        start: 0,
        duration
      },
      priority: 100,
      layer: Tv2VizLayer.GFX_ACTIONS,
      content: {
        deviceType: DeviceType.VIZMSE,
        type: VizType.LOAD_ALL_ELEMENTS
      }
    }
  }

  public createContinueGfxTimelineObject(duration: number): VizMseContinueTimelineObject {
    return {
      id: '',
      enable: {
        start: 0,
        duration
      },
      priority: 100,
      layer: Tv2VizLayer.GFX_ACTIONS,
      content: {
        deviceType: DeviceType.VIZMSE,
        type: VizType.CONTINUE,
        direction: 1,
        reference: Tv2VizLayer.GRAPHIC_PILOT     
      }
    }
  }

  public createGfxClearTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, duration: number): VizMseClearGfxTimelineObject {
    return (this.createBaseTimelineObjectWithContent(
      duration,
      this.createGfxClearContent(blueprintConfiguration)
    ) as VizMseClearGfxTimelineObject)
  }

  private createGfxClearContent(blueprintConfiguration: Tv2BlueprintConfiguration): object {
    return {
      deviceType: DeviceType.VIZMSE,
      type: VizType.CLEAR_ALL_ELEMENTS,
      channelsToSendCommands: ['OVL1', 'FULL1', 'WALL1'],
      showName: blueprintConfiguration.showStyle.selectedGfxSetup.OvlShowName ?? ''
    }
  }

  private createBaseTimelineObjectWithContent(duration: number, content: object): TimelineObject {
    return {
      id: '',
      enable: {
        start: 0,
        duration
      },
      priority: 100,
      layer: Tv2VizLayer.GFX_ACTIONS,
      content: content
    }
  }

  public createGfxAlternativeOutTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, duration: number): VizMseClearGfxTimelineObject {
    return (this.createBaseTimelineObjectWithContent(
      duration,
      this.createAlternativeGfxClearContent(blueprintConfiguration)
    ) as VizMseClearGfxTimelineObject)
  }

  private createAlternativeGfxClearContent(blueprintConfiguration: Tv2BlueprintConfiguration): object {
    return {
      deviceType: DeviceType.VIZMSE,
      type: VizType.CLEAR_ALL_ELEMENTS,
      channelsToSendCommands: undefined,
      showName: blueprintConfiguration.showStyle.selectedGfxSetup.OvlShowName ?? ''
    }
  }

  public createDownstreamKeyerOnTimelineObject(downstreamKeyer: Tv2DownstreamKeyer, layer: string): GiveMeANameTimelineObject {
    return {
      id: '',
      enable: {
        while: 1
      },
      priority: 10,
      layer: layer,
      content: {
        onAir: !downstreamKeyer.DefaultOn,
        config: downstreamKeyer
      }
    }
  }

}