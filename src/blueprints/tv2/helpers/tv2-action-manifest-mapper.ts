import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { ActionManifest } from '../../../model/entities/action'
import {
  SplitScreenBoxInput,
  Tv2ActionManifestData,
  Tv2ActionManifestFullscreenGraphicsData,
  Tv2ActionManifestOverlayGraphicsData,
  Tv2ActionManifestSplitScreenData,
  Tv2ActionManifestSplitScreenSource,
  Tv2ActionManifestVideoClipData,
  Tv2FullscreenGraphicsManifestData,
  Tv2OverlayGraphicsManifestData,
  Tv2SplitScreenManifestData,
  Tv2VideoClipManifestData,
  TvActionManifestSplitScreenSourceType
} from '../value-objects/tv2-action-manifest-data'
import { Tv2SourceMappingWithSound } from '../value-objects/tv2-studio-blueprint-configuration'
import { Tv2MisconfigurationException } from '../exceptions/tv2-misconfiguration-exception'
import { Tv2AudioMode } from '../enums/tv2-audio-mode'

const SPLIT_SCREEN_ACTION_MANIFEST_ID: string = 'select_dve'
const VIDEO_CLIP_ACTION_MANIFEST_ID: string = 'select_server_clip'
const FULLSCREEN_GRAPHICS_ACTION_MANIFEST_ID: string = 'select_full_grafik'
const OVERLAY_GRAPHCIS_ACTION_MANIFEST_IDS: string[] = ['studio0_graphicsLower', 'studio0_graphicsIdent', 'studio0_overlay', 'studio0_pilotOverlay']

export class Tv2ActionManifestMapper {

  public mapToSplitScreenManifestData(blueprintConfiguration: Tv2BlueprintConfiguration, actionManifests: ActionManifest[]): Tv2SplitScreenManifestData[] {
    return actionManifests
      .filter((actionManifest): actionManifest is ActionManifest<Tv2ActionManifestSplitScreenData> => actionManifest.actionId === SPLIT_SCREEN_ACTION_MANIFEST_ID)
      .map(actionManifest => {
        const data: Tv2ActionManifestSplitScreenData = actionManifest.data
        const sources: Map<SplitScreenBoxInput, Tv2SourceMappingWithSound> = this.getSplitScreenSourcesFromActionManifestData(data, blueprintConfiguration)
        return {
          name: data.name,
          rundownId: actionManifest.rundownId,
          template: data.config.template,
          locatorLabels: data.config.labels,
          sources
        }
      })
  }

  private getSplitScreenSourcesFromActionManifestData(data: Tv2ActionManifestSplitScreenData, blueprintConfiguration: Tv2BlueprintConfiguration): Map<SplitScreenBoxInput, Tv2SourceMappingWithSound> {
    const sources: Map<SplitScreenBoxInput, Tv2SourceMappingWithSound> = new Map()
    if (data.config.sources.INP1) {
      sources.set(SplitScreenBoxInput.INPUT_1, this.mapActionManifestSplitScreenSourceToSource(blueprintConfiguration, data.config.sources.INP1))
    }
    if (data.config.sources.INP2) {
      sources.set(SplitScreenBoxInput.INPUT_2, this.mapActionManifestSplitScreenSourceToSource(blueprintConfiguration, data.config.sources.INP2))
    }
    if (data.config.sources.INP3) {
      sources.set(SplitScreenBoxInput.INPUT_3, this.mapActionManifestSplitScreenSourceToSource(blueprintConfiguration, data.config.sources.INP3))
    }
    if (data.config.sources.INP4) {
      sources.set(SplitScreenBoxInput.INPUT_4, this.mapActionManifestSplitScreenSourceToSource(blueprintConfiguration, data.config.sources.INP4))
    }
    return sources
  }

  private mapActionManifestSplitScreenSourceToSource(blueprintConfiguration: Tv2BlueprintConfiguration, splitScreenSource: Tv2ActionManifestSplitScreenSource): Tv2SourceMappingWithSound {
    let sources: Tv2SourceMappingWithSound[] = []
    switch (splitScreenSource.sourceType) {
      case TvActionManifestSplitScreenSourceType.CAMERA: {
        sources = blueprintConfiguration.studio.cameraSources
        break
      }
      case TvActionManifestSplitScreenSourceType.LIVE: {
        sources = blueprintConfiguration.studio.remoteSources
        break
      }
    }
    const source: Tv2SourceMappingWithSound | undefined = sources.find(source => source.name === splitScreenSource.id)
    if (!source) {
      throw new Tv2MisconfigurationException(`No Source Mapping found for split screen source ${splitScreenSource.sourceType} ${splitScreenSource.id}`)
    }
    return source
  }

  public mapToVideoClipManifestData(actionManifests: ActionManifest<Tv2ActionManifestData>[]): Tv2VideoClipManifestData[] {
    return actionManifests
      .filter((actionManifest): actionManifest is ActionManifest<Tv2ActionManifestVideoClipData> => actionManifest.actionId === VIDEO_CLIP_ACTION_MANIFEST_ID)
      .map(actionManifest => {
        const data: Tv2ActionManifestVideoClipData = actionManifest.data
        return {
          name: data.partDefinition.storyName,
          fileName: data.partDefinition.fields.videoId,
          durationFromIngest: data.duration,
          adLibPix: data.adLibPix,
          audioMode: data.voLevels ? Tv2AudioMode.VOICE_OVER : Tv2AudioMode.FULL,
          rundownId: actionManifest.rundownId
        }
      })
  }

  public mapToFullscreenGraphicsManifestData(actionManifests: ActionManifest[]): Tv2FullscreenGraphicsManifestData[] {
    return actionManifests
      .filter((actionManifest): actionManifest is ActionManifest<Tv2ActionManifestFullscreenGraphicsData> => actionManifest.actionId === FULLSCREEN_GRAPHICS_ACTION_MANIFEST_ID)
      .map(actionManifest => {
        const data: Tv2ActionManifestFullscreenGraphicsData = actionManifest.data
        return {
          name: data.name,
          rundownId: actionManifest.rundownId,
          vcpId: data.vcpid
        }
      })
  }

  public mapToOverlayGraphicsData(actionManifests: ActionManifest[]): Tv2OverlayGraphicsManifestData[] {
    return actionManifests
      .filter((actionManifest): actionManifest is ActionManifest<Tv2ActionManifestOverlayGraphicsData> => OVERLAY_GRAPHCIS_ACTION_MANIFEST_IDS.includes(actionManifest.actionId))
      .map(actionManifest => {
        const data: Tv2ActionManifestOverlayGraphicsData = actionManifest.data
        return {
          name: data.name,
          rundownId: actionManifest.rundownId,
          sourceLayerId: data.sourceLayerId,
          templateName: this.getTemplateName(data.name),
          displayText: this.getDisplayText(data.name),
          expectedDuration: data.expectedDuration
        }
      })
  }

  protected getTemplateName(rawName: string): string {
    return rawName.split('-')[0].trim()
  }

  protected getDisplayText(rawText: string): string {
    return rawText.split('-').slice(1).join('-').trim()
  }
}
