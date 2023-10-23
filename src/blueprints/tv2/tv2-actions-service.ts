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
import { PieceType } from '../../model/enums/piece-type'
import { Tv2GraphicsActionManifest } from './value-objects/tv2-action-manifest'

export class Tv2ActionsService implements BlueprintGenerateActions {
  constructor(
    private readonly cameraActionFactory: Tv2CameraActionFactory,
    private readonly transitionActionFactory: Tv2TransitionActionFactory,
    private readonly audioActionFactory: Tv2AudioActionFactory,
    private readonly graphicsActionFactory: Tv2GraphicsActionFactory,
    private readonly videoSwitcherActionFactory: Tv2VideoMixerConfigurationActionFactory
  ) {}

  public getMutateActionMethods(action: Action): MutateActionMethods | undefined {
    if (this.transitionActionFactory.isTransitionAction(action)) {
      return this.transitionActionFactory.getMutateActionMethods(action)
    }
  }

  public generateActions(configuration: Configuration, actionManifests: ActionManifest[]): Action[] {
    const blueprintConfiguration: Tv2BlueprintConfiguration = {
      studio: configuration.studio.blueprintConfiguration as Tv2StudioBlueprintConfiguration,
      showStyle: this.mapToShowStyleBlueprintConfiguration(configuration.showStyle)
    }

    return [
      ...this.cameraActionFactory.createCameraActions(blueprintConfiguration),
      ...this.audioActionFactory.createAudioActions(blueprintConfiguration),
      ...this.transitionActionFactory.createTransitionActions(),
      ...this.graphicsActionFactory.createGraphicsActions(blueprintConfiguration, this.getActionManifestsSubset(actionManifests, PieceType.GRAPHIC) as Tv2GraphicsActionManifest[]),
      ...this.videoSwitcherActionFactory.createVideoMixerActions(blueprintConfiguration)
    ]
  }

  private getActionManifestsSubset(actionManifests: ActionManifest[], pieceType: PieceType): ActionManifest[] {
    return actionManifests.filter(manifest => manifest.pieceType === pieceType)
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
}
