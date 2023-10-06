import { Tv2GfxTimelineObjectFactory } from '../value-objects/factories/tv2-gfx-timeline-object-factory'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import {
  VizMseClearGfxTimelineObject,
  VizMseContinueTimelineObject,
  VizMseElementInternalTimelineObject,
  VizMseLoadAllElementsTimelineObject,
  VizType
} from '../../timeline-state-resolver-types/viz-types'
import { Tv2VizLayer } from '../value-objects/tv2-layers'
import { DeviceType } from '../../../model/enums/device-type'

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
        showName: blueprintConfiguration.showStyle.selectedGraphicsSetup.OvlShowName ?? ''
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
    return this.buildGfxClearTimelineObject(blueprintConfiguration, duration, true)
  }

  private buildGfxClearTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, duration: number, sendCommands: boolean): VizMseClearGfxTimelineObject {
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
        type: VizType.CLEAR_ALL_ELEMENTS,
        channelsToSendCommands: sendCommands ? ['OVL1', 'FULL1', 'WALL1'] : undefined,
        showName: blueprintConfiguration.showStyle.selectedGraphicsSetup.OvlShowName ?? ''
      }
    }
  }

  public createGfxAlternativeOutTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, duration: number): VizMseClearGfxTimelineObject {
    return this.buildGfxClearTimelineObject(blueprintConfiguration, duration, false)

  }

}