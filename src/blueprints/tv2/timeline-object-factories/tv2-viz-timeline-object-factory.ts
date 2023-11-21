import { Tv2GraphicsElementTimelineObjectFactory } from './interfaces/tv2-graphics-element-timeline-object-factory'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import {
  VizMseClearGraphicsTimelineObject,
  VizMseContinueDirection,
  VizMseContinueTimelineObject,
  VizMseElementInternalTimelineObject,
  VizMseElementPilotTimelineObject,
  VizMseLoadAllElementsTimelineObject,
  VizMseTransitionType,
  VizType
} from '../../timeline-state-resolver-types/viz-types'
import { Tv2GraphicsLayer } from '../value-objects/tv2-layers'
import { DeviceType } from '../../../model/enums/device-type'
import {
  Tv2FullscreenGraphicsManifestData,
  Tv2OverlayGraphicsManifestData
} from '../value-objects/tv2-action-manifest-data'
import { Tv2GraphicsCommandTimelineObjectFactory } from './interfaces/tv2-graphics-command-timeline-object-factory'

enum EngineName {
  OVERLAY = 'OVL1',
  FULLSCREEN = 'FULL1',
  WALL = 'WALL1'
}

export class Tv2VizTimelineObjectFactory implements Tv2GraphicsCommandTimelineObjectFactory, Tv2GraphicsElementTimelineObjectFactory {

  public createThemeOutTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration): VizMseElementInternalTimelineObject {
    return {
      id: '',
      enable: {
        start: 0,
        duration: 3000
      },
      priority: 100,
      layer: Tv2GraphicsLayer.GRAPHICS_ACTIONS,
      content: {
        deviceType: DeviceType.VIZ_MSE,
        type: VizType.ELEMENT_INTERNAL,
        templateName: 'OUT_TEMA_H',
        templateData: [],
        showName: blueprintConfiguration.showStyle.selectedGraphicsSetup.overlayShowName ?? ''
      }
    }
  }

  public createOverlayInitializeTimelineObject(): VizMseLoadAllElementsTimelineObject {
    return {
      id: 'loadAllElements',
      enable: {
        start: 0,
        duration: 1000
      },
      priority: 100,
      layer: Tv2GraphicsLayer.GRAPHICS_ACTIONS,
      content: {
        deviceType: DeviceType.VIZ_MSE,
        type: VizType.LOAD_ALL_ELEMENTS
      }
    }
  }

  public createContinueGraphicsTimelineObject(): VizMseContinueTimelineObject {
    return {
      id: '',
      enable: {
        start: 0,
        duration: 1000
      },
      priority: 100,
      layer: Tv2GraphicsLayer.GRAPHICS_ACTIONS,
      content: {
        deviceType: DeviceType.VIZ_MSE,
        type: VizType.CONTINUE,
        direction: VizMseContinueDirection.FORWARD,
        reference: Tv2GraphicsLayer.GRAPHICS_PILOT
      }
    }
  }

  public createClearGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration): VizMseClearGraphicsTimelineObject {
    return {
      id: '',
      enable: {
        start: 0,
        duration: 1000
      },
      priority: 100,
      layer: Tv2GraphicsLayer.GRAPHICS_ACTIONS,
      content: {
        deviceType: DeviceType.VIZ_MSE,
        type: VizType.CLEAR_ALL_ELEMENTS,
        channelsToSendCommands: [EngineName.OVERLAY, EngineName.FULLSCREEN, EngineName.WALL],
        showName: blueprintConfiguration.showStyle.selectedGraphicsSetup.overlayShowName ?? ''
      }
    }
  }

  public createAllOutGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration): VizMseClearGraphicsTimelineObject {
    return {
      id: '',
      enable: {
        start: 0,
        duration: 3000
      },
      priority: 100,
      layer: Tv2GraphicsLayer.GRAPHICS_ACTIONS,
      content: {
        deviceType: DeviceType.VIZ_MSE,
        type: VizType.CLEAR_ALL_ELEMENTS,
        showName: blueprintConfiguration.showStyle.selectedGraphicsSetup.overlayShowName ?? ''
      }
    }
  }

  public createFullscreenGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, fullscreenGraphicsData: Tv2FullscreenGraphicsManifestData): VizMseElementPilotTimelineObject {
    return {
      id: 'full',
      enable: {
        start: 0
      },
      priority: 1,
      layer: Tv2GraphicsLayer.GRAPHICS_PILOT,
      content: {
        deviceType: DeviceType.VIZ_MSE,
        type: VizType.ELEMENT_PILOT,
        templateVcpId: fullscreenGraphicsData.vcpId,
        continueStep: -1,
        noAutoPreloading: false,
        channelName: EngineName.FULLSCREEN,
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
    if (!blueprintConfiguration.studio.shouldPreventOverlayWhileFullscreenGraphicsIsOnAir) {
      return {}
    }
    return {
      delayTakeAfterOutTransition: true,
      outTransition: {
        type: VizMseTransitionType.DELAY,
        delay: blueprintConfiguration.studio.vizPilotGraphics.msKeepPilotGraphicsAliveBeforeTakingNext
      }
    }
  }

  public createIdentGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, overlayGraphicsData: Tv2OverlayGraphicsManifestData): VizMseElementInternalTimelineObject {
    return {
      id: 'ident',
      enable: {
        start: 0
      },
      priority: 1,
      layer: Tv2GraphicsLayer.GRAPHICS_OVERLAY_IDENT,
      content: this.createOverlayGraphicsTimelineObjectContent(blueprintConfiguration, overlayGraphicsData)
    }
  }

  private createOverlayGraphicsTimelineObjectContent(
    blueprintConfiguration: Tv2BlueprintConfiguration,
    overlayGraphicsData: Tv2OverlayGraphicsManifestData
  ): VizMseElementInternalTimelineObject['content'] {
    return {
      deviceType: DeviceType.VIZ_MSE,
      type: VizType.ELEMENT_INTERNAL,
      templateName: overlayGraphicsData.templateName,
      templateData: [overlayGraphicsData.displayText],
      channelName: EngineName.OVERLAY,
      showName: blueprintConfiguration.showStyle.selectedGraphicsSetup.overlayShowName ?? ''
    }
  }

  public createLowerThirdGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, overlayGraphicsData: Tv2OverlayGraphicsManifestData): VizMseElementInternalTimelineObject {
    return {
      id: 'lowerThird',
      enable: {
        start: 0
      },
      priority: 1,
      layer: Tv2GraphicsLayer.GRAPHICS_OVERLAY_LOWER,
      content: this.createOverlayGraphicsTimelineObjectContent(blueprintConfiguration, overlayGraphicsData)
    }
  }
}
