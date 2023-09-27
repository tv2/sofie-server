import { BlueprintOnTimelineGenerate } from '../../model/value-objects/blueprint'
import { RundownPersistentState } from '../../model/value-objects/rundown-persistent-state'
import { Part } from '../../model/entities/part'
import { Tv2SisyfosLayer } from './value-objects/tv2-layers'
import { Tv2MediaPlayerSession, Tv2RundownPersistentState } from './value-objects/tv2-rundown-persistent-state'
import { TimelineObject, TimelineObjectGroup } from '../../model/entities/timeline-object'
import { Tv2PartEndState } from './value-objects/tv2-part-end-state'
import { Tv2SisyfosPersistentLayerFinder } from './helpers/tv2-sisyfos-persistent-layer-finder'
import { UnsupportedOperation } from '../../model/exceptions/unsupported-operation'
import { Tv2BlueprintTimelineObject, Tv2PieceMetadata } from './value-objects/tv2-meta-data'
import { Tv2MediaPlayer, Tv2StudioBlueprintConfiguration } from './value-objects/tv2-studio-blueprint-configuration'
import { Timeline } from '../../model/entities/timeline'
import { DeviceType } from '../../model/enums/device-type'
import { AtemAuxTimelineObject, AtemMeTimelineObject, AtemType } from '../timeline-state-resolver-types/atem-types'
import { A_B_SOURCE_LAYERS } from './value-objects/tv2-a-b-source-layers'
import { Configuration } from '../../model/entities/configuration'
import { Tv2BlueprintConfiguration } from './value-objects/tv2-blueprint-configuration'
import { Tv2ShowStyleBlueprintConfiguration } from './value-objects/tv2-show-style-blueprint-configuration'
import { SisyfosChannelsTimelineObject, SisyfosType } from '../timeline-state-resolver-types/sisyfos-types'
import { OnTimelineGenerateResult } from '../../model/value-objects/on-timeline-generate-result'

const ACTIVE_GROUP_PREFIX: string = 'active_group_'
const LOOKAHEAD_GROUP_ID: string = 'lookahead_group'
const PREVIOUS_GROUP_PREFIX: string = 'previous_group_'

export class Tv2OnTimelineGenerateService implements BlueprintOnTimelineGenerate {
  constructor(private readonly sisyfosPersistentLayerFinder: Tv2SisyfosPersistentLayerFinder) {}

  public onTimelineGenerate(
    configuration: Configuration,
    timeline: Timeline,
    activePart: Part,
    previousRundownPersistentState: RundownPersistentState | undefined,
    previousPart: Part | undefined,
  ): OnTimelineGenerateResult {
    const blueprintConfiguration: Tv2BlueprintConfiguration = {
      studio: configuration.studio.blueprintConfiguration as Tv2StudioBlueprintConfiguration,
      showStyle: configuration.showStyle.blueprintConfiguration as Tv2ShowStyleBlueprintConfiguration
    }

    const rundownPersistentState: Tv2RundownPersistentState = (previousRundownPersistentState ?? this.getEmptyTv2RundownPersistentState()) as Tv2RundownPersistentState
    const newRundownPersistentState: Tv2RundownPersistentState = {
      activeMediaPlayerSessions: [],
      isNewSegment: previousPart?.getSegmentId() !== activePart.getSegmentId(),
    }

    this.assignSisyfosPersistMetadata(newRundownPersistentState, activePart, previousPart, timeline)

    newRundownPersistentState.activeMediaPlayerSessions = this.assignMediaPlayerSessions(rundownPersistentState.activeMediaPlayerSessions, timeline, blueprintConfiguration)

    return { rundownPersistentState: newRundownPersistentState, timeline }
  }

  private getEmptyTv2RundownPersistentState(): Tv2RundownPersistentState {
    return {
      activeMediaPlayerSessions: [],
      isNewSegment: false
    }
  }

  private assignSisyfosPersistMetadata(rundownPersistentState: Tv2RundownPersistentState, activePart: Part, previousPart: Part | undefined, timeline: Timeline): void {
    if (rundownPersistentState.isNewSegment && !this.isAnySisyfosPieceInjectedIntoPart(activePart)) {
      return
    }

    const sisyfosPersistedLevelsTimelineObject: TimelineObject =
      this.createSisyfosPersistedLevelsTimelineObject(activePart, previousPart, rundownPersistentState)
    const activeTimelineObjectGroup: TimelineObjectGroup | undefined = timeline.timelineGroups.find(
      (timelineObject) => timelineObject.id.includes('active_group_')
    )
    if (!activeTimelineObjectGroup) {
      throw new UnsupportedOperation('No active group found. This should not be possible')
    }
    activeTimelineObjectGroup.children.push(sisyfosPersistedLevelsTimelineObject)
  }

  private isAnySisyfosPieceInjectedIntoPart(part: Part): boolean {
    // TODO: This is a hacky way to check if a Piece is an AdLib. It should not be hidden away in meta data for Sisyfos...
    return part.getPieces().some((piece) => {
      const pieceMetadata: Tv2PieceMetadata = piece.metadata as Tv2PieceMetadata
      return pieceMetadata && pieceMetadata.sisyfosPersistMetaData?.isModifiedOrInsertedByAction
    })
  }

  private createSisyfosPersistedLevelsTimelineObject(
    part: Part,
    previousPart: Part | undefined,
    rundownPersistentState: Tv2RundownPersistentState
  ): SisyfosChannelsTimelineObject {
    const previousPartEndState: Tv2PartEndState = previousPart?.getEndState() as Tv2PartEndState
    const layersWantingToPersistFromPreviousPart: string[] =
        previousPartEndState && !rundownPersistentState.isNewSegment
          ? previousPartEndState.sisyfosPersistenceMetadata.sisyfosLayers
          : []
    const layersToPersist: string[] = this.sisyfosPersistentLayerFinder.findLayersToPersist(
      part,
      undefined,
      layersWantingToPersistFromPreviousPart
    )
    return {
      id: 'sisyfosPersistenceObject',
      enable: {
        start: 0,
      },
      layer: Tv2SisyfosLayer.PERSISTED_LEVELS,
      content: {
        deviceType: DeviceType.SISYFOS,
        type: SisyfosType.CHANNELS,
        overridePriority: 1,
        channels: layersToPersist.map((layer) => ({
          mappedLayer: layer,
          isPgm: 1,
        })),
      },
    }
  }

  private assignMediaPlayerSessions(assignedMediaPlayerSessions: Tv2MediaPlayerSession[], timeline: Timeline, configuration: Tv2BlueprintConfiguration): Tv2MediaPlayerSession[] {
    const previousGroup: TimelineObjectGroup | undefined = timeline.timelineGroups.find(group => group.id.includes(PREVIOUS_GROUP_PREFIX))
    if (previousGroup) {
      const mediaPlayerSessionsInUseByPreviousGroup: Tv2MediaPlayerSession[] = this.findPreviousAssignedMediaPlayerSessionsStillInUseForGroup(assignedMediaPlayerSessions, previousGroup)
      this.assignMediaPlayersForPreviousGroup(previousGroup, mediaPlayerSessionsInUseByPreviousGroup)
    }

    const activeGroup: TimelineObjectGroup | undefined = timeline.timelineGroups.find(group => group.id.includes(ACTIVE_GROUP_PREFIX))
    const lookaheadGroup: TimelineObjectGroup | undefined = timeline.timelineGroups.find(group => group.id.includes(LOOKAHEAD_GROUP_ID))
    if (!activeGroup || !lookaheadGroup) {
      throw new UnsupportedOperation('No Active or Lookahead Group found. This shouldn\'t be possible!')
    }

    const mediaPlayerSessionsInUse: Tv2MediaPlayerSession[] = this.findPreviousAssignedMediaPlayerSessionsStillInUseForGroup(assignedMediaPlayerSessions, activeGroup)
    const availableMediaPlayers: Tv2MediaPlayer[] = configuration.studio.ABMediaPlayers.filter(mediaPlayer => !mediaPlayerSessionsInUse.some(session => session.mediaPlayer._id === mediaPlayer._id))

    this.assignMediaPlayersForGroup(activeGroup, mediaPlayerSessionsInUse, availableMediaPlayers)
    this.assignMediaPlayersForGroup(lookaheadGroup, mediaPlayerSessionsInUse, availableMediaPlayers)

    return mediaPlayerSessionsInUse
  }

  private assignMediaPlayersForPreviousGroup(previousGroup: TimelineObjectGroup, mediaPlayerSessionsInUse: Tv2MediaPlayerSession[]): void {
    const timelineObjects: TimelineObject[] = this.flattenNestedTimelineObjectChildren(previousGroup)
    timelineObjects.forEach(timelineObject => {
      const blueprintTimelineObject: Tv2BlueprintTimelineObject = timelineObject as Tv2BlueprintTimelineObject
      if (!blueprintTimelineObject.metaData || !blueprintTimelineObject.metaData.mediaPlayerSession) {
        return
      }
      const mediaPlayerSessionInUse: Tv2MediaPlayerSession | undefined = mediaPlayerSessionsInUse.find(session => session.sessionId === blueprintTimelineObject.metaData?.mediaPlayerSession)
      if (!mediaPlayerSessionInUse) {
        return
      }
      this.updateTimelineObjectWithMediaPlayer(blueprintTimelineObject, mediaPlayerSessionInUse.mediaPlayer)
    })
  }

  private assignMediaPlayersForGroup(group: TimelineObjectGroup, mediaPlayerSessionsInUse: Tv2MediaPlayerSession[], availableMediaPlayers: Tv2MediaPlayer[]): void {
    const timelineObjects: TimelineObject[] = this.flattenNestedTimelineObjectChildren(group)
    timelineObjects.forEach(timelineObject => {
      const blueprintTimelineObject: Tv2BlueprintTimelineObject = timelineObject as Tv2BlueprintTimelineObject
      if (!blueprintTimelineObject.metaData || !blueprintTimelineObject.metaData.mediaPlayerSession) {
        return
      }
      const mediaPlayerSessionInUse: Tv2MediaPlayerSession | undefined = mediaPlayerSessionsInUse.find(session => session.sessionId === blueprintTimelineObject.metaData?.mediaPlayerSession)
      if (mediaPlayerSessionInUse) {
        this.updateTimelineObjectWithMediaPlayer(blueprintTimelineObject, mediaPlayerSessionInUse.mediaPlayer)
        return
      }
      const mediaPlayer: Tv2MediaPlayer | undefined = availableMediaPlayers.pop()
      if (!mediaPlayer) {
        return
      }
      mediaPlayerSessionsInUse.push({
        mediaPlayer,
        sessionId: blueprintTimelineObject.metaData.mediaPlayerSession
      })
      this.updateTimelineObjectWithMediaPlayer(blueprintTimelineObject, mediaPlayer)
    })
  }

  private findPreviousAssignedMediaPlayerSessionsStillInUseForGroup(assignedMediaPlayerSessions: Tv2MediaPlayerSession[], group: TimelineObjectGroup): Tv2MediaPlayerSession[] {
    return assignedMediaPlayerSessions.filter(mediaPlayerSession => {
      return group.children.some(child => this.doesTimelineObjectHaveMediaPlayerSessionWithId(child, mediaPlayerSession.sessionId))
    })
  }

  private doesTimelineObjectHaveMediaPlayerSessionWithId(timelineObject: TimelineObject, sessionId: string): boolean {
    const doesChildrenHaveMediaPlayerSession: boolean =
      timelineObject.children?.some((child: TimelineObject) => this.doesTimelineObjectHaveMediaPlayerSessionWithId(child, sessionId))
      ?? false
    const blueprintTimelineObject: Tv2BlueprintTimelineObject = timelineObject as Tv2BlueprintTimelineObject
    const hasMediaPlayerSession: boolean = blueprintTimelineObject.metaData?.mediaPlayerSession === sessionId

    return hasMediaPlayerSession || doesChildrenHaveMediaPlayerSession
  }

  private flattenNestedTimelineObjectChildren(timelineObject: TimelineObject): TimelineObject[] {
    if (timelineObject.children) {
      return timelineObject.children.flatMap((child: TimelineObject) => this.flattenNestedTimelineObjectChildren(child))
    }
    return [timelineObject]
  }

  private updateTimelineObjectWithMediaPlayer(timelineObject: Tv2BlueprintTimelineObject, mediaPlayer: Tv2MediaPlayer): void {
    switch (timelineObject.content.deviceType) {
      case DeviceType.CASPAR_CG: {
        this.updateCasparCgProgramWithMediaPlayer(timelineObject, mediaPlayer)
        this.updateCasparCgLookaheadWithMediaPlayer(timelineObject, mediaPlayer)
        break
      }
      case DeviceType.ATEM: { // TODO: Fully implement VideoSwitcher composition strategy
        this.updateAtemProgramWithMediaPlayer(timelineObject, mediaPlayer)
        this.updateAtemLookaheadWithMediaPlayer(timelineObject, mediaPlayer)
        // TODO: Implement for DVEs
        break
      }
      case DeviceType.SISYFOS: {
        this.updateSisyfosTimelineObjectWithMediaPlayer(timelineObject, mediaPlayer)
        break
      }
    }
  }

  private getCasparCgPlayerClipLayer(mediaPlayer: Tv2MediaPlayer): string {
    return `casparcg_player_clip_${mediaPlayer.SourceName}`
  }


  private updateCasparCgProgramWithMediaPlayer(timelineObject: Tv2BlueprintTimelineObject, mediaPlayer: Tv2MediaPlayer): void {
    if (timelineObject.content.deviceType !== DeviceType.CASPAR_CG) {
      return
    }
    if (timelineObject.layer !== A_B_SOURCE_LAYERS.caspar.clipPending) {
      return
    }
    timelineObject.layer = this.getCasparCgPlayerClipLayer(mediaPlayer)
  }

  private updateCasparCgLookaheadWithMediaPlayer(timelineObject: Tv2BlueprintTimelineObject, mediaPlayer: Tv2MediaPlayer): void {
    if (timelineObject.content.deviceType !== DeviceType.CASPAR_CG) {
      return
    }
    if (!timelineObject.lookaheadForLayer || timelineObject.lookaheadForLayer !== A_B_SOURCE_LAYERS.caspar.clipPending) {
      return
    }
    timelineObject.layer = `${this.getCasparCgPlayerClipLayer(mediaPlayer)}_lookahead`
    timelineObject.lookaheadForLayer = this.getCasparCgPlayerClipLayer(mediaPlayer)
  }

  private updateAtemProgramWithMediaPlayer(timelineObject: Tv2BlueprintTimelineObject, mediaPlayer: Tv2MediaPlayer): void {
    if (timelineObject.content.deviceType !== DeviceType.ATEM || timelineObject.content.type !== AtemType.ME) {
      return
    }
    const atemMeTimelineObject: AtemMeTimelineObject = timelineObject as AtemMeTimelineObject
    atemMeTimelineObject.content.me.input = mediaPlayer.SwitcherSource
  }

  private updateAtemLookaheadWithMediaPlayer(timelineObject: Tv2BlueprintTimelineObject, mediaPlayer: Tv2MediaPlayer): void {
    if (timelineObject.content.deviceType !== DeviceType.ATEM || timelineObject.content.type !== AtemType.AUX) {
      return
    }
    const atemAuxTimelineObject: AtemAuxTimelineObject = timelineObject as AtemAuxTimelineObject
    atemAuxTimelineObject.content.aux.input = mediaPlayer.SwitcherSource
  }

  private updateSisyfosTimelineObjectWithMediaPlayer(timelineObject: Tv2BlueprintTimelineObject, mediaPlayer: Tv2MediaPlayer): void {
    if (timelineObject.content.deviceType !== DeviceType.SISYFOS) {
      return
    }
    const targetLayer: string = mediaPlayer.SourceName === '1' ? A_B_SOURCE_LAYERS.sisyfos.playerA : A_B_SOURCE_LAYERS.sisyfos.playerB
    if (timelineObject.layer === A_B_SOURCE_LAYERS.sisyfos.clipPending) {
      timelineObject.layer = targetLayer
    }
    if (timelineObject.lookaheadForLayer && timelineObject.lookaheadForLayer === A_B_SOURCE_LAYERS.sisyfos.clipPending) {
      timelineObject.layer = timelineObject.layer.replace(timelineObject.lookaheadForLayer, targetLayer)
      timelineObject.lookaheadForLayer = targetLayer
    }
  }
}
