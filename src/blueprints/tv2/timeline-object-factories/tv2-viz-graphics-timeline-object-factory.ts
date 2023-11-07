import { Tv2GraphicsTimelineObjectFactory } from './interfaces/tv2-graphics-timeline-object-factory'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import {
  VizMseClearGraphicsTimelineObjectContent,
  VizMseContinueTimelineObject,
  VizMseElementInternalTimelineObject,
  VizMseElementPilotTimelineObject,
  VizMseLoadAllElementsTimelineObject,
  VizMseTransitionType,
  VizType
} from '../../timeline-state-resolver-types/viz-types'
import { Tv2GraphicsLayer } from '../value-objects/tv2-layers'
import { DeviceType } from '../../../model/enums/device-type'
import { TimelineObject } from '../../../model/entities/timeline-object'
import { Tv2BaseGraphicTimelineObjectFactory } from './tv2-base-graphic-timeline-object-factory'
import { Tv2GraphicsData } from '../value-objects/tv2-action-manifest-data'

export class Tv2VizGraphicsTimelineObjectFactory extends Tv2BaseGraphicTimelineObjectFactory implements Tv2GraphicsTimelineObjectFactory {
  public createThemeOutTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, duration: number): VizMseElementInternalTimelineObject {
    return {
      id: '',
      enable: {
        start: 0,
        duration
      },
      priority: 100,
      layer: Tv2GraphicsLayer.GRAPHICS_ACTIONS,
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
      layer: Tv2GraphicsLayer.GRAPHICS_ACTIONS,
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
      layer: Tv2GraphicsLayer.GRAPHICS_ACTIONS,
      content: {
        deviceType: DeviceType.VIZMSE,
        type: VizType.CONTINUE,
        direction: 1,
        reference: Tv2GraphicsLayer.GRAPHICS_PILOT
      }
    }
  }

  public createClearGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, duration: number): TimelineObject {
    return this.createBaseTimelineObjectWithContent(
      duration,
      this.createClearGraphicContent(blueprintConfiguration)
    )
  }

  private createClearGraphicContent(blueprintConfiguration: Tv2BlueprintConfiguration): VizMseClearGraphicsTimelineObjectContent {
    return {
      deviceType: DeviceType.VIZMSE,
      type: VizType.CLEAR_ALL_ELEMENTS,
      channelsToSendCommands: ['OVL1', 'FULL1', 'WALL1'],
      showName: blueprintConfiguration.showStyle.selectedGraphicsSetup.OvlShowName ?? ''
    }
  }

  private createBaseTimelineObjectWithContent(duration: number, content: VizMseClearGraphicsTimelineObjectContent): TimelineObject {
    return {
      id: '',
      enable: {
        start: 0,
        duration
      },
      priority: 100,
      layer: Tv2GraphicsLayer.GRAPHICS_ACTIONS,
      content: content
    }
  }

  public createAllOutGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, duration: number): TimelineObject {
    return this.createBaseTimelineObjectWithContent(
      duration,
      this.createAllOutGraphicContent(blueprintConfiguration)
    )
  }

  private createAllOutGraphicContent(blueprintConfiguration: Tv2BlueprintConfiguration): VizMseClearGraphicsTimelineObjectContent {
    return {
      deviceType: DeviceType.VIZMSE,
      type: VizType.CLEAR_ALL_ELEMENTS,
      channelsToSendCommands: undefined,
      showName: blueprintConfiguration.showStyle.selectedGraphicsSetup.OvlShowName ?? ''
    }
  }

  public createFullGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, graphicsData: Tv2GraphicsData): VizMseElementPilotTimelineObject {
    return {
      id: 'full',
      enable: {
        start: 0
      },
      priority: 1,
      layer: Tv2GraphicsLayer.GRAPHICS_PILOT,
      content: {
        deviceType: DeviceType.VIZMSE,
        type: VizType.ELEMENT_PILOT,
        templateVcpId: graphicsData.vcpId!,
        continueStep: -1,
        noAutoPreloading: false,
        channelName: 'FULL1',
        ...this.getFullGraphicOutTransitionProperties(blueprintConfiguration)
      }
    }
  }

  private getFullGraphicOutTransitionProperties(
    blueprintConfiguration: Tv2BlueprintConfiguration
  ): {
      delayTakeAfterOutTransition?: boolean
      outTransition?: VizMseElementPilotTimelineObject['content']['outTransition']
    } {
    if (!blueprintConfiguration.studio.PreventOverlayWithFull) {
      return {}
    }
    return {
      delayTakeAfterOutTransition: true,
      outTransition: {
        type: VizMseTransitionType.DELAY,
        delay: blueprintConfiguration.studio.VizPilotGraphics.OutTransitionDuration
      }
    }
  }

  public createIdentGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, graphicsData: Tv2GraphicsData): VizMseElementInternalTimelineObject {
    return {
      id: 'ident',
      enable: {
        start: 0
      },
      priority: 1,
      layer: Tv2GraphicsLayer.GRAPHICS_OVERLAY_IDENT,
      content: this.createOverlayGraphicsTimelineObjectContent(blueprintConfiguration, graphicsData)
    }
  }

  private createOverlayGraphicsTimelineObjectContent(
    blueprintConfiguration: Tv2BlueprintConfiguration,
    graphicsData: Tv2GraphicsData
  ): VizMseElementInternalTimelineObject['content'] {
    return {
      deviceType: DeviceType.VIZMSE,
      type: VizType.ELEMENT_INTERNAL,
      templateName: this.getTemplateName(graphicsData),
      templateData: [this.getDisplayText(graphicsData)],
      channelName: 'OVL1',
      showName: blueprintConfiguration.showStyle.selectedGraphicsSetup.OvlShowName ?? ''
    }
  }

  public createLowerThirdGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, graphicsData: Tv2GraphicsData): VizMseElementInternalTimelineObject {
    return {
      id: 'lowerThird',
      enable: {
        start: 0
      },
      priority: 1,
      layer: Tv2GraphicsLayer.GRAPHICS_OVERLAY_LOWER,
      content: this.createOverlayGraphicsTimelineObjectContent(blueprintConfiguration, graphicsData)
    }
  }
}