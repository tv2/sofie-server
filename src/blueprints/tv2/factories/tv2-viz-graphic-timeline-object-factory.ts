import { Tv2GraphicTimelineObjectFactory } from '../value-objects/factories/tv2-graphic-timeline-object-factory'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import {
  VizMseClearGraphicTimelineObjectContent,
  VizMseContinueTimelineObject,
  VizMseElementInternalTimelineObject,
  VizMseLoadAllElementsTimelineObject,
  VizType
} from '../../timeline-state-resolver-types/viz-types'
import { Tv2GraphicLayer } from '../value-objects/tv2-layers'
import { DeviceType } from '../../../model/enums/device-type'
import { TimelineObject } from '../../../model/entities/timeline-object'

export class Tv2VizGraphicTimelineObjectFactory implements Tv2GraphicTimelineObjectFactory {
  public createThemeOutTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, duration: number): VizMseElementInternalTimelineObject {
    return {
      id: '',
      enable: {
        start: 0,
        duration
      },
      priority: 100,
      layer: Tv2GraphicLayer.GRAPHIC_ACTIONS,
      content: {
        deviceType: DeviceType.VIZMSE,
        type: VizType.ELEMENT_INTERNAL,
        templateName: 'OUT_TEMA_H',
        templateData: [],
        showName: blueprintConfiguration.showStyle.selectedGraphicSetup.OvlShowName ?? ''
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
      layer: Tv2GraphicLayer.GRAPHIC_ACTIONS,
      content: {
        deviceType: DeviceType.VIZMSE,
        type: VizType.LOAD_ALL_ELEMENTS
      }
    }
  }

  public createContinueGraphicTimelineObject(duration: number): VizMseContinueTimelineObject {
    return {
      id: '',
      enable: {
        start: 0,
        duration
      },
      priority: 100,
      layer: Tv2GraphicLayer.GRAPHIC_ACTIONS,
      content: {
        deviceType: DeviceType.VIZMSE,
        type: VizType.CONTINUE,
        direction: 1,
        reference: Tv2GraphicLayer.GRAPHIC_PILOT
      }
    }
  }

  public createClearGraphicTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, duration: number): TimelineObject {
    return this.createBaseTimelineObjectWithContent(
      duration,
      this.createClearGraphicContent(blueprintConfiguration)
    )
  }

  private createClearGraphicContent(blueprintConfiguration: Tv2BlueprintConfiguration): VizMseClearGraphicTimelineObjectContent {
    return {
      deviceType: DeviceType.VIZMSE,
      type: VizType.CLEAR_ALL_ELEMENTS,
      channelsToSendCommands: ['OVL1', 'FULL1', 'WALL1'],
      showName: blueprintConfiguration.showStyle.selectedGraphicSetup.OvlShowName ?? ''
    }
  }

  private createBaseTimelineObjectWithContent(duration: number, content: VizMseClearGraphicTimelineObjectContent): TimelineObject {
    return {
      id: '',
      enable: {
        start: 0,
        duration
      },
      priority: 100,
      layer: Tv2GraphicLayer.GRAPHIC_ACTIONS,
      content: content
    }
  }

  public createAllOutGraphicTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, duration: number): TimelineObject {
    return this.createBaseTimelineObjectWithContent(
      duration,
      this.createAllOutGraphicContent(blueprintConfiguration)
    )
  }

  private createAllOutGraphicContent(blueprintConfiguration: Tv2BlueprintConfiguration): VizMseClearGraphicTimelineObjectContent {
    return {
      deviceType: DeviceType.VIZMSE,
      type: VizType.CLEAR_ALL_ELEMENTS,
      channelsToSendCommands: undefined,
      showName: blueprintConfiguration.showStyle.selectedGraphicSetup.OvlShowName ?? ''
    }
  }


}