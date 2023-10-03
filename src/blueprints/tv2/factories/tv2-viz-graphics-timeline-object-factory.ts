import { Tv2GraphicsTimelineObjectFactory } from '../value-objects/tv2-graphics-timeline-object-factory'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import {
  VizMseContinueTimelineObject,
  VizMseElementInternalTimelineObject,
  VizMseLoadAllElementsTimelineObject,
  VizType
} from '../../timeline-state-resolver-types/viz-types'
import { Tv2VizLayer } from '../value-objects/tv2-layers'
import { DeviceType } from '../../../model/enums/device-type'

export class Tv2VizGraphicsTimelineObjectFactory implements Tv2GraphicsTimelineObjectFactory {
  public createThemeOutTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, duration: number): VizMseElementInternalTimelineObject {
    return {
      id: '',
      enable: {
        start: 0,
        duration
      },
      priority: 100,
      layer: Tv2VizLayer.GRAPHIC_ACTIONS,
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
      layer: Tv2VizLayer.GRAPHIC_ACTIONS,
      content: {
        deviceType: DeviceType.VIZMSE,
        type: VizType.LOAD_ALL_ELEMENTS
      }
    }
  }

  public createContinueGraphicsTimelineObject(duration: number): VizMseContinueTimelineObject {
    return {
      id: '',
      enable: {
        start: 0,
        duration
      },
      priority: 100,
      layer: Tv2VizLayer.GRAPHIC_ACTIONS,
      content: {
        deviceType: DeviceType.VIZMSE,
        type: VizType.CONTINUE,
        direction: 1,
        reference: Tv2VizLayer.GRAPHIC_PILOT     
      }
    }
  }

}