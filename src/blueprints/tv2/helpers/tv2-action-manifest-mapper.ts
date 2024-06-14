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
import { PieceLifespan } from '../../../model/enums/piece-lifespan'

const SPLIT_SCREEN_ACTION_MANIFEST_ID: string = 'select_dve'
const VIDEO_CLIP_ACTION_MANIFEST_ID: string = 'select_server_clip'
const FULLSCREEN_GRAPHICS_ACTION_MANIFEST_ID: string = 'select_full_grafik'
const OVERLAY_GRAPHICS_ACTION_MANIFEST_IDS: string[] = ['studio0_graphicsLower', 'studio0_graphicsIdent', 'studio0_overlay', 'studio0_pilotOverlay']

export class Tv2ActionManifestMapper {

  public mapToSplitScreenManifestData(blueprintConfiguration: Tv2BlueprintConfiguration, actionManifests: ActionManifest[]): Tv2SplitScreenManifestData[] {
    return actionManifests
      .filter((actionManifest): actionManifest is ActionManifest<Tv2ActionManifestSplitScreenData> => actionManifest.actionId === SPLIT_SCREEN_ACTION_MANIFEST_ID)
      .map(actionManifest => {
        const data: Tv2ActionManifestSplitScreenData = actionManifest.data
        const sources: Map<SplitScreenBoxInput, Tv2SourceMappingWithSound> = this.getSplitScreenSourcesFromActionManifestData(data, blueprintConfiguration)
        return {
          name: data.userData.name,
          rank: data.rank,
          rundownId: actionManifest.rundownId,
          template: data.userData.config.template,
          locatorLabels: data.userData.config.labels,
          sources
        }
      })
  }

  private getSplitScreenSourcesFromActionManifestData(data: Tv2ActionManifestSplitScreenData, blueprintConfiguration: Tv2BlueprintConfiguration): Map<SplitScreenBoxInput, Tv2SourceMappingWithSound> {
    const sources: Map<SplitScreenBoxInput, Tv2SourceMappingWithSound> = new Map()
    if (data.userData.config.sources.INP1) {
      sources.set(SplitScreenBoxInput.INPUT_1, this.mapActionManifestSplitScreenSourceToSource(blueprintConfiguration, data.userData.config.sources.INP1))
    }
    if (data.userData.config.sources.INP2) {
      sources.set(SplitScreenBoxInput.INPUT_2, this.mapActionManifestSplitScreenSourceToSource(blueprintConfiguration, data.userData.config.sources.INP2))
    }
    if (data.userData.config.sources.INP3) {
      sources.set(SplitScreenBoxInput.INPUT_3, this.mapActionManifestSplitScreenSourceToSource(blueprintConfiguration, data.userData.config.sources.INP3))
    }
    if (data.userData.config.sources.INP4) {
      sources.set(SplitScreenBoxInput.INPUT_4, this.mapActionManifestSplitScreenSourceToSource(blueprintConfiguration, data.userData.config.sources.INP4))
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
          name: data.userData.partDefinition.storyName,
          rank: data.rank,
          fileName: data.userData.partDefinition.fields.videoId,
          durationFromIngest: data.userData.duration,
          adLibPix: data.userData.adLibPix,
          audioMode: data.userData.voLevels ? Tv2AudioMode.VOICE_OVER : Tv2AudioMode.FULL,
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
          name: data.userData.name,
          rank: data.rank,
          rundownId: actionManifest.rundownId,
          vcpId: data.userData.vcpid
        }
      })
  }

  public mapToOverlayGraphicsData(actionManifests: ActionManifest[]): Tv2OverlayGraphicsManifestData[] {
    return actionManifests
      .filter((actionManifest): actionManifest is ActionManifest<Tv2ActionManifestOverlayGraphicsData> => OVERLAY_GRAPHICS_ACTION_MANIFEST_IDS.includes(actionManifest.actionId))
      .map(actionManifest => {
        const data: Tv2ActionManifestOverlayGraphicsData = actionManifest.data
        return {
          name: data.name,
          rank: data.rank,
          rundownId: actionManifest.rundownId,
          sourceLayerId: data.sourceLayerId,
          templateName: this.getTemplateName(data.name),
          displayText: this.getDisplayText(data.name),
          expectedDuration: data.expectedDuration,
          lifespan: this.getLifespan(data.lifespan),
          vcpId: Number(data.content?.path)
        }
      })
  }

  private getTemplateName(rawName: string): string {
    return rawName.split('-')[0].trim()
  }

  private getDisplayText(rawText: string): string {
    return rawText.split('-').slice(1).join('-').trim()
  }

  private getLifespan(lifespan: string | undefined): PieceLifespan | undefined {
    switch (lifespan) {
      case 'rundown-change': {
        return PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE
      }
      case 'segment-end': {
        return PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE
      }
      case 'part-only': {
        return PieceLifespan.WITHIN_PART
      }
      default: {
        return
      }
    }
  }
}
