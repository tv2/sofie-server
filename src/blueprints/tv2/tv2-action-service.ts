import { BlueprintGenerateActions } from '../../model/value-objects/blueprint'
import { Configuration } from '../../model/entities/configuration'
import { Action, ActionManifest, MutateActionMethods } from '../../model/entities/action'
import { Tv2StudioBlueprintConfiguration } from './value-objects/tv2-studio-blueprint-configuration'
import { Tv2BlueprintConfiguration } from './value-objects/tv2-blueprint-configuration'
import {
  GraphicsDefault,
  GraphicsSetup,
  Tv2ShowStyleBlueprintConfiguration
} from './value-objects/tv2-show-style-blueprint-configuration'
import { ShowStyle } from '../../model/entities/show-style'
import { Tv2CameraActionFactory } from './action-factories/tv2-camera-action-factory'
import { Tv2TransitionActionFactory } from './action-factories/tv2-transition-action-factory'
import { Tv2AudioActionFactory } from './action-factories/tv2-audio-action-factory'
import { Tv2GraphicsActionFactory } from './action-factories/tv2-graphics-action-factory'
import {
  Tv2VideoMixerConfigurationActionFactory
} from './action-factories/tv2-video-mixer-configuration-action-factory'
import { Tv2VideoClipActionFactory } from './action-factories/tv2-video-clip-action-factory'
import { Tv2ActionManifestData, Tv2VideoClipData } from './value-objects/tv2-video-clip-data'
import { Tv2PieceType } from './enums/tv2-piece-type'
import { Tv2ActionManifest } from './value-objects/tv2-action-manifest'
import { UnexpectedCaseException } from '../../model/exceptions/unexpected-case-exception'


export class Tv2ActionService implements BlueprintGenerateActions {
  constructor(
    private readonly cameraActionFactory: Tv2CameraActionFactory,
    private readonly transitionActionFactory: Tv2TransitionActionFactory,
    private readonly audioActionFactory: Tv2AudioActionFactory,
    private readonly graphicsActionFactory: Tv2GraphicsActionFactory,
    private readonly videoClipActionFactory: Tv2VideoClipActionFactory,
    private readonly videoMixerActionFactory: Tv2VideoMixerConfigurationActionFactory
  ) {}

  public getMutateActionMethods(action: Action): MutateActionMethods | undefined {
    if (this.transitionActionFactory.isTransitionAction(action)) {
      return this.transitionActionFactory.getMutateActionMethods(action)
    }
    if (this.videoClipActionFactory.isVideoClipAction(action)) {
      return this.videoClipActionFactory.getMutateActionMethods(action)
    }
  }

  public generateActions(configuration: Configuration, actionManifests: Tv2ActionManifest[]): Action[] {
    const blueprintConfiguration: Tv2BlueprintConfiguration = {
      studio: configuration.studio.blueprintConfiguration as Tv2StudioBlueprintConfiguration,
      showStyle: this.mapToShowStyleBlueprintConfiguration(configuration.showStyle)
    }

    return [
      ...this.cameraActionFactory.createCameraActions(blueprintConfiguration),
      ...this.audioActionFactory.createAudioActions(blueprintConfiguration),
      ...this.transitionActionFactory.createTransitionActions(),
      ...this.graphicsActionFactory.createGraphicsActions(blueprintConfiguration),
      ...this.videoClipActionFactory.createVideoClipActions(blueprintConfiguration, this.getVideoClipData(actionManifests)),
      ...this.videoMixerActionFactory.createVideoMixerActions(blueprintConfiguration)
    ]
  }

  private mapToShowStyleBlueprintConfiguration(showStyle: ShowStyle): Tv2ShowStyleBlueprintConfiguration {
    const blueprintConfiguration: Tv2ShowStyleBlueprintConfiguration = { ...(showStyle.blueprintConfiguration as Tv2ShowStyleBlueprintConfiguration) }
    blueprintConfiguration.GfxDefaults = (blueprintConfiguration.GfxDefaults as unknown as GraphicsDefault[])[0] // Hack to not have saved as array of length 1.

    const graphicsSetup: GraphicsSetup | undefined = blueprintConfiguration.GfxSetups.find(
      graphicsSetup => graphicsSetup._id === blueprintConfiguration.GfxDefaults.DefaultSetupName.value
    )
    if (!graphicsSetup) {
      console.warn('Failed to find Selected Graphic Setup')
      return blueprintConfiguration
    }
    blueprintConfiguration.selectedGraphicsSetup = graphicsSetup
    return blueprintConfiguration
  }

  private getVideoClipData(actionManifests: ActionManifest<Tv2ActionManifestData>[]): Tv2VideoClipData[] {
    return actionManifests
      .filter(actionManifest => this.getPieceTypeFromActionManifest(actionManifest) === Tv2PieceType.VIDEO_CLIP)
      .map(actionManifest => {
        const data: Tv2ActionManifestData = actionManifest.data
        return {
          name: data.partDefinition.storyName,
          fileName: data.partDefinition.fields.videoId,
          durationFromIngest: data.duration,
          adLibPix: data.adLibPix,
          isVoiceOver: data.voLevels
        }
      })
  }

  private getPieceTypeFromActionManifest(actionManifest: ActionManifest): Tv2PieceType {
    switch (actionManifest.actionId) {
      case 'select_full_grafik': {
        return Tv2PieceType.CAMERA
      }
      case 'select_server_clip': {
        return Tv2PieceType.VIDEO_CLIP
      }
      case 'select_dve': {
        return Tv2PieceType.SPLIT_SCREEN
      }
      default: {
        throw new UnexpectedCaseException(`Unknown MongoActionManifestId: ${actionManifest.actionId}`)
      }
    }
  }
}
